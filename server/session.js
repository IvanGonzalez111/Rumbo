import crypto from "node:crypto";
import { publicUser, readData, updateData } from "./db.js";

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId, options = {}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + (options.hours || SESSION_DAYS * 24) * 60 * 60 * 1000).toISOString();
  const session = {
    id: hashToken(token),
    userId,
    readOnly: Boolean(options.readOnly),
    showcase: Boolean(options.showcase),
    createdAt: new Date(now).toISOString(),
    expiresAt
  };

  await updateData((data) => {
    data.sessions = data.sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
    data.sessions.push(session);
    return session;
  });

  return { token, session };
}

export async function resolveSession(token) {
  if (!token) return null;
  const data = await readData();
  const session = data.sessions.find((item) => item.id === hashToken(token));
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;

  const user = data.users.find((item) => item.id === session.userId);
  if (!user) return null;

  return {
    session,
    user: {
      ...publicUser(user),
      readOnly: session.readOnly,
      showcase: session.showcase
    }
  };
}

export async function revokeSession(token) {
  if (!token) return;
  const id = hashToken(token);
  await updateData((data) => {
    data.sessions = data.sessions.filter((item) => item.id !== id);
  });
}

export function bearerToken(req) {
  const value = req.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}
