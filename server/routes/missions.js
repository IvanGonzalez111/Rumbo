import express from "express";
import { createId, readData, updateData } from "../db.js";
import { generateStamp } from "../aiService.js";
import { requireAuth, requireWritable } from "../authMiddleware.js";
import {
  hydrateMissionsMedia,
  isPersistentStorageConfigured,
  missionStoragePaths,
  removeStoredMedia,
  uploadDataUrl
} from "../storage.js";
import { applyShowcaseMediaFallback, isShowcaseAccount } from "../showcaseMedia.js";

const router = express.Router();
router.use(requireAuth);

function ownedMission(data, missionId, userId) {
  const mission = data.missions.find((item) => item.id === missionId);
  const trip = mission && data.trips.find((item) => item.id === mission.tripId && item.userId === userId);
  return trip ? { mission, trip } : null;
}

function normalizeMediaPosition(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 50;
}

router.get("/trips/:tripId/missions", async (req, res) => {
  const data = await readData();
  const trip = data.trips.find((item) => item.id === req.params.tripId && item.userId === req.auth.user.id);
  if (!trip) return res.status(404).json({ error: "Viaje no encontrado." });
  const hydratedMissions = await hydrateMissionsMedia(data.missions.filter((mission) => mission.tripId === trip.id));
  const missions = applyShowcaseMediaFallback(hydratedMissions, isShowcaseAccount(req.auth));
  return res.json({ missions });
});

router.patch("/missions/:missionId/complete", requireWritable, async (req, res) => {
  const {
    note,
    mood,
    moods,
    memoryText,
    photoDataUrl,
    mediaDataUrl,
    mediaType,
    posterDataUrl,
    mediaPositionX,
    mediaPositionY
  } = req.body;
  const selectedMoods = (Array.isArray(moods) ? moods : mood ? String(mood).split(",") : [])
    .map((item) => String(item).trim())
    .filter(Boolean);
  const evidenceDataUrl = mediaDataUrl || photoDataUrl || "";
  const evidenceType = mediaType || (evidenceDataUrl.startsWith("data:video/") ? "video" : evidenceDataUrl ? "image" : "");
  const initialData = await readData();
  const owned = ownedMission(initialData, req.params.missionId, req.auth.user.id);
  if (!owned) return res.status(404).json({ error: "Misión no encontrada." });
  const keepsStoredEvidence = isPersistentStorageConfigured
    && Boolean(owned.mission.mediaPath)
    && /^https:\/\//.test(evidenceDataUrl);
  const keepsStoredPoster = isPersistentStorageConfigured
    && Boolean(owned.mission.posterPath)
    && (!posterDataUrl || /^https:\/\//.test(posterDataUrl));

  if (!note?.trim() || !selectedMoods.length) {
    return res.status(400).json({ error: "La nota y al menos una emoción son obligatorias para completar una misión." });
  }

  const validImage = evidenceType === "image" && (
    keepsStoredEvidence || (evidenceDataUrl.startsWith("data:image/") && evidenceDataUrl.length <= 2_500_000)
  );
  const validVideo = evidenceType === "video" && (
    keepsStoredEvidence || (evidenceDataUrl.startsWith("data:video/") && evidenceDataUrl.length <= 56_000_000)
  );

  if (evidenceDataUrl && !validImage && !validVideo) {
    return res.status(400).json({ error: "La evidencia no tiene un formato válido o es demasiado grande." });
  }

  const validPoster = !posterDataUrl
    || keepsStoredPoster
    || (posterDataUrl.startsWith("data:image/") && posterDataUrl.length <= 2_500_000);
  if (!validPoster) {
    return res.status(400).json({ error: "La vista previa del video no tiene un formato válido." });
  }

  const previousPaths = missionStoragePaths(owned.mission);
  let mediaPath = keepsStoredEvidence ? owned.mission.mediaPath : "";
  let posterPath = keepsStoredEvidence && keepsStoredPoster ? owned.mission.posterPath : "";

  if (isPersistentStorageConfigured && evidenceDataUrl.startsWith("data:")) {
    mediaPath = await uploadDataUrl(evidenceDataUrl, {
      userId: req.auth.user.id,
      tripId: owned.trip.id,
      missionId: owned.mission.id,
      label: evidenceType
    });

    if (evidenceType === "video" && posterDataUrl) {
      posterPath = await uploadDataUrl(posterDataUrl, {
        userId: req.auth.user.id,
        tripId: owned.trip.id,
        missionId: owned.mission.id,
        label: "poster"
      });
    }
  }

  let result;
  try {
    result = await updateData(async (data) => {
    const ownedCurrent = ownedMission(data, req.params.missionId, req.auth.user.id);
    const mission = ownedCurrent?.mission;
    if (!mission) return null;
    const existingStamp = data.stamps.find((stamp) => stamp.missionId === mission.id);

    mission.status = "completed";
    mission.note = note.trim();
    mission.mood = selectedMoods.join(", ");
    mission.moods = selectedMoods;
    mission.memoryText = memoryText?.trim() || "";
    mission.mediaDataUrl = isPersistentStorageConfigured ? "" : evidenceDataUrl;
    mission.mediaType = evidenceType;
    mission.photoDataUrl = !isPersistentStorageConfigured && evidenceType === "image" ? evidenceDataUrl : "";
    mission.posterDataUrl = !isPersistentStorageConfigured && evidenceType === "video" ? posterDataUrl || "" : "";
    mission.mediaPath = mediaPath;
    mission.posterPath = posterPath;
    mission.mediaPositionX = normalizeMediaPosition(mediaPositionX);
    mission.mediaPositionY = normalizeMediaPosition(mediaPositionY);
    mission.completedAt = new Date().toISOString();

    if (existingStamp) {
      existingStamp.memoryDescription = mission.note;
      existingStamp.category = mission.category;
      return { mission, stamp: existingStamp, ai: { source: "saved", warning: null } };
    }

    const stampResult = await generateStamp(mission, mission.note, mission.mood);
    const stamp = {
      id: createId("stamp"),
      tripId: mission.tripId,
      missionId: mission.id,
      name: stampResult.data.name || mission.suggestedStamp || "Sello desbloqueado",
      phrase: stampResult.data.phrase || "Este recuerdo ya tiene sello.",
      memoryDescription: stampResult.data.memoryDescription || mission.note,
      category: mission.category,
      source: stampResult.source,
      createdAt: new Date().toISOString()
    };

    data.stamps.push(stamp);
    return { mission, stamp, ai: { source: stampResult.source, warning: stampResult.warning || null } };
    });
  } catch (error) {
    await removeStoredMedia([mediaPath, posterPath]);
    throw error;
  }

  if (!result) {
    await removeStoredMedia([mediaPath, posterPath]);
    return res.status(404).json({ error: "Mision no encontrada." });
  }

  await removeStoredMedia(previousPaths.filter((item) => item !== mediaPath && item !== posterPath));
  [result.mission] = await hydrateMissionsMedia([result.mission]);
  return res.json(result);
});

router.patch("/missions/:missionId/reset", requireWritable, async (req, res) => {
  const initialData = await readData();
  const owned = ownedMission(initialData, req.params.missionId, req.auth.user.id);
  if (!owned) return res.status(404).json({ error: "Misión no encontrada." });
  const storedPaths = missionStoragePaths(owned.mission);

  const result = await updateData((data) => {
    const mission = ownedMission(data, req.params.missionId, req.auth.user.id)?.mission;
    if (!mission) return null;

    mission.status = "pending";
    mission.note = "";
    mission.mood = "";
    mission.moods = [];
    mission.memoryText = "";
    mission.photoDataUrl = "";
    mission.mediaDataUrl = "";
    mission.mediaType = "";
    mission.posterDataUrl = "";
    mission.mediaPath = "";
    mission.posterPath = "";
    mission.mediaPositionX = 50;
    mission.mediaPositionY = 50;
    mission.completedAt = null;

    data.stamps = data.stamps.filter((stamp) => stamp.missionId !== mission.id);
    data.travelLogs = data.travelLogs.filter((log) => log.tripId !== mission.tripId);

    const trip = data.trips.find((item) => item.id === mission.tripId);
    if (trip) trip.status = "active";

    return { mission };
  });

  if (!result) {
    return res.status(404).json({ error: "Misión no encontrada." });
  }

  await removeStoredMedia(storedPaths);

  return res.json(result);
});

export default router;
