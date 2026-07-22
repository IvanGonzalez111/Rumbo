import express from "express";
import { createId, publicUser, readData, updateData } from "../db.js";
import { hashPassword, verifyPassword } from "../security.js";
import { bearerToken, createSession, revokeSession } from "../session.js";

const router = express.Router();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ error: "El email no tiene un formato valido." });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await updateData((data) => {
    const exists = data.users.some((item) => item.email === normalizedEmail);
    if (exists) return null;

    const { hash, salt } = hashPassword(password);
    const created = {
      id: createId("usr"),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString()
    };

    data.users.push(created);
    return created;
  });

  if (!user) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
  }

  const { token } = await createSession(user.id);
  return res.status(201).json({ user: publicUser(user), token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios." });
  }

  const data = await readData();
  const user = data.users.find((item) => item.email === email.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: "Credenciales incorrectas." });
  }

  const { token } = await createSession(user.id);
  return res.json({ user: publicUser(user), token });
});

router.get("/showcase", async (_req, res) => {
  const showcaseEmail = (process.env.SHOWCASE_USER_EMAIL || "nose@gmail.com").trim().toLowerCase();
  const data = await readData();
  const user = data.users.find((item) => item.email === showcaseEmail);

  if (!user) {
    return res.status(404).json({ error: "El recorrido de muestra no está disponible." });
  }

  const { token } = await createSession(user.id, { readOnly: true, showcase: true, hours: 12 });
  return res.json({
    user: {
      ...publicUser(user),
      readOnly: true,
      showcase: true
    },
    token
  });
});

router.post("/logout", async (req, res) => {
  await revokeSession(bearerToken(req));
  return res.status(204).end();
});

export default router;
