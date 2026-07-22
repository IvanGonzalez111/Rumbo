import path from "node:path";
import { isSupabaseConfigured, storageBucket, supabase } from "./supabase.js";

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm"
};

export const isPersistentStorageConfigured = isSupabaseConfigured;

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) throw new Error("La evidencia no tiene un formato válido.");

  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64")
  };
}

function cleanSegment(value) {
  return String(value || "item").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export async function uploadDataUrl(dataUrl, { userId, tripId, missionId, label }) {
  if (!isPersistentStorageConfigured || !dataUrl) return "";

  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const extension = MIME_EXTENSIONS[mimeType] || path.extname(mimeType.split("/")[1] || "") || "bin";
  const directory = [userId, tripId, missionId].map(cleanSegment).join("/");
  const filename = `${cleanSegment(label)}-${crypto.randomUUID()}.${cleanSegment(extension)}`;
  const objectPath = `${directory}/${filename}`;

  const { error } = await supabase.storage.from(storageBucket).upload(objectPath, buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false
  });

  if (error) throw new Error(`No se pudo guardar la evidencia: ${error.message}`);
  return objectPath;
}

export async function removeStoredMedia(paths) {
  if (!isPersistentStorageConfigured) return;
  const validPaths = [...new Set(paths.filter(Boolean))];
  if (!validPaths.length) return;

  const { error } = await supabase.storage.from(storageBucket).remove(validPaths);
  if (error) console.error("No se pudieron borrar algunos archivos de Storage:", error.message);
}

export function missionStoragePaths(mission) {
  return [mission?.mediaPath, mission?.posterPath].filter(Boolean);
}

export async function hydrateMissionsMedia(missions) {
  if (!isPersistentStorageConfigured || !missions.length) return missions;

  const paths = [...new Set(missions.flatMap(missionStoragePaths))];
  if (!paths.length) return missions;

  const { data, error } = await supabase.storage.from(storageBucket).createSignedUrls(paths, 60 * 60);
  if (error) {
    console.error("No se pudieron firmar las evidencias:", error.message);
    return missions;
  }

  const urls = new Map((data || []).map((item, index) => [paths[index], item.signedUrl || ""]));

  return missions.map((mission) => {
    const mediaUrl = urls.get(mission.mediaPath) || "";
    const posterUrl = urls.get(mission.posterPath) || "";

    return {
      ...mission,
      mediaDataUrl: mediaUrl || mission.mediaDataUrl || "",
      photoDataUrl: mission.mediaType === "image" ? mediaUrl || mission.photoDataUrl || "" : "",
      posterDataUrl: mission.mediaType === "video" ? posterUrl || mission.posterDataUrl || "" : ""
    };
  });
}
