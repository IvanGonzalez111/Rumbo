import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isSupabaseConfigured, supabase } from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const CUSTOM_DATA_FILE = process.env.RUMBO_DATA_FILE?.trim();
const DATA_FILE = CUSTOM_DATA_FILE ? path.resolve(CUSTOM_DATA_FILE) : path.join(DATA_DIR, "rumbo.json");
const LEGACY_DATA_FILE = path.join(DATA_DIR, `${["ruta", "viva"].join("-")}.json`);

const initialData = {
  users: [],
  trips: [],
  missions: [],
  stamps: [],
  travelLogs: [],
  sessions: []
};

const remoteCollections = [
  { key: "users", table: "rumbo_users", columns: (item) => ({ email: item.email }) },
  { key: "trips", table: "rumbo_trips", columns: (item) => ({ user_id: item.userId }) },
  { key: "missions", table: "rumbo_missions", columns: (item) => ({ trip_id: item.tripId }) },
  {
    key: "stamps",
    table: "rumbo_stamps",
    columns: (item) => ({ trip_id: item.tripId, mission_id: item.missionId || null })
  },
  { key: "travelLogs", table: "rumbo_travel_logs", columns: (item) => ({ trip_id: item.tripId }) },
  {
    key: "sessions",
    table: "rumbo_sessions",
    columns: (item) => ({ user_id: item.userId, expires_at: item.expiresAt })
  }
];

let updateQueue = Promise.resolve();

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    if (!CUSTOM_DATA_FILE) {
      try {
        await fs.rename(LEGACY_DATA_FILE, DATA_FILE);
        return;
      } catch {
        // Create a new local database below.
      }
    }
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export async function readData() {
  if (isSupabaseConfigured) return readSupabaseData();
  return readLocalData();
}

export async function readLocalData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");

  try {
    return { ...initialData, ...JSON.parse(raw) };
  } catch {
    return structuredClone(initialData);
  }
}

export async function writeData(data) {
  if (isSupabaseConfigured) return syncDataToSupabase(data);
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  return data;
}

export async function updateData(mutator) {
  const operation = updateQueue.then(async () => {
    const data = await readData();
    const before = isSupabaseConfigured ? structuredClone(data) : null;
    const result = await mutator(data);
    if (isSupabaseConfigured) {
      await syncChangesToSupabase(before, data);
    } else {
      await writeData(data);
    }
    return result;
  });

  updateQueue = operation.catch(() => undefined);
  return operation;
}

async function readSupabaseData() {
  const results = await Promise.all(
    remoteCollections.map(async ({ key, table }) => {
      const { data, error } = await supabase.from(table).select("payload");
      if (error) throw new Error(`No se pudo leer ${table}: ${error.message}`);
      return [key, (data || []).map((row) => row.payload)];
    })
  );

  return { ...structuredClone(initialData), ...Object.fromEntries(results) };
}

async function upsertCollection({ key, table, columns }, items) {
  if (!items.length) return;

  const rows = items.map((item) => ({
    id: item.id,
    ...columns(item),
    payload: item
  }));

  for (let index = 0; index < rows.length; index += 100) {
    const { error } = await supabase.from(table).upsert(rows.slice(index, index + 100), { onConflict: "id" });
    if (error) throw new Error(`No se pudo guardar ${key}: ${error.message}`);
  }
}

async function deleteStaleCollection({ key, table }, items) {
  const expectedIds = new Set(items.map((item) => item.id));
  const { data, error } = await supabase.from(table).select("id");
  if (error) throw new Error(`No se pudo verificar ${key}: ${error.message}`);

  const staleIds = (data || []).map((row) => row.id).filter((id) => !expectedIds.has(id));
  for (let index = 0; index < staleIds.length; index += 100) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", staleIds.slice(index, index + 100));
    if (deleteError) throw new Error(`No se pudo limpiar ${key}: ${deleteError.message}`);
  }
}

async function deleteCollectionIds({ key, table }, ids) {
  for (let index = 0; index < ids.length; index += 100) {
    const { error } = await supabase.from(table).delete().in("id", ids.slice(index, index + 100));
    if (error) throw new Error(`No se pudo limpiar ${key}: ${error.message}`);
  }
}

async function syncChangesToSupabase(before, after) {
  const changedByKey = new Map();
  const deletedByKey = new Map();

  for (const collection of remoteCollections) {
    const previous = new Map(before[collection.key].map((item) => [item.id, item]));
    const current = new Map(after[collection.key].map((item) => [item.id, item]));
    const changed = after[collection.key].filter((item) => {
      const oldItem = previous.get(item.id);
      return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(item);
    });
    const deleted = [...previous.keys()].filter((id) => !current.has(id));
    changedByKey.set(collection.key, changed);
    deletedByKey.set(collection.key, deleted);
  }

  for (const collection of remoteCollections) {
    await upsertCollection(collection, changedByKey.get(collection.key));
  }
  for (const collection of [...remoteCollections].reverse()) {
    await deleteCollectionIds(collection, deletedByKey.get(collection.key));
  }
}

export async function syncDataToSupabase(data) {
  if (!isSupabaseConfigured) throw new Error("Supabase no está configurado.");
  const normalized = { ...structuredClone(initialData), ...data };

  for (const collection of remoteCollections) {
    await upsertCollection(collection, normalized[collection.key]);
  }

  for (const collection of [...remoteCollections].reverse()) {
    await deleteStaleCollection(collection, normalized[collection.key]);
  }

  return normalized;
}

export function getPersistenceMode() {
  return isSupabaseConfigured ? "supabase" : "json";
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}
