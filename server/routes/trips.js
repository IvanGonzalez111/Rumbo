import express from "express";
import { createId, readData, updateData } from "../db.js";
import { requireAuth, requireWritable } from "../authMiddleware.js";
import { hydrateMissionsMedia, missionStoragePaths, removeStoredMedia } from "../storage.js";

const router = express.Router();
router.use(requireAuth);

function parseInterests(interests) {
  if (Array.isArray(interests)) {
    return interests.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof interests === "string") {
    return interests
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseTravelStyles(travelStyles, travelStyle) {
  const values = Array.isArray(travelStyles)
    ? travelStyles
    : typeof travelStyles === "string"
      ? [travelStyles]
      : travelStyle
        ? [travelStyle]
        : [];

  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeEnergy(energyLevel, fallbackEnergy) {
  const fallbackLevels = { baja: 20, media: 50, alta: 80 };
  const parsedLevel = Number(energyLevel);
  const level = Number.isFinite(parsedLevel)
    ? Math.min(100, Math.max(1, Math.round(parsedLevel)))
    : fallbackLevels[fallbackEnergy] || 50;
  const label = level <= 33 ? "baja" : level <= 66 ? "media" : "alta";

  return { level, label };
}

router.get("/", async (req, res) => {
  const data = await readData();
  const userTrips = data.trips.filter((trip) => trip.userId === req.auth.user.id);
  const coverMissions = userTrips.map((trip) => {
    const missions = data.missions.filter((mission) => mission.tripId === trip.id);
    return missions
      .filter((mission) => mission.status === "completed" && (mission.photoDataUrl || mission.posterDataUrl || mission.mediaPath || mission.posterPath))
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))[0];
  }).filter(Boolean);
  const hydratedCovers = await hydrateMissionsMedia(coverMissions);
  const coversByTrip = new Map(hydratedCovers.map((mission) => [mission.tripId, mission]));

  const trips = userTrips
    .map((trip) => {
      const missions = data.missions.filter((mission) => mission.tripId === trip.id);
      const completedMissions = missions.filter((mission) => mission.status === "completed");
      const coverMission = coversByTrip.get(trip.id);

      return {
        ...trip,
        missionCount: missions.length,
        completedCount: completedMissions.length,
        stampCount: data.stamps.filter((stamp) => stamp.tripId === trip.id).length,
        hasTravelLog: data.travelLogs.some((log) => log.tripId === trip.id),
        coverPhotoDataUrl: coverMission?.photoDataUrl || coverMission?.posterDataUrl || "",
        coverPositionX: coverMission?.mediaPositionX ?? 50,
        coverPositionY: coverMission?.mediaPositionY ?? 50
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json({ trips });
});

router.post("/", requireWritable, async (req, res) => {
  const { name, destination, startDate, endDate, groupType, travelStyle, interests } = req.body;
  const userId = req.auth.user.id;
  const travelStyles = parseTravelStyles(req.body.travelStyles, travelStyle);
  const energy = normalizeEnergy(req.body.energyLevel, req.body.energy);

  if (!userId || !name?.trim() || !destination?.trim() || !groupType || !travelStyles.length) {
    return res.status(400).json({ error: "Faltan datos obligatorios del viaje." });
  }

  const trip = await updateData((data) => {
    const userExists = data.users.some((user) => user.id === userId);
    if (!userExists) return null;

    const created = {
      id: createId("trip"),
      userId,
      name: name.trim(),
      destination: destination.trim(),
      startDate: startDate || "",
      endDate: endDate || "",
      groupType,
      travelStyle: travelStyles[0],
      travelStyles,
      energy: energy.label,
      energyLevel: energy.level,
      interests: parseInterests(interests),
      status: "draft",
      createdAt: new Date().toISOString()
    };

    data.trips.push(created);
    return created;
  });

  if (!trip) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  return res.status(201).json({ trip });
});

router.get("/:tripId", async (req, res) => {
  const data = await readData();
  const trip = data.trips.find((item) => item.id === req.params.tripId && item.userId === req.auth.user.id);

  if (!trip) {
    return res.status(404).json({ error: "Viaje no encontrado." });
  }

  const missions = await hydrateMissionsMedia(data.missions.filter((mission) => mission.tripId === trip.id));
  return res.json({
    trip,
    missions,
    stamps: data.stamps.filter((stamp) => stamp.tripId === trip.id),
    travelLog: data.travelLogs.find((log) => log.tripId === trip.id) || null
  });
});

router.delete("/:tripId", requireWritable, async (req, res) => {
  const beforeDelete = await readData();
  const ownedTrip = beforeDelete.trips.find((item) => item.id === req.params.tripId && item.userId === req.auth.user.id);
  if (!ownedTrip) return res.status(404).json({ error: "Viaje no encontrado." });
  const storedPaths = beforeDelete.missions
    .filter((mission) => mission.tripId === ownedTrip.id)
    .flatMap(missionStoragePaths);

  const deletedTrip = await updateData((data) => {
    const trip = data.trips.find((item) => item.id === req.params.tripId && item.userId === req.auth.user.id);
    if (!trip) return null;

    data.trips = data.trips.filter((item) => item.id !== trip.id);
    data.missions = data.missions.filter((mission) => mission.tripId !== trip.id);
    data.stamps = data.stamps.filter((stamp) => stamp.tripId !== trip.id);
    data.travelLogs = data.travelLogs.filter((log) => log.tripId !== trip.id);
    return trip;
  });

  if (!deletedTrip) {
    return res.status(404).json({ error: "Viaje no encontrado." });
  }

  await removeStoredMedia(storedPaths);

  return res.json({ deletedTrip });
});

export default router;
