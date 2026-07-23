import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword, verifyPassword } from "../server/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_FILE = path.join(__dirname, "..", "data", "rumbo.json");

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function parseArguments(args) {
  const options = {
    email: process.env.SHOWCASE_USER_EMAIL || "nose@gmail.com",
    dataFile: process.env.RUMBO_DATA_FILE || DEFAULT_DATA_FILE
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--email") options.email = args[++index];
    else if (argument === "--data-file") options.dataFile = args[++index];
    else throw new Error(`Opción desconocida: ${argument}`);
  }

  if (!options.email || !options.dataFile) {
    throw new Error("El email y el archivo de datos son obligatorios.");
  }

  return {
    email: options.email.trim().toLowerCase(),
    dataFile: path.resolve(options.dataFile)
  };
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    throw new Error("Este comando debe ejecutarse en una terminal interactiva.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const previousRawMode = process.stdin.isRaw;

    function cleanup() {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(previousRawMode);
      process.stdin.pause();
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Operación cancelada."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }

        if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    }

    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

export async function resetPasswordInFile(dataFile, email, password) {
  const raw = await fs.readFile(dataFile, "utf8");
  const data = JSON.parse(raw);
  const normalizedEmail = email.trim().toLowerCase();
  const users = Array.isArray(data.users) ? data.users : [];
  const matchingUsers = users.filter((user) => user.email === normalizedEmail);

  if (matchingUsers.length !== 1) {
    throw new Error(
      matchingUsers.length
        ? `Hay más de una cuenta con el email ${normalizedEmail}.`
        : `No existe una cuenta con el email ${normalizedEmail}.`
    );
  }

  const user = matchingUsers[0];
  const { hash, salt } = hashPassword(password);
  if (!verifyPassword(password, salt, hash)) {
    throw new Error("No se pudo verificar la nueva contraseña.");
  }

  const backupFile = dataFile.replace(/\.json$/i, `.backup-${timestamp()}.json`);
  const temporaryFile = `${dataFile}.tmp-${process.pid}`;

  user.passwordHash = hash;
  user.passwordSalt = salt;
  data.sessions = (data.sessions || []).filter((session) => session.userId !== user.id);

  await fs.copyFile(dataFile, backupFile);
  await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
  await fs.rename(temporaryFile, dataFile);

  return { backupFile, userId: user.id };
}

async function main() {
  const { email, dataFile } = parseArguments(process.argv.slice(2));
  console.log(`Se restablecerá únicamente la contraseña de ${email}.`);

  const password = await readHidden("Nueva contraseña: ");
  if (password.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const confirmation = await readHidden("Repetí la contraseña: ");
  if (password !== confirmation) {
    throw new Error("Las contraseñas no coinciden. No se realizó ningún cambio.");
  }

  const result = await resetPasswordInFile(dataFile, email, password);
  console.log("Contraseña actualizada y sesiones anteriores cerradas.");
  console.log(`Copia de seguridad: ${result.backupFile}`);
}

if (path.resolve(process.argv[1] || "") === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
