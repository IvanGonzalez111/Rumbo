import { bearerToken, resolveSession } from "./session.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = await resolveSession(bearerToken(req));
    if (!auth) return res.status(401).json({ error: "Tu sesión venció. Volvé a iniciar sesión." });
    req.auth = auth;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireWritable(req, res, next) {
  if (req.auth?.session?.readOnly) {
    return res.status(403).json({ error: "Este recorrido es solo para explorar." });
  }
  return next();
}
