import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resetPasswordInFile } from "../scripts/reset-password.js";
import { hashPassword, verifyPassword } from "../server/security.js";

test("restablece la contraseña sin modificar los viajes del usuario", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rumbo-reset-"));
  const dataFile = path.join(directory, "rumbo.json");
  const previousPassword = hashPassword("anterior-123");
  const originalTrip = { id: "trip_1", userId: "usr_1", name: "Viaje de prueba" };
  const originalMission = { id: "mission_1", tripId: "trip_1", completed: true };

  await fs.writeFile(
    dataFile,
    JSON.stringify({
      users: [{
        id: "usr_1",
        email: "nose@gmail.com",
        passwordHash: previousPassword.hash,
        passwordSalt: previousPassword.salt
      }],
      trips: [originalTrip],
      missions: [originalMission],
      stamps: [],
      travelLogs: [],
      sessions: [
        { id: "session_1", userId: "usr_1" },
        { id: "session_2", userId: "usr_2" }
      ]
    }),
    "utf8"
  );

  const result = await resetPasswordInFile(dataFile, "NOSE@GMAIL.COM", "nueva-segura-456");
  const updated = JSON.parse(await fs.readFile(dataFile, "utf8"));

  assert.equal(updated.users.length, 1);
  assert.equal(updated.users[0].id, "usr_1");
  assert.equal(
    verifyPassword("nueva-segura-456", updated.users[0].passwordSalt, updated.users[0].passwordHash),
    true
  );
  assert.deepEqual(updated.trips, [originalTrip]);
  assert.deepEqual(updated.missions, [originalMission]);
  assert.deepEqual(updated.sessions, [{ id: "session_2", userId: "usr_2" }]);
  assert.equal((await fs.stat(result.backupFile)).isFile(), true);
});

test("no escribe nada si la cuenta no existe", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "rumbo-reset-"));
  const dataFile = path.join(directory, "rumbo.json");
  const original = JSON.stringify({ users: [], trips: [{ id: "trip_1" }], sessions: [] });
  await fs.writeFile(dataFile, original, "utf8");

  await assert.rejects(
    resetPasswordInFile(dataFile, "ausente@example.com", "nueva-segura-456"),
    /No existe una cuenta/
  );
  assert.equal(await fs.readFile(dataFile, "utf8"), original);
});
