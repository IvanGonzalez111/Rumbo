const categories = [
  "fotografica",
  "gastronomica",
  "social",
  "sensorial",
  "grupo",
  "sorpresa",
  "memoria"
];

const fallbackMissionBank = [
  {
    category: "fotografica",
    title: "Una postal sin posar",
    description: "Sacá una foto sin personas que igual explique algo importante del viaje.",
    suggestedStamp: "Postal viva"
  },
  {
    category: "gastronomica",
    title: "Bocado valiente",
    description: "Probá algo que no hubieras elegido de entrada y escribí una reseña en 20 palabras.",
    suggestedStamp: "Paladar valiente"
  },
  {
    category: "social",
    title: "La recomendacion escondida",
    description: "Preguntale a alguien local por un lugar o detalle que no aparezca primero en internet.",
    suggestedStamp: "Explorador local"
  },
  {
    category: "sensorial",
    title: "Diez segundos del lugar",
    description: "Detenete y registra en una frase como suena, huele o se siente este momento.",
    suggestedStamp: "Momento guardado"
  },
  {
    category: "grupo",
    title: "Frase oficial",
    description: "Elijan una frase que represente el día y anoten por qué quedó pegada.",
    suggestedStamp: "Grupo en modo aventura"
  },
  {
    category: "sorpresa",
    title: "Camino menos práctico",
    description: "Tomen una ruta que no sea la mas obvia durante cinco minutos y registren donde terminaron.",
    suggestedStamp: "Plan improvisado"
  },
  {
    category: "memoria",
    title: "Titulo de pelicula",
    description: "Describi el dia como si fuera el titulo de una pelicula sobre este viaje.",
    suggestedStamp: "Memoria guardada"
  }
];

function travelStyleText(trip) {
  const styles = Array.isArray(trip.travelStyles) && trip.travelStyles.length
    ? trip.travelStyles
    : trip.travelStyle
      ? [trip.travelStyle]
      : [];

  return styles.join(", ") || "libre";
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function readProxyText(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  const directText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (directText) return typeof directText === "string" ? directText : JSON.stringify(directText);

  for (const key of ["text", "output", "content", "response", "data", "result"]) {
    const value = payload[key];
    if (!value) continue;
    if (typeof value === "string") return value;

    const nested = readProxyText(value);
    if (nested) return nested;
  }

  return JSON.stringify(payload);
}

async function callStudentProxy(prompt, model) {
  if (!process.env.AI_PROXY_ENDPOINT && !process.env.AI_PROXY_API_KEY) {
    throw new Error("AI proxy no configurado. Usando fallback local.");
  }

  const baseUrl = process.env.AI_PROXY_URL || "https://gemini-vertex-student-proxy.vercel.app";
  const endpoint = process.env.AI_PROXY_ENDPOINT || `${baseUrl.replace(/\/$/, "")}/api/gemini`;
  const headers = { "Content-Type": "application/json" };

  if (process.env.AI_PROXY_API_KEY) {
    headers.Authorization = `Bearer ${process.env.AI_PROXY_API_KEY}`;
  }

  const body = {
    modelKey: model.includes("pro") ? "pro" : "flash",
    prompt,
    systemInstruction: "Respondé únicamente con JSON válido, sin bloques de Markdown ni explicaciones.",
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI proxy error ${response.status}: ${message}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  return readProxyText(payload);
}

async function generateJson(prompt, model, fallback) {
  const useFallback = process.env.AI_USE_FALLBACK !== "false";

  try {
    const text = await callStudentProxy(prompt, model);
    const json = extractJson(text);
    if (json) return { data: json, source: "ai" };
    throw new Error("La respuesta de IA no fue JSON valido.");
  } catch (error) {
    if (!useFallback) throw error;
    return { data: fallback(), source: "fallback", warning: error.message };
  }
}

export async function generateMissions(trip) {
  const duration = trip.startDate && trip.endDate ? `${trip.startDate} a ${trip.endDate}` : "duracion no indicada";
  const styles = travelStyleText(trip);
  const prompt = `Sos Rumbo, una app que convierte viajes en aventuras interactivas.
Generá 6 misiones breves, seguras, realizables y variadas para este viaje.

Datos:
- Destino: ${trip.destination}
- Fechas o duracion: ${duration}
- Tipo de grupo: ${trip.groupType}
- Estilos de viaje: ${styles}
- Energía del viaje: ${trip.energy}${trip.energyLevel ? ` (${trip.energyLevel}/100)` : ""}
- Intereses: ${Array.isArray(trip.interests) ? trip.interests.join(", ") : trip.interests}

Reglas:
- No propongas actividades peligrosas, ilegales o invasivas.
- No pidas datos personales a desconocidos.
- Las misiones deben poder hacerse sin comprar algo caro.
- Mezcla categorias: ${categories.join(", ")}.
- Usa tono cercano, explorador y ludico.
- Cada titulo debe tener hasta 4 palabras.
- Cada descripcion debe tener hasta 16 palabras.
- Cada suggestedStamp debe tener hasta 3 palabras y no incluir emojis.
- Toda la respuesta debe ocupar menos de 1600 caracteres.
- Responde solo JSON valido.

Formato:
{
  "missions": [
    {
      "title": "",
      "description": "",
      "category": "",
      "difficulty": "suave",
      "suggestedStamp": ""
    }
  ]
}`;

  return generateJson(prompt, process.env.AI_TEXT_MODEL || "gemini-2.5-flash", () => {
    const destination = trip.destination || "este destino";
    const picked = fallbackMissionBank.slice(0, 6).map((mission) => ({
      ...mission,
      title: mission.title,
      description: `${mission.description} Adaptala a ${destination} y a los estilos ${styles}.`,
      difficulty: trip.energy === "alta" ? "media" : "suave"
    }));

    return { missions: picked };
  });
}

export async function regenerateMission(trip, currentMission, tripMissions = []) {
  const styles = travelStyleText(trip);
  const otherTitles = tripMissions
    .filter((mission) => mission.id !== currentMission.id)
    .map((mission) => mission.title)
    .filter(Boolean);
  const prompt = `Sos Rumbo, una app que convierte viajes en aventuras interactivas.
Reemplazá una única misión pendiente por una propuesta nueva para este viaje.

Datos:
- Destino: ${trip.destination}
- Tipo de grupo: ${trip.groupType}
- Estilos de viaje: ${styles}
- Energía del viaje: ${trip.energy}${trip.energyLevel ? ` (${trip.energyLevel}/100)` : ""}
- Intereses: ${Array.isArray(trip.interests) ? trip.interests.join(", ") : trip.interests}

Misión a reemplazar:
- Título: ${currentMission.title}
- Categoría: ${currentMission.category}

Títulos que no debés repetir:
${otherTitles.map((title) => `- ${title}`).join("\n") || "- Ninguno"}

Reglas:
- Generá exactamente una misión diferente a la actual y a las demás.
- Debe ser breve, segura, realizable y relacionada con el destino.
- No propongas actividades peligrosas, ilegales, invasivas ni costosas.
- Elegí una categoría entre: ${categories.join(", ")}.
- El título debe tener hasta 4 palabras.
- La descripción debe tener hasta 16 palabras.
- suggestedStamp debe tener hasta 3 palabras y no incluir emojis.
- Respondé solo JSON válido.

Formato:
{
  "mission": {
    "title": "",
    "description": "",
    "category": "",
    "difficulty": "suave",
    "suggestedStamp": ""
  }
}`;

  return generateJson(prompt, process.env.AI_TEXT_MODEL || "gemini-2.5-flash", () => {
    const normalizedTitles = new Set(otherTitles.map((title) => title.trim().toLocaleLowerCase("es")));
    const currentTitle = (currentMission.title || "").trim().toLocaleLowerCase("es");
    const replacement = fallbackMissionBank.find((mission) => {
      const title = mission.title.toLocaleLowerCase("es");
      return title !== currentTitle && !normalizedTitles.has(title);
    }) || fallbackMissionBank.find((mission) => mission.title.toLocaleLowerCase("es") !== currentTitle)
      || fallbackMissionBank[0];

    return {
      mission: {
        ...replacement,
        description: `${replacement.description} Adaptala a ${trip.destination || "este destino"}.`,
        difficulty: trip.energy === "alta" ? "media" : "suave"
      }
    };
  });
}

export async function generateStamp(mission, note, mood) {
  const prompt = `Sos Rumbo. Creá un sello digital para una misión completada.

Mision:
- Titulo: ${mission.title}
- Descripcion: ${mission.description}
- Categoria: ${mission.category}

Registro del usuario:
- Nota: ${note}
- Emociones: ${mood}

Reglas:
- El nombre del sello debe ser breve y memorable.
- La frase debe tener maximo 18 palabras.
- La descripcion debe convertir el momento en recuerdo.
- No inventes datos concretos que el usuario no haya dado.
- Responde solo JSON valido.

Formato:
{
  "name": "",
  "phrase": "",
  "memoryDescription": ""
}`;

  return generateJson(prompt, process.env.AI_TEXT_MODEL || "gemini-2.5-flash", () => ({
    name: mission.suggestedStamp || "Recuerdo desbloqueado",
    phrase: mood ? `Un momento ${mood} que ya tiene sello propio.` : "Un momento del viaje que quedó guardado.",
    memoryDescription: note || "La misión se completó y se sumó al pasaporte del viaje."
  }));
}

export async function generateTravelLog(trip, completedMissions, stamps) {
  const missionSummaries = completedMissions.map(({ photoDataUrl, mediaDataUrl, ...mission }) => ({
    ...mission,
    hasEvidence: Boolean(mediaDataUrl || photoDataUrl),
    evidenceType: mission.mediaType || (photoDataUrl ? "image" : "")
  }));
  const prompt = `Sos Rumbo, una app que convierte viajes en recuerdos narrativos.
Escribí una bitácora final cálida, concreta y compartible a partir de los datos reales del viaje.

Datos del viaje:
${JSON.stringify(trip, null, 2)}

Misiones completadas:
${JSON.stringify(missionSummaries, null, 2)}

Sellos desbloqueados:
${JSON.stringify(stamps, null, 2)}

Reglas:
- No inventes lugares, nombres ni hechos no registrados.
- Usa un tono emocional, cercano y ludico.
- El relato debe sentirse como memoria de viaje, no como reporte.
- Inclui mejores momentos, premios, frases memorables y caption.
- bestMoments debe incluir exactamente un elemento por cada misión completada, respetando el orden recibido.
- Responde solo JSON valido.

Formato:
{
  "title": "",
  "story": "",
  "bestMoments": [],
  "awards": [],
  "memorablePhrases": [],
  "socialCaption": ""
}`;

  return generateJson(prompt, process.env.AI_LONG_TEXT_MODEL || "gemini-2.5-pro", () => {
    const moments = completedMissions.map((mission) => mission.note || mission.title);
    const phrases = completedMissions
      .map((mission) => mission.memoryText || mission.note)
      .filter(Boolean)
      .slice(0, 3);

    return {
      title: `${trip.name} en modo aventura`,
      story: `Este viaje a ${trip.destination} quedó armado a partir de pequeñas misiones, pausas y detalles que hicieron que el recorrido se sintiera más propio. Entre ${completedMissions.length} momentos completados, Rumbo guardó lo que podría haberse perdido entre fotos sueltas y mensajes.`,
      bestMoments: moments.length ? moments : ["La primera misión completada", "El pasaporte empezando a llenarse"],
      awards: ["Mejor mirada viajera: quien encontró un detalle inesperado", "Plan improvisado: el momento que no estaba previsto"],
      memorablePhrases: phrases.length ? phrases : ["Este viaje ya tiene historia"],
      socialCaption: `Misiones, sellos y recuerdos vivos en ${trip.destination}.`
    };
  });
}
