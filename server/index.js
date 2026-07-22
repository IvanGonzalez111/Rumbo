import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";
import missionRoutes from "./routes/missions.js";
import aiRoutes from "./routes/ai.js";
import { getPersistenceMode } from "./db.js";
import { isPersistentStorageConfigured } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3012;

app.use(cors());
app.use(express.json({ limit: "60mb" }));
app.use(express.static(path.join(__dirname, "..", "public"), {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Expires", "0");
  }
}));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "Rumbo",
    aiFallback: process.env.AI_USE_FALLBACK !== "false",
    persistence: getPersistenceMode(),
    persistentMedia: isPersistentStorageConfigured
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api", missionRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "El archivo es demasiado grande. Los videos pueden pesar hasta 40 MB." });
  }
  console.error(error);
  res.status(500).json({ error: "Ocurrio un error inesperado." });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Rumbo disponible en http://localhost:${PORT}`);
  });
}

export default app;
