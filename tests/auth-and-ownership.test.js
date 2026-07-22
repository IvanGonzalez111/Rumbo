import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import test from "node:test";
import assert from "node:assert/strict";
import httpMocks from "node-mocks-http";

const testDir = await fs.mkdtemp(path.join(os.tmpdir(), "rumbo-test-"));
process.env.NODE_ENV = "test";
process.env.RUMBO_DATA_FILE = path.join(testDir, "rumbo.json");
process.env.SHOWCASE_USER_EMAIL = "ana@example.com";
process.env.AI_PROXY_API_KEY = "";
process.env.AI_PROXY_ENDPOINT = "";
process.env.AI_USE_FALLBACK = "true";

const { default: app } = await import("../server/index.js");
const { createId, updateData } = await import("../server/db.js");

async function call(method, url, { token = "", body = undefined } = {}) {
  const req = httpMocks.createRequest({
    method,
    url,
    body,
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} ${url} no respondió.`)), 5000);
    res.on("end", () => {
      clearTimeout(timer);
      resolve();
    });
    app.handle(req, res);
  });

  return {
    status: res.statusCode,
    body: res._isJSON() ? res._getJSONData() : res._getData()
  };
}

test.after(async () => {
  await fs.rm(testDir, { recursive: true, force: true });
});

test("las sesiones aíslan los viajes y el recorrido de muestra es solo lectura", async () => {
  const registerAna = await call("POST", "/api/auth/register", {
    body: { name: "Ana", email: "ana@example.com", password: "secreto" }
  });
  const registerBeto = await call("POST", "/api/auth/register", {
    body: { name: "Beto", email: "beto@example.com", password: "secreto" }
  });

  assert.equal(registerAna.status, 201);
  assert.equal(registerBeto.status, 201);
  assert.ok(registerAna.body.token);
  assert.ok(registerBeto.body.token);
  assert.equal(registerAna.body.user.passwordHash, undefined);
  assert.equal((await call("GET", "/api/trips")).status, 401);

  const created = await call("POST", "/api/trips", {
    token: registerAna.body.token,
    body: {
      name: "Viaje privado",
      destination: "Jujuy",
      groupType: "solo",
      travelStyles: ["aventura"],
      energyLevel: 50
    }
  });
  assert.equal(created.status, 201);

  const missionId = createId("mis");
  await updateData((data) => {
    data.missions.push({
      id: missionId,
      tripId: created.body.trip.id,
      title: "Misión privada",
      status: "pending",
      category: "fotográfica"
    });
  });

  const betoTrips = await call("GET", "/api/trips", { token: registerBeto.body.token });
  assert.equal(betoTrips.status, 200);
  assert.deepEqual(betoTrips.body.trips, []);

  assert.equal((await call("GET", `/api/trips/${created.body.trip.id}`, {
    token: registerBeto.body.token
  })).status, 404);
  assert.equal((await call("DELETE", `/api/trips/${created.body.trip.id}`, {
    token: registerBeto.body.token
  })).status, 404);
  assert.equal((await call("PATCH", `/api/missions/${missionId}/complete`, {
    token: registerBeto.body.token,
    body: { note: "No debería poder", moods: ["curioso"] }
  })).status, 404);
  assert.equal((await call("POST", "/api/ai/missions", {
    token: registerBeto.body.token,
    body: { tripId: created.body.trip.id }
  })).status, 404);

  const completed = await call("PATCH", `/api/missions/${missionId}/complete`, {
    token: registerAna.body.token,
    body: {
      note: "Un recuerdo que quiero conservar.",
      moods: ["curioso"]
    }
  });
  assert.equal(completed.status, 200);
  assert.equal(completed.body.mission.status, "completed");

  const tripAfterCompletion = await call("GET", `/api/trips/${created.body.trip.id}`, {
    token: registerAna.body.token
  });
  assert.equal(tripAfterCompletion.status, 200);
  assert.equal(tripAfterCompletion.body.missions[0].status, "completed");

  const showcase = await call("GET", "/api/auth/showcase");
  assert.equal(showcase.status, 200);
  assert.equal(showcase.body.user.readOnly, true);

  const showcaseWrite = await call("POST", "/api/trips", {
    token: showcase.body.token,
    body: {
      name: "No permitido",
      destination: "Roma",
      groupType: "solo",
      travelStyles: ["cultural"]
    }
  });
  assert.equal(showcaseWrite.status, 403);

  assert.equal((await call("POST", "/api/auth/logout", { token: registerAna.body.token })).status, 204);
  assert.equal((await call("GET", "/api/trips", { token: registerAna.body.token })).status, 401);
});

test("se puede regenerar una sola misión pendiente sin alterar las demás", async () => {
  const registered = await call("POST", "/api/auth/register", {
    body: { name: "Clara", email: "clara@example.com", password: "secreto" }
  });
  const created = await call("POST", "/api/trips", {
    token: registered.body.token,
    body: {
      name: "Escapada selectiva",
      destination: "Colonia",
      groupType: "pareja",
      travelStyles: ["cultural"],
      energyLevel: 45
    }
  });
  const generated = await call("POST", "/api/ai/missions", {
    token: registered.body.token,
    body: { tripId: created.body.trip.id }
  });

  assert.equal(generated.status, 201);
  assert.equal(generated.body.missions.length, 6);

  const [selected, ...untouched] = generated.body.missions;
  const regenerated = await call("POST", `/api/ai/missions/${selected.id}/regenerate`, {
    token: registered.body.token
  });

  assert.equal(regenerated.status, 200);
  assert.equal(regenerated.body.mission.id, selected.id);
  assert.notEqual(regenerated.body.mission.title, selected.title);

  const trip = await call("GET", `/api/trips/${created.body.trip.id}`, {
    token: registered.body.token
  });
  assert.equal(trip.status, 200);
  assert.equal(trip.body.missions.length, 6);
  for (const mission of untouched) {
    const persisted = trip.body.missions.find((candidate) => candidate.id === mission.id);
    assert.equal(persisted.title, mission.title);
  }

  await updateData((data) => {
    const mission = data.missions.find((candidate) => candidate.id === selected.id);
    mission.status = "completed";
  });
  const protectedMission = await call("POST", `/api/ai/missions/${selected.id}/regenerate`, {
    token: registered.body.token
  });
  assert.equal(protectedMission.status, 409);
});

test("la bitácora conserva un momento por cada misión completada", async () => {
  const registered = await call("POST", "/api/auth/register", {
    body: { name: "Diego", email: "diego@example.com", password: "secreto" }
  });
  const created = await call("POST", "/api/trips", {
    token: registered.body.token,
    body: {
      name: "Seis recuerdos",
      destination: "Costa Amalfitana",
      groupType: "familia",
      travelStyles: ["aventura"],
      energyLevel: 60
    }
  });
  const generated = await call("POST", "/api/ai/missions", {
    token: registered.body.token,
    body: { tripId: created.body.trip.id }
  });

  await updateData((data) => {
    data.missions
      .filter((mission) => mission.tripId === created.body.trip.id)
      .forEach((mission, index) => {
        mission.status = "completed";
        mission.note = `Momento ${index + 1}`;
      });
  });

  const log = await call("POST", "/api/ai/travel-log", {
    token: registered.body.token,
    body: { tripId: created.body.trip.id }
  });

  assert.equal(generated.body.missions.length, 6);
  assert.equal(log.status, 201);
  assert.equal(log.body.travelLog.bestMoments.length, 6);
  assert.deepEqual(log.body.travelLog.bestMoments, [
    "Momento 1",
    "Momento 2",
    "Momento 3",
    "Momento 4",
    "Momento 5",
    "Momento 6"
  ]);
});
