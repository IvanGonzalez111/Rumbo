import "dotenv/config";
import { readLocalData, syncDataToSupabase } from "../server/db.js";
import { isSupabaseConfigured } from "../server/supabase.js";
import { uploadDataUrl } from "../server/storage.js";

if (!isSupabaseConfigured) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.");
  process.exit(1);
}

const data = await readLocalData();
data.sessions = [];

let uploaded = 0;
for (const mission of data.missions) {
  const trip = data.trips.find((item) => item.id === mission.tripId);
  if (!trip) continue;

  const evidenceDataUrl = mission.mediaDataUrl || mission.photoDataUrl || "";
  if (evidenceDataUrl.startsWith("data:") && !mission.mediaPath) {
    mission.mediaPath = await uploadDataUrl(evidenceDataUrl, {
      userId: trip.userId,
      tripId: trip.id,
      missionId: mission.id,
      label: mission.mediaType || (evidenceDataUrl.startsWith("data:video/") ? "video" : "image")
    });
    uploaded += 1;
  }

  if (mission.posterDataUrl?.startsWith("data:") && !mission.posterPath) {
    mission.posterPath = await uploadDataUrl(mission.posterDataUrl, {
      userId: trip.userId,
      tripId: trip.id,
      missionId: mission.id,
      label: "poster"
    });
    uploaded += 1;
  }

  if (mission.mediaPath) {
    mission.mediaDataUrl = "";
    mission.photoDataUrl = "";
  }
  if (mission.posterPath) mission.posterDataUrl = "";

  if (uploaded && uploaded % 5 === 0) console.log(`${uploaded} archivos subidos...`);
}

await syncDataToSupabase(data);
console.log(`Migración completa: ${data.users.length} usuarios, ${data.trips.length} viajes y ${uploaded} archivos.`);
