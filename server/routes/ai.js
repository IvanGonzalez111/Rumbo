import express from "express";
import { createId, readData, updateData } from "../db.js";
import { generateMissions, generateStamp, generateTravelLog, regenerateMission } from "../aiService.js";
import { requireAuth, requireWritable } from "../authMiddleware.js";
import { missionStoragePaths, removeStoredMedia } from "../storage.js";

const router = express.Router();
router.use(requireAuth, requireWritable);

function ownsTrip(data, tripId, userId) {
  return data.trips.find((item) => item.id === tripId && item.userId === userId);
}

router.post("/missions", async (req, res) => {
  const { tripId } = req.body;

  if (!tripId) {
    return res.status(400).json({ error: "tripId es obligatorio." });
  }

  const data = await readData();
  const trip = ownsTrip(data, tripId, req.auth.user.id);

  if (!trip) {
    return res.status(404).json({ error: "Viaje no encontrado." });
  }

  const generated = await generateMissions(trip);
  const previousMediaPaths = data.missions
    .filter((mission) => mission.tripId === tripId)
    .flatMap(missionStoragePaths);
  const missions = (generated.data.missions || []).slice(0, 8).map((mission) => ({
    id: createId("mis"),
    tripId,
    title: mission.title || "Mision sin titulo",
    description: mission.description || "Registra un momento distinto del viaje.",
    category: mission.category || "memoria",
    difficulty: mission.difficulty || "suave",
    suggestedStamp: mission.suggestedStamp || "Recuerdo desbloqueado",
    status: "pending",
    note: "",
    mood: "",
    moods: [],
    memoryText: "",
    photoDataUrl: "",
    mediaDataUrl: "",
    mediaType: "",
    posterDataUrl: "",
    completedAt: null,
    createdAt: new Date().toISOString()
  }));

  if (!missions.length) {
    return res.status(502).json({ error: "No se pudieron generar misiones." });
  }

  await updateData((current) => {
    current.missions = current.missions.filter((mission) => mission.tripId !== tripId);
    current.stamps = current.stamps.filter((stamp) => stamp.tripId !== tripId);
    current.travelLogs = current.travelLogs.filter((log) => log.tripId !== tripId);
    current.missions.push(...missions);

    const currentTrip = current.trips.find((item) => item.id === tripId);
    if (currentTrip) currentTrip.status = "active";

    return missions;
  });

  await removeStoredMedia(previousMediaPaths);

  return res.status(201).json({
    missions,
    ai: { source: generated.source, warning: generated.warning || null }
  });
});

router.post("/missions/:missionId/regenerate", async (req, res) => {
  const data = await readData();
  const currentMission = data.missions.find((mission) => mission.id === req.params.missionId);
  const trip = currentMission && ownsTrip(data, currentMission.tripId, req.auth.user.id);

  if (!currentMission || !trip) {
    return res.status(404).json({ error: "Misión no encontrada." });
  }

  if (currentMission.status === "completed") {
    return res.status(409).json({ error: "Una misión completada conserva su recuerdo. Podés rehacerla antes de cambiarla." });
  }

  const tripMissions = data.missions.filter((mission) => mission.tripId === trip.id);
  const generated = await regenerateMission(trip, currentMission, tripMissions);
  const proposal = generated.data.mission;

  if (!proposal?.title || !proposal?.description) {
    return res.status(502).json({ error: "No se pudo crear una alternativa para esta misión." });
  }

  const mission = await updateData((current) => {
    const item = current.missions.find((candidate) => candidate.id === currentMission.id);
    const currentTrip = item && ownsTrip(current, item.tripId, req.auth.user.id);

    if (!item || !currentTrip || item.status === "completed") return null;

    item.title = proposal.title;
    item.description = proposal.description;
    item.category = proposal.category || "memoria";
    item.difficulty = proposal.difficulty || "suave";
    item.suggestedStamp = proposal.suggestedStamp || "Recuerdo desbloqueado";
    item.regeneratedAt = new Date().toISOString();
    return item;
  });

  if (!mission) {
    return res.status(409).json({ error: "La misión cambió mientras se generaba la alternativa. Volvé a intentarlo." });
  }

  return res.json({
    mission,
    ai: { source: generated.source, warning: generated.warning || null }
  });
});

router.post("/stamp", async (req, res) => {
  const { missionId, note, mood } = req.body;

  if (!missionId || !note?.trim() || !mood) {
    return res.status(400).json({ error: "missionId, nota y mood son obligatorios." });
  }

  const data = await readData();
  const mission = data.missions.find((item) => item.id === missionId);
  const trip = mission && ownsTrip(data, mission.tripId, req.auth.user.id);

  if (!mission || !trip) {
    return res.status(404).json({ error: "Mision no encontrada." });
  }

  const generated = await generateStamp(mission, note, mood);
  return res.json({ stamp: generated.data, ai: { source: generated.source, warning: generated.warning || null } });
});

router.post("/travel-log", async (req, res) => {
  const { tripId } = req.body;

  if (!tripId) {
    return res.status(400).json({ error: "tripId es obligatorio." });
  }

  const data = await readData();
  const trip = ownsTrip(data, tripId, req.auth.user.id);

  if (!trip) {
    return res.status(404).json({ error: "Viaje no encontrado." });
  }

  const completedMissions = data.missions.filter((mission) => mission.tripId === tripId && mission.status === "completed");
  const stamps = data.stamps.filter((stamp) => stamp.tripId === tripId);

  if (!completedMissions.length) {
    return res.status(400).json({ error: "Completá al menos una misión antes de generar la bitácora." });
  }

  const generated = await generateTravelLog(trip, completedMissions, stamps);
  const generatedMoments = Array.isArray(generated.data.bestMoments) ? generated.data.bestMoments : [];
  const bestMoments = completedMissions.map((mission, index) => (
    generatedMoments[index]
    || mission.note
    || mission.memoryText
    || mission.title
    || `Recuerdo ${index + 1}`
  ));
  const travelLog = {
    id: createId("log"),
    tripId,
    title: generated.data.title || `${trip.name} en modo aventura`,
    story: generated.data.story || "",
    bestMoments,
    awards: Array.isArray(generated.data.awards) ? generated.data.awards : [],
    memorablePhrases: Array.isArray(generated.data.memorablePhrases) ? generated.data.memorablePhrases : [],
    socialCaption: generated.data.socialCaption || "",
    source: generated.source,
    createdAt: new Date().toISOString()
  };

  await updateData((current) => {
    current.travelLogs = current.travelLogs.filter((log) => log.tripId !== tripId);
    current.travelLogs.push(travelLog);

    const currentTrip = current.trips.find((item) => item.id === tripId);
    if (currentTrip) currentTrip.status = "completed";

    return travelLog;
  });

  return res.status(201).json({
    travelLog,
    ai: { source: generated.source, warning: generated.warning || null }
  });
});

export default router;
