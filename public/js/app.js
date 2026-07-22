import { mountInteractiveGlobe, unmountInteractiveGlobe } from "./globe.js";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const USER_STORAGE_KEY = "rumboUser";
const TOKEN_STORAGE_KEY = "rumboToken";
const LEGACY_USER_STORAGE_KEY = ["ruta", "Viva", "User"].join("");
const storedUser = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(LEGACY_USER_STORAGE_KEY);
const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";

if (storedUser && !localStorage.getItem(USER_STORAGE_KEY)) {
  localStorage.setItem(USER_STORAGE_KEY, storedUser);
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
}

const state = {
  user: storedToken ? JSON.parse(storedUser || "null") : null,
  token: storedToken,
  view: "dashboard",
  authMode: "login",
  trips: [],
  current: null,
  activeTab: "missions",
  missionFilter: "all",
  loading: "",
  authErrors: {},
  authDraft: {}
};

const moodOptions = [
  "feliz",
  "tranquilo",
  "sorprendido",
  "nostalgico",
  "divertido",
  "cansado",
  "emocionado",
  "curioso"
];

const legacyMoodAliases = {
  agradecido: "feliz",
  inspirado: "emocionado",
  orgulloso: "emocionado",
  conectado: "tranquilo"
};

const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 30;
let activePhotoDrag = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelText(value = "") {
  const labels = {
    bitacora: "Bitácora",
    fotografica: "Fotográfica",
    gastronomica: "Gastronómica",
    sensorial: "Sensorial",
    social: "Social",
    grupo: "Grupo",
    sorpresa: "Sorpresa",
    memoria: "Memoria",
    gastronomico: "Gastronómico",
    tranquilo: "Tranquilo",
    cultural: "Cultural",
    aventura: "Aventura",
    naturaleza: "Naturaleza",
    urbano: "Urbano",
    romantico: "Romántico",
    fotografico: "Fotográfico",
    nocturno: "Nocturno",
    solo: "Solo",
    pareja: "Pareja",
    amigos: "Amigos",
    familia: "Familia",
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    suave: "Suave",
    feliz: "Feliz",
    sorprendido: "Sorprendido",
    nostalgico: "Nostálgico",
    divertido: "Divertido",
    cansado: "Cansado",
    emocionado: "Emocionado",
    curioso: "Curioso",
    agradecido: "Agradecido",
    inspirado: "Inspirado",
    orgulloso: "Orgulloso",
    conectado: "Conectado"
  };

  return labels[String(value).toLowerCase()] || value;
}

function tripStyleText(trip) {
  const styles = Array.isArray(trip.travelStyles) && trip.travelStyles.length
    ? trip.travelStyles
    : trip.travelStyle
      ? [trip.travelStyle]
      : [];

  return styles.map(labelText).join(" + ");
}

function energyInfo(levelValue) {
  const level = Math.min(100, Math.max(1, Number(levelValue) || 50));

  if (level <= 33) {
    return { value: "baja", label: "Baja", text: "Un día tranquilo, con tiempo para detenerse." };
  }

  if (level <= 66) {
    return { value: "media", label: "Media", text: "Un ritmo equilibrado para explorar sin apuro." };
  }

  return { value: "alta", label: "Alta", text: "Muchas ganas de moverse y sumar desafíos." };
}

function updateEnergyControl(input) {
  const control = input.closest("[data-energy-control]");
  const field = input.closest(".energy-field");
  if (!control || !field) return;

  const level = Number(input.value);
  const info = energyInfo(level);
  control.style.setProperty("--energy-progress", `${level}%`);
  input.setAttribute("aria-valuetext", `${info.label}, ${level} de 100`);
  control.querySelector("[data-energy-value]").value = info.value;
  field.querySelector("[data-energy-label]").textContent = info.label;
  field.querySelector("[data-energy-number]").textContent = level;
  control.querySelector("[data-energy-copy]").textContent = info.text;
  control.querySelectorAll(".energy-wave span").forEach((bar, index, bars) => {
    bar.classList.toggle("active", ((index + 1) / bars.length) * 100 <= level);
  });
}

function initializeDatePickers() {
  if (!window.flatpickr) return;

  const sharedOptions = {
    allowInput: true,
    altFormat: "d/m/Y",
    altInput: true,
    dateFormat: "Y-m-d",
    disableMobile: true,
    locale: window.flatpickr.l10ns.es,
    monthSelectorType: "static",
    onReady: (_dates, _value, instance) => {
      if (!instance.altInput) return;
      const originalId = instance.input.id;
      instance.input.id = `${originalId}Value`;
      instance.altInput.id = originalId;
      instance.altInput.setAttribute("autocomplete", "off");
    }
  };

  let endPicker;
  window.flatpickr("#startDate", {
    ...sharedOptions,
    onChange: (dates, value) => {
      endPicker?.set("minDate", value || null);
      if (dates[0] && endPicker?.selectedDates[0] < dates[0]) endPicker.clear();
    }
  });

  endPicker = window.flatpickr("#endDate", sharedOptions);
}

function polishText(value = "") {
  return String(value)
    .replaceAll("Bitacora", "Bitácora")
    .replaceAll("bitacora", "bitácora")
    .replaceAll("Fotografica", "Fotográfica")
    .replaceAll("fotografica", "fotográfica")
    .replaceAll("Gastronomica", "Gastronómica")
    .replaceAll("gastronomica", "gastronómica")
    .replaceAll("Saca ", "Sacá ")
    .replaceAll("saca ", "sacá ")
    .replaceAll("Proba ", "Probá ")
    .replaceAll("proba ", "probá ")
    .replaceAll("practico", "práctico")
    .replaceAll("practica", "práctica")
    .replaceAll("anecdota", "anécdota")
    .replaceAll("todavia", "todavía")
    .replaceAll("quedo", "quedó")
    .replaceAll("pequenas", "pequeñas")
    .replaceAll("mas ", "más ")
    .replaceAll("guardo", "guardó")
    .replaceAll("podria", "podría")
    .replaceAll("empezo", "empezó")
    .replaceAll("encontro", "encontró")
    .replaceAll("encanto", "encantó")
    .replaceAll("cafe", "café")
    .replaceAll("dias", "días");
}

function formatTripDate(value = "") {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" }).format(date);
}

function conciseMissionDescription(value = "") {
  return polishText(value)
    .replace(/\s*Adaptala a .+? y al estilo .+?\.$/i, "")
    .trim();
}

function resizeMissionPhoto(file) {
  if (!file?.type.startsWith("image/")) {
    return Promise.reject(new Error("Elegí un archivo de imagen."));
  }

  if (file.size > 12 * 1024 * 1024) {
    return Promise.reject(new Error("La imagen es demasiado grande. Elegí una de menos de 12 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("La imagen no tiene un formato compatible."));
      image.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        const context = canvas.getContext("2d");
        context.fillStyle = "#fffaf0";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function readMissionVideo(file) {
  if (!file?.type.startsWith("video/")) {
    return Promise.reject(new Error("Elegí un archivo de video compatible."));
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return Promise.reject(new Error("El video es demasiado grande. Elegí uno de menos de 40 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el video."));
    reader.onload = () => {
      const video = document.createElement("video");
      let settled = false;
      let timeoutId;

      const finish = (posterDataUrl = "") => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        video.removeAttribute("src");
        video.load();
        resolve({ mediaDataUrl: reader.result, posterDataUrl });
      };

      const fail = (message = "El video no se puede reproducir. Probá con MP4 o WebM.") => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        video.removeAttribute("src");
        video.load();
        reject(new Error(message));
      };

      const captureFrame = () => {
        if (!video.videoWidth || !video.videoHeight) return finish();

        try {
          const maxWidth = 960;
          const scale = Math.min(1, maxWidth / video.videoWidth);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL("image/jpeg", 0.78));
        } catch {
          finish();
        }
      };

      const captureWhenReady = () => {
        if (typeof video.requestVideoFrameCallback === "function") {
          video.requestVideoFrameCallback(captureFrame);
        } else {
          window.setTimeout(captureFrame, 80);
        }
      };

      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.onerror = fail;
      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        if (duration > MAX_VIDEO_DURATION_SECONDS) {
          fail("El video dura más de 30 segundos. Recortalo para guardar el momento más importante.");
          return;
        }
        const previewTime = duration > 0.12
          ? Math.min(0.75, Math.max(0.08, duration * 0.08), duration - 0.05)
          : 0;

        if (previewTime > 0) {
          video.onseeked = captureWhenReady;
          video.currentTime = previewTime;
        } else if (video.readyState >= 2) {
          captureWhenReady();
        } else {
          video.onloadeddata = captureWhenReady;
        }
      };
      timeoutId = window.setTimeout(() => finish(), 5000);
      video.src = reader.result;
      video.load();
    };
    reader.readAsDataURL(file);
  });
}

function missionMediaDataUrl(mission = {}) {
  return mission.mediaDataUrl || mission.photoDataUrl || "";
}

function missionMediaType(mission = {}) {
  if (mission.mediaType) return mission.mediaType;
  const dataUrl = missionMediaDataUrl(mission);
  return dataUrl.startsWith("data:video/") ? "video" : dataUrl ? "image" : "";
}

function missionPosterDataUrl(mission = {}) {
  return mission.posterDataUrl || "";
}

function normalizeMediaPositionValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 50;
}

function missionMediaPosition(mission = {}) {
  return {
    x: normalizeMediaPositionValue(mission.mediaPositionX),
    y: normalizeMediaPositionValue(mission.mediaPositionY)
  };
}

function missionMediaPositionStyle(mission = {}) {
  const position = missionMediaPosition(mission);
  return `object-position: ${position.x}% ${position.y}%`;
}

function videoFallbackPoster() {
  if (videoFallbackPoster.cached) return videoFallbackPoster.cached;

  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  const context = canvas.getContext("2d");
  const background = context.createLinearGradient(0, 0, 960, 540);
  background.addColorStop(0, "#111d38");
  background.addColorStop(1, "#071226");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(239, 111, 48, 0.28)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(480, 275, 230, Math.PI * 1.08, Math.PI * 1.86);
  context.stroke();
  context.strokeStyle = "rgba(112, 165, 139, 0.24)";
  context.beginPath();
  context.arc(480, 275, 280, Math.PI * 0.12, Math.PI * 0.92);
  context.stroke();

  context.fillStyle = "#ef6f30";
  context.beginPath();
  context.arc(480, 238, 68, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fffaf0";
  context.beginPath();
  context.moveTo(463, 203);
  context.lineTo(463, 273);
  context.lineTo(520, 238);
  context.closePath();
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "#fffaf0";
  context.font = "700 30px Inter, sans-serif";
  context.fillText("RECUERDO EN VIDEO", 480, 352);
  context.fillStyle = "rgba(255, 250, 240, 0.7)";
  context.font = "500 20px Inter, sans-serif";
  context.fillText("Tocá play para volver al momento", 480, 390);

  videoFallbackPoster.cached = canvas.toDataURL("image/jpeg", 0.82);
  return videoFallbackPoster.cached;
}

function missionMoodValues(mission = {}) {
  const moods = Array.isArray(mission.moods)
    ? mission.moods
    : typeof mission.mood === "string"
      ? mission.mood.split(",")
      : [];

  return [...new Set(moods.map((mood) => mood.trim()).filter(Boolean))];
}

function renderMissionEvidence(mission, alt) {
  const dataUrl = missionMediaDataUrl(mission);
  if (!dataUrl) return "";

  if (missionMediaType(mission) === "video") {
    const savedPoster = missionPosterDataUrl(mission);
    const poster = savedPoster || videoFallbackPoster();
    return `<video src="${escapeHtml(dataUrl)}" poster="${escapeHtml(poster)}" controls playsinline preload="auto" data-video-preview data-fallback-poster="${savedPoster ? "false" : "true"}" aria-label="${escapeHtml(alt)}"></video>`;
  }

  return `<img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(alt)}" style="${missionMediaPositionStyle(mission)}" />`;
}

function initializeVideoPreviews(root = document) {
  root.querySelectorAll("video[data-video-preview]").forEach((video) => {
    const hasSavedPoster = video.getAttribute("poster")?.trim() && video.dataset.fallbackPoster !== "true";
    if (hasSavedPoster || video.dataset.previewBound === "true") return;
    video.dataset.previewBound = "true";

    const showFirstFrame = () => {
      if (video.dataset.previewReady === "true" || video.dataset.userStarted === "true") return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!duration || !video.videoWidth || !video.videoHeight) return;
      video.pause();
      video.removeAttribute("poster");
      video.currentTime = duration > 0.12
        ? Math.min(0.75, Math.max(0.08, duration * 0.08), duration - 0.05)
        : Math.max(0, duration / 2);
      video.dataset.previewReady = "true";
    };

    video.addEventListener("play", () => {
      video.dataset.userStarted = "true";
    }, { once: true });
    video.addEventListener("loadedmetadata", showFirstFrame, { once: true });
    if (video.readyState >= 1) showFirstFrame();
    else video.load();
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 3600);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateAuthForm(values, isRegister) {
  const errors = {};
  const email = values.email?.trim() || "";

  if (isRegister && !values.name?.trim()) {
    errors.name = "Escribi tu nombre para crear la cuenta.";
  }

  if (!email) {
    errors.email = "El email es obligatorio.";
  } else if (/\s/.test(values.email)) {
    errors.email = "Escribilo sin espacios ni texto extra, por ejemplo sofia@gmail.com.";
  } else if (!isValidEmail(email)) {
    errors.email = "Revisa el formato del email. Falta algo como @gmail.com.";
  }

  if (!values.password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (values.password.length < 4) {
    errors.password = "Usa al menos 4 caracteres.";
  }

  return errors;
}

function authFieldClass(name) {
  return state.authErrors[name] ? "field invalid" : "field";
}

function authFieldError(name) {
  return state.authErrors[name] ? `<p class="field-error">${escapeHtml(state.authErrors[name])}</p>` : "";
}

function formatFieldList(labels) {
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`;
}

function clearTripFieldValidation(field, form) {
  field.removeAttribute("aria-invalid");
  const fieldContainer = field.closest(".field");
  fieldContainer?.querySelector("[data-required-group]")?.removeAttribute("aria-invalid");
  fieldContainer?.classList.remove("invalid");
  fieldContainer?.querySelector(".field-error")?.remove();

  const alert = form.querySelector(".trip-validation-alert");
  const remainingLabels = [...form.querySelectorAll(".field.invalid")]
    .map((container) => container.querySelector("legend, label")?.textContent.trim())
    .filter(Boolean);

  if (!remainingLabels.length) return alert?.remove();
  const alertCopy = alert?.querySelector("p");
  if (alertCopy) alertCopy.textContent = `Completá ${formatFieldList(remainingLabels)} para guardar el viaje.`;
}

function validateTripForm(form) {
  form.querySelector(".trip-validation-alert")?.remove();
  form.querySelectorAll(".field.invalid").forEach((field) => field.classList.remove("invalid"));
  form.querySelectorAll(".field-error").forEach((error) => error.remove());

  const missingFields = [...form.querySelectorAll("[required]")]
    .filter((field) => !field.value.trim());
  const groupTypeGroup = form.querySelector("[data-required-group='groupType']");
  const missingGroupType = groupTypeGroup && !groupTypeGroup.querySelector("input:checked");
  const styleGroup = form.querySelector("[data-required-group='travelStyles']");
  const missingStyles = styleGroup && !styleGroup.querySelector("input:checked");

  if (!missingFields.length && !missingGroupType && !missingStyles) return true;

  const labels = missingFields.map((field) => {
    const fieldContainer = field.closest(".field");
    const label = fieldContainer?.querySelector("label")?.textContent.trim() || "este campo";
    const error = document.createElement("p");

    field.setAttribute("aria-invalid", "true");
    fieldContainer?.classList.add("invalid");
    error.className = "field-error";
    error.textContent = field.tagName === "SELECT" ? "Elegí una opción para continuar." : "Completá este campo para continuar.";
    fieldContainer?.append(error);
    return label;
  });

  if (missingGroupType) {
    const fieldContainer = groupTypeGroup.closest(".field");
    const error = document.createElement("p");
    groupTypeGroup.setAttribute("aria-invalid", "true");
    fieldContainer?.classList.add("invalid");
    error.className = "field-error";
    error.textContent = "Elegí con quién viajás para continuar.";
    fieldContainer?.append(error);
    labels.push("Tipo de grupo");
  }

  if (missingStyles) {
    const fieldContainer = styleGroup.closest(".field");
    const error = document.createElement("p");
    styleGroup.setAttribute("aria-invalid", "true");
    fieldContainer?.classList.add("invalid");
    error.className = "field-error";
    error.textContent = "Elegí al menos un estilo para continuar.";
    fieldContainer?.append(error);
    labels.push("Estilo");
  }

  const alert = document.createElement("div");
  alert.className = "trip-validation-alert full";
  alert.setAttribute("role", "alert");
  alert.innerHTML = `
    <span class="trip-validation-icon" aria-hidden="true">!</span>
    <div>
      <strong>Hay datos pendientes</strong>
      <p>Completá ${escapeHtml(formatFieldList(labels))} para guardar el viaje.</p>
    </div>
  `;
  form.prepend(alert);

  const firstMissing = missingFields[0]
    || groupTypeGroup?.querySelector("input")
    || styleGroup.querySelector("input");
  firstMissing.focus({ preventScroll: true });
  firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
  return false;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && state.token) {
      clearLocalSession();
      render();
      throw new Error("Tu sesión venció. Volvé a entrar para continuar.");
    }
    throw new Error(payload.error || "No se pudo completar la accion.");
  }

  return payload;
}

function saveUser(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearLocalSession() {
  state.user = null;
  state.token = "";
  state.trips = [];
  state.current = null;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function logout() {
  const token = state.token;
  clearLocalSession();
  if (token) {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => undefined);
  }
  render();
}

function setLoading(label) {
  state.loading = label;
  if (label === "complete" && refreshCompleteSubmitButton()) return;
  if (!state.user && refreshAuthFormPanel()) return;
  render();
}

function clearLoading() {
  state.loading = "";
  if (refreshCompleteSubmitButton()) return;
  if (!state.user && refreshAuthFormPanel()) return;
  render();
}

function buttonLabel(idleText, loadingKey) {
  if (state.loading !== loadingKey) return idleText;
  return `<span class="loading"><span class="spinner"></span>${idleText}</span>`;
}

function getTripGuide(trip, missions, stamps, travelLog) {
  const completed = missions.filter((mission) => mission.status === "completed").length;

  if (!missions.length) {
    return {
      eyebrow: "Próxima acción",
      title: "Generá las primeras misiones",
      text: `Rumbo necesita algunas pistas sobre ${trip.destination} para convertir este viaje en aventura.`,
      action: "Generar misiones",
      dataAction: "generate-missions",
      dataTripId: trip.id
    };
  }

  if (!completed) {
    const recommendedMission = missions.find((mission) => mission.status !== "completed") || missions[0];
    return {
      eyebrow: "Próxima acción",
      title: "Empezá por una misión suave",
      text: "Completá una primera misión para desbloquear el primer sello del pasaporte.",
      action: "Empezar primera misión",
      dataAction: "complete-modal",
      dataMissionId: recommendedMission.id
    };
  }

  if (completed < 3) {
    return {
      eyebrow: "Próxima acción",
      title: "Ya desbloqueaste un sello",
      text: "Podés seguir completando misiones o mirar cómo empieza a llenarse el pasaporte.",
      action: stamps.length ? "Ver pasaporte" : "Seguir misiones",
      tab: stamps.length ? "passport" : "missions"
    };
  }

  return {
    eyebrow: "Próxima acción",
    title: travelLog ? "Tu bitácora puede crecer" : "Tu viaje ya tiene material",
    text: travelLog
      ? "Actualizá la bitácora si sumaste nuevos recuerdos o seguí completando misiones."
      : "Ya hay recuerdos suficientes para generar una bitácora final con tono de aventura.",
    action: travelLog ? "Actualizar bitácora" : "Crear bitácora",
    dataAction: "generate-log",
    dataTripId: trip.id,
    loadingKey: "log",
    tab: "log"
  };
}

function renderNextAction(trip, missions, stamps, travelLog) {
  const guide = getTripGuide(trip, missions, stamps, travelLog);
  const dataAttributes = [
    guide.dataTripId ? `data-trip-id="${escapeHtml(guide.dataTripId)}"` : "",
    guide.dataMissionId ? `data-mission-id="${escapeHtml(guide.dataMissionId)}"` : ""
  ].filter(Boolean).join(" ");
  const button = state.user.readOnly && guide.dataAction
    ? guide.tab
      ? `<button class="btn primary" data-action="tab" data-tab="${guide.tab}">${guide.action}</button>`
      : `<span class="showcase-action-state">Explorá el recorrido desde las pestañas</span>`
    : guide.dataAction
    ? `<button class="btn primary" data-action="${guide.dataAction}" ${dataAttributes} ${state.loading ? "disabled" : ""}>${buttonLabel(guide.action, guide.loadingKey || "missions")}</button>`
    : `<button class="btn primary" data-action="tab" data-tab="${guide.tab}">${guide.action}</button>`;

  return `
    <section class="next-action">
      <div>
        <span class="eyebrow">${guide.eyebrow}</span>
        <h2>${escapeHtml(guide.title)}</h2>
        <p>${escapeHtml(guide.text)}</p>
      </div>
      ${button}
    </section>
  `;
}

function renderJourneyProgress(missions, stamps, travelLog) {
  const hasMissions = missions.length > 0;
  const hasCompleted = missions.some((mission) => mission.status === "completed");
  const hasStamps = stamps.length > 0;
  const steps = [
    { label: "Crear viaje", done: true },
    { label: "Generar misiones", done: hasMissions, active: !hasMissions },
    { label: "Completar misiones", done: hasCompleted, active: hasMissions && !hasCompleted },
    { label: "Desbloquear sellos", done: hasStamps, active: hasCompleted && !hasStamps },
    { label: "Crear bitácora", done: Boolean(travelLog), active: hasCompleted && !travelLog }
  ];
  const activeIndex = steps.findIndex((step) => step.active);
  const currentIndex = activeIndex >= 0 ? activeIndex : steps.length - 1;

  return `
    <details class="journey-progress-panel">
      <summary>
        <span>Paso ${currentIndex + 1} de ${steps.length}</span>
        <strong>${steps[currentIndex].label}</strong>
        <small>Ver recorrido</small>
      </summary>
      <ol class="journey-progress" aria-label="Progreso de la experiencia">
        ${steps.map((step, index) => `
          <li class="${step.done ? "done" : ""} ${step.active ? "active" : ""}">
            <span>${index + 1}</span>
            <strong>${step.label}</strong>
          </li>
        `).join("")}
      </ol>
    </details>
  `;
}

function stampForMission(stamps, missionId) {
  return stamps.find((stamp) => stamp.missionId === missionId);
}

function missionStatusInfo(mission, stamps) {
  const stamp = stampForMission(stamps, mission.id);

  if (stamp) {
    return { label: "Sello desbloqueado", className: "unlocked" };
  }

  if (mission.status === "completed") {
    return { label: "Completada", className: "completed" };
  }

  return { label: "Pendiente", className: "pending" };
}

function stampCategoryClass(category = "") {
  return `cat-${String(category).toLowerCase()}`;
}

async function loadTrips() {
  if (!state.user) return;
  const payload = await api("/api/trips");
  state.trips = payload.trips;
}

async function openTrip(tripId, tab = state.activeTab || "missions") {
  const isDifferentTrip = state.current?.trip?.id !== tripId;
  const payload = await api(`/api/trips/${tripId}`);
  state.current = payload;
  state.activeTab = tab;
  if (isDifferentTrip) state.missionFilter = "all";
  state.view = "trip";
  render();
}

function renderShell(content) {
  const userActions = state.user
    ? `<div class="top-actions">
        ${state.user.readOnly ? `<span class="showcase-badge">Solo lectura</span>` : ""}
        <button class="btn ghost" data-action="dashboard" title="Volver al dashboard">Mis viajes</button>
        <button class="btn ghost" data-action="logout">Cerrar sesión</button>
      </div>`
    : "";

  app.innerHTML = `
    <main class="app-shell view-${state.view} ${state.user ? "internal-shell" : "auth-shell"} ${state.user?.readOnly ? "showcase-mode" : ""}">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">R</div>
          <div>
            <p class="brand-title">Rumbo</p>
            <p class="brand-subtitle">Convertí tu viaje en una aventura interactiva</p>
          </div>
        </div>
        ${userActions}
      </header>
      ${content}
    </main>
  `;
  initializeVideoPreviews(app);
}

function authFormPanelMarkup() {
  const isRegister = state.authMode === "register";
  const formError = state.authErrors.form ? `<div class="form-error">${escapeHtml(state.authErrors.form)}</div>` : "";

  return `
    <div class="auth-card-head">
      <h2>${isRegister ? "Creá tu ruta" : "Entrar con email"}</h2>
      <p>${isRegister ? "Empezá un viaje con misiones, sellos y bitácora propia." : "Volvé a tus viajes, misiones completadas y recuerdos guardados."}</p>
    </div>
    <div class="segmented">
      <button class="${!isRegister ? "active" : ""}" data-action="auth-mode" data-mode="login">Entrar</button>
      <button class="${isRegister ? "active" : ""}" data-action="auth-mode" data-mode="register">Crear</button>
    </div>
    ${formError}
    <form class="form auth-form" data-form="${isRegister ? "register" : "login"}" novalidate>
      ${isRegister ? `
        <div class="${authFieldClass("name")}">
          <label for="name">Nombre</label>
          <input id="name" name="name" autocomplete="name" value="${escapeHtml(state.authDraft.name || "")}" required />
          ${authFieldError("name")}
        </div>
      ` : ""}
      <div class="${authFieldClass("email")}">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="email" placeholder="sofia@gmail.com" value="${escapeHtml(state.authDraft.email || "")}" required aria-invalid="${Boolean(state.authErrors.email)}" />
        ${authFieldError("email")}
      </div>
      <div class="${authFieldClass("password")}">
        <label for="password">Contraseña</label>
        <input id="password" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" required minlength="4" />
        ${authFieldError("password")}
      </div>
      <button class="btn primary" type="submit" ${state.loading ? "disabled" : ""}>
        ${buttonLabel(isRegister ? "Crear cuenta" : "Entrar", "auth")}
      </button>
    </form>
    ${!isRegister ? `
      <div class="auth-showcase-entry">
        <div class="auth-divider"><span>o explorá la experiencia</span></div>
        <button class="auth-showcase-button" data-action="showcase-login" ${state.loading ? "disabled" : ""}>
          <strong>${buttonLabel("Ver recorrido de muestra", "showcase")}</strong>
          <small>Entrá sin contraseña y recorré un viaje completo.</small>
        </button>
      </div>
    ` : ""}
  `;
}

function refreshAuthFormPanel({ focusMode = false } = {}) {
  const formPanel = document.querySelector(".auth-form-panel");
  if (!formPanel) return false;

  formPanel.innerHTML = authFormPanelMarkup();
  if (focusMode) {
    formPanel.querySelector(`[data-mode="${state.authMode}"]`)?.focus();
  }
  return true;
}

function renderAuth() {

  renderShell(`
    <section class="auth-scene">
      <div class="auth-panel">
        <div class="auth-showcase">
          <div class="auth-globe-stage" data-globe>
            <canvas
              class="auth-globe-canvas"
              tabindex="0"
              role="img"
              aria-label="Globo 3D interactivo. Arrastrá horizontalmente o usá las flechas para girarlo."
            ></canvas>
          </div>
          <div class="auth-postcards" aria-hidden="true">
            <span class="auth-postcard auth-postcard-city"></span>
            <span class="auth-postcard auth-postcard-mountains"></span>
            <span class="auth-postcard auth-postcard-coast"></span>
            <span class="auth-postcard auth-postcard-street"></span>
          </div>
          <div class="auth-showcase-head">
            <h1>Rumbo</h1>
            <p>Tu próxima historia empieza acá.</p>
          </div>
        </div>
        <div class="auth-form-panel">${authFormPanelMarkup()}</div>
      </div>
    </section>
  `);

  mountInteractiveGlobe();
}

function renderDashboard() {
  const isShowcase = Boolean(state.user.readOnly);
  const cards = state.trips.length
    ? state.trips.map(renderTripCard).join("")
    : `<div class="empty full">
        <h2>Todavia no hay viajes</h2>
        <p>Creá el primero y Rumbo prepara misiones para empezar a mirar distinto.</p>
        ${isShowcase ? "" : `<button class="btn primary" data-action="new-trip">Crear viaje</button>`}
      </div>`;

  renderShell(`
    <section class="page">
      <div class="dashboard-head">
        <div>
          <span class="eyebrow">${isShowcase ? "Recorrido de muestra" : `Hola, ${escapeHtml(state.user.name)}`}</span>
          <h1>${isShowcase ? "Una aventura para explorar" : "Mis viajes"}</h1>
          <p class="muted">${isShowcase ? "Abrí el viaje y recorré sus misiones, sellos y bitácora final." : "Cada viaje guarda misiones, sellos y una bitácora final."}</p>
        </div>
        ${state.trips.length && !isShowcase ? `<button class="btn primary" data-action="new-trip">+ Crear viaje</button>` : ""}
      </div>
      <div class="grid trip-grid">${cards}</div>
    </section>
  `);
}

function renderTripCard(trip) {
  const statusLabel = trip.status === "completed" ? "Con bitácora" : trip.status === "active" ? "En curso" : "Sin misiones";
  const progress = trip.missionCount ? Math.round((trip.completedCount / trip.missionCount) * 100) : 0;
  const progressText = trip.completedCount
    ? `${trip.completedCount} de ${trip.missionCount} misiones completadas`
    : "La aventura está lista para empezar";
  const travelStyles = Array.isArray(trip.travelStyles) && trip.travelStyles.length
    ? trip.travelStyles
    : trip.travelStyle
      ? [trip.travelStyle]
      : [];
  const coverStyle = labelText(travelStyles[0] || "aventura");
  const tripDates = [formatTripDate(trip.startDate), formatTripDate(trip.endDate)].filter(Boolean).join(" — ");

  return `
    <article class="card trip-card">
      <figure class="trip-card-cover ${trip.coverPhotoDataUrl ? "has-photo" : ""}">
        ${trip.coverPhotoDataUrl
          ? `<img src="${escapeHtml(trip.coverPhotoDataUrl)}" alt="Recuerdo destacado de ${escapeHtml(trip.name)}" style="object-position: ${normalizeMediaPositionValue(trip.coverPositionX)}% ${normalizeMediaPositionValue(trip.coverPositionY)}%" />`
          : `<div class="trip-card-cover-placeholder">
              <div class="trip-cover-route" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="trip-cover-copy">
                <span>Próximo destino</span>
                <strong>${escapeHtml(trip.destination)}</strong>
                ${tripDates ? `<small>${escapeHtml(tripDates)}</small>` : ""}
              </div>
              <div class="trip-cover-stamp" aria-label="Estilo ${escapeHtml(coverStyle)}">
                <span>Rumbo</span>
                <strong>${escapeHtml(coverStyle)}</strong>
              </div>
              <p>Tu próxima foto va a aparecer acá.</p>
            </div>`}
        <figcaption>
          <span class="tag">${escapeHtml(trip.destination)}</span>
          <span class="status ${trip.status}">${statusLabel}</span>
        </figcaption>
      </figure>
      <div class="trip-card-body">
        <div class="trip-card-copy">
          <span class="eyebrow">${trip.hasTravelLog ? "Historia guardada" : "Aventura en curso"}</span>
        <h3>${escapeHtml(trip.name)}</h3>
        <p>${escapeHtml(labelText(trip.groupType))} · ${escapeHtml(tripStyleText(trip))} · energía ${escapeHtml(labelText(trip.energy))}</p>
        </div>
        <div class="trip-card-progress">
          <div><span>Progreso del viaje</span><strong>${progress}%</strong></div>
          <div class="trip-card-progress-track" aria-label="${escapeHtml(progressText)}"><span style="width: ${progress}%"></span></div>
          <small>${escapeHtml(progressText)}</small>
        </div>
        <div class="stats">
          <div class="stat"><strong>${trip.missionCount}</strong><span>misiones</span></div>
          <div class="stat"><strong>${trip.completedCount}</strong><span>hechas</span></div>
          <div class="stat"><strong>${trip.stampCount}</strong><span>sellos</span></div>
        </div>
        <div class="trip-card-actions">
          <button class="btn dark" data-action="open-trip" data-trip-id="${trip.id}">Abrir viaje</button>
          ${state.user.readOnly ? "" : `<button class="btn danger" data-action="delete-trip" data-trip-id="${trip.id}">Eliminar</button>`}
        </div>
      </div>
    </article>
  `;
}

function renderCreateTrip() {
  renderShell(`
    <section class="page">
      <div class="dashboard-head">
        <div>
          <span class="eyebrow">Nueva aventura</span>
          <h1>Crear viaje</h1>
          <p class="muted">Con unos pocos datos la IA puede proponer misiones a medida.</p>
        </div>
      </div>
      <section class="panel">
        <form class="form form-grid" data-form="trip" novalidate>
          <div class="field">
            <label for="tripName">Nombre del viaje</label>
            <input id="tripName" name="name" placeholder="Escapada a Valparaiso" required />
          </div>
          <div class="field destination-field">
            <label for="destination">Destino</label>
            <div class="destination-input-shell">
              <input
                id="destination"
                name="destination"
                placeholder="Ciudad, región o país"
                autocomplete="address-level2"
                required
              />
              <span class="destination-field-marker" aria-hidden="true"></span>
            </div>
          </div>
          <div class="field date-field">
            <label for="startDate">Inicio</label>
            <div class="date-input-shell">
              <input id="startDate" name="startDate" type="text" placeholder="Elegir fecha" data-date-picker />
              <span class="date-field-icon" aria-hidden="true"></span>
            </div>
          </div>
          <div class="field date-field">
            <label for="endDate">Fin</label>
            <div class="date-input-shell">
              <input id="endDate" name="endDate" type="text" placeholder="Elegir fecha" data-date-picker />
              <span class="date-field-icon" aria-hidden="true"></span>
            </div>
          </div>
          <fieldset class="field full group-type-field">
            <legend>Tipo de grupo</legend>
            <p class="field-hint">¿Con quién vas a compartir esta aventura?</p>
            <div class="group-type-options" data-required-group="groupType" role="radiogroup" aria-label="Tipo de grupo del viaje">
              ${[
                ["solo", "1", "Solo", "A tu ritmo"],
                ["pareja", "2", "Pareja", "De a dos"],
                ["amigos", "3+", "Amigos", "En equipo"],
                ["familia", "4+", "Familia", "Para compartir"]
              ].map(([value, count, label, detail]) => `
                <label class="group-type-option">
                  <input type="radio" name="groupType" value="${value}" />
                  <span>
                    <b aria-hidden="true">${count}</b>
                    <span><strong>${label}</strong><small>${detail}</small></span>
                  </span>
                </label>
              `).join("")}
            </div>
          </fieldset>
          <fieldset class="field full travel-style-field">
            <legend>Estilo</legend>
            <p class="field-hint">Podés combinar todos los que representen este viaje.</p>
            <div class="travel-style-options" data-required-group="travelStyles" role="group" aria-label="Estilos del viaje">
              ${[
                ["tranquilo", "Tranquilo"],
                ["aventura", "Aventura"],
                ["cultural", "Cultural"],
                ["gastronomico", "Gastronómico"],
                ["sorpresa", "Sorpresa"],
                ["naturaleza", "Naturaleza"],
                ["urbano", "Urbano"],
                ["romantico", "Romántico"],
                ["fotografico", "Fotográfico"],
                ["nocturno", "Nocturno"]
              ].map(([value, label]) => `
                <label class="travel-style-option">
                  <input type="checkbox" name="travelStyles" value="${value}" />
                  <span>${label}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>
          <div class="field full energy-field">
            <div class="energy-field-head">
              <div>
                <label for="energyLevel">Energía del viaje</label>
                <p class="field-hint">El ritmo que querés para esta aventura.</p>
              </div>
              <output for="energyLevel"><strong data-energy-label>Media</strong><span><b data-energy-number>50</b>/100</span></output>
            </div>
            <div class="energy-control" data-energy-control style="--energy-progress: 50%">
              <div class="energy-wave" aria-hidden="true">
                ${[7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45].map((height, index) => `<span class="${index < 10 ? "active" : ""}" style="--bar-height: ${height}px"></span>`).join("")}
              </div>
              <input id="energyLevel" name="energyLevel" type="range" min="1" max="100" step="1" value="50" data-energy-range aria-label="Nivel de energía" aria-valuetext="Media, 50 de 100" />
              <input type="hidden" name="energy" value="media" data-energy-value required />
              <div class="energy-scale" aria-hidden="true"><span>Baja</span><span>Media</span><span>Alta</span></div>
              <p class="energy-copy" data-energy-copy>Un ritmo equilibrado para explorar sin apuro.</p>
            </div>
          </div>
          <div class="field full">
            <label for="interests">Intereses</label>
            <input id="interests" name="interests" placeholder="murales, café, miradores" />
          </div>
          <div class="full top-actions">
            <button class="btn ghost" type="button" data-action="dashboard">Cancelar</button>
            <button class="btn primary" type="submit" ${state.loading ? "disabled" : ""}>
              ${buttonLabel("Guardar viaje", "trip")}
            </button>
          </div>
        </form>
      </section>
    </section>
  `);

  initializeDatePickers();
}

function renderTrip() {
  const { trip, missions, stamps, travelLog } = state.current;
  const completed = missions.filter((mission) => mission.status === "completed").length;

  renderShell(`
    <section class="page">
      <div class="trip-head">
        <div>
          <span class="eyebrow">${escapeHtml(trip.destination)} · ${escapeHtml(tripStyleText(trip))}</span>
          <h1>${escapeHtml(trip.name)}</h1>
          <div class="trip-summary">
            <span><strong>${completed}/${missions.length}</strong> misiones</span>
            <span><strong>${stamps.length}</strong> sellos</span>
          </div>
        </div>
        <div class="trip-head-actions">
          <button class="btn ghost" data-action="dashboard">Volver</button>
          ${state.user.readOnly ? "" : `<details class="action-menu">
            <summary aria-label="Más acciones" title="Más acciones">...</summary>
            <div class="action-menu-popover">
              <button data-action="delete-trip" data-trip-id="${trip.id}">Eliminar viaje</button>
            </div>
          </details>`}
        </div>
      </div>
      ${renderNextAction(trip, missions, stamps, travelLog)}
      ${renderJourneyProgress(missions, stamps, travelLog)}
      <div class="tabs">
        <button class="${state.activeTab === "missions" ? "active" : ""}" data-action="tab" data-tab="missions">Misiones</button>
        <button class="${state.activeTab === "passport" ? "active" : ""}" data-action="tab" data-tab="passport">Pasaporte</button>
        <button class="${state.activeTab === "log" ? "active" : ""}" data-action="tab" data-tab="log">Bitácora</button>
      </div>
      ${state.activeTab === "missions" ? renderMissions(trip, missions, stamps) : ""}
      ${state.activeTab === "passport" ? renderPassport(stamps, missions) : ""}
      ${state.activeTab === "log" ? renderTravelLog(trip, missions, stamps, travelLog) : ""}
    </section>
  `);
}

function renderMissions(trip, missions, stamps) {
  if (!missions.length) {
    return `
      <section class="empty">
        <h2>Todavía no hay misiones</h2>
        <p>Cuando estén listas, este será el espacio para recorrer ${escapeHtml(trip.destination)} y guardar cada recuerdo.</p>
      </section>
    `;
  }

  const filtered = missions.filter((mission) => {
    if (state.missionFilter === "all") return true;
    return mission.status === state.missionFilter;
  });
  const pendingCount = missions.filter((mission) => mission.status !== "completed").length;
  const completedCount = missions.length - pendingCount;

  return `
    <section class="mission-section">
      <div class="mission-toolbar">
        <div class="segmented mission-filters" aria-label="Filtrar misiones">
          <button class="${state.missionFilter === "all" ? "active" : ""}" data-action="filter" data-filter="all">Todas ${missions.length}</button>
          <button class="${state.missionFilter === "pending" ? "active" : ""}" data-action="filter" data-filter="pending">Pendientes ${pendingCount}</button>
          <button class="${state.missionFilter === "completed" ? "active" : ""}" data-action="filter" data-filter="completed">Hechas ${completedCount}</button>
        </div>
        ${state.user.readOnly ? "" : `<details class="action-menu">
          <summary aria-label="Opciones de misiones" title="Opciones de misiones">...</summary>
          <div class="action-menu-popover">
            <button data-action="generate-missions" data-trip-id="${trip.id}" ${state.loading ? "disabled" : ""}>${buttonLabel("Regenerar misiones", "missions")}</button>
          </div>
        </details>`}
      </div>
      <div class="mission-grid">
        ${filtered.map((mission) => renderMissionCard(mission, stamps)).join("")}
      </div>
    </section>
  `;
}

function renderMissionCard(mission, stamps) {
  const done = mission.status === "completed";
  const status = missionStatusInfo(mission, stamps);
  const stamp = stampForMission(stamps, mission.id);
  const hasEvidence = Boolean(missionMediaDataUrl(mission));
  const moodLabel = missionMoodValues(mission).map(labelText).join(" · ");

  return `
    <article class="card mission-card ${done ? "completed" : ""}">
      <div class="mission-card-head">
        <span class="tag ${stampCategoryClass(mission.category)}">${escapeHtml(labelText(mission.category))}</span>
        <span class="mission-state ${status.className}">${status.label}</span>
      </div>
      <h3>${escapeHtml(polishText(mission.title))}</h3>
      <p>${escapeHtml(conciseMissionDescription(mission.description))}</p>
      ${hasEvidence ? `
        <figure class="mission-memory-photo ${missionMediaType(mission) === "video" ? "has-video" : ""}">
          ${renderMissionEvidence(mission, `Evidencia de ${polishText(mission.title)}`)}
        </figure>
      ` : ""}
      <div class="mission-meta">
        <span>${escapeHtml(labelText(mission.difficulty))}</span>
        ${moodLabel ? `<span>${escapeHtml(moodLabel)}</span>` : ""}
      </div>
      ${stamp ? `<p><strong>Sello desbloqueado:</strong> ${escapeHtml(polishText(stamp.name))}</p>` : ""}
      <div class="mission-actions">
        ${state.user.readOnly
          ? `<span class="mission-readonly-state">${done ? "Recuerdo guardado" : "Misión disponible"}</span>`
          : done
            ? `<button class="btn ghost" data-action="complete-modal" data-mission-id="${mission.id}">Editar recuerdo</button>
              <button class="btn danger" data-action="reset-mission" data-mission-id="${mission.id}">Rehacer misión</button>`
            : `<button class="btn primary" data-action="complete-modal" data-mission-id="${mission.id}" ${state.loading ? "disabled" : ""}>Completar</button>
              <button class="btn ghost" data-action="regenerate-mission" data-mission-id="${mission.id}" ${state.loading ? "disabled" : ""}>${buttonLabel("Cambiar misión", `mission-${mission.id}`)}</button>`}
      </div>
    </article>
  `;
}

function renderPassport(stamps, missions = []) {
  if (!stamps.length) {
    return `
      <section class="passport-shell empty">
        <h2>Pasaporte esperando sellos</h2>
        <p>Completá una misión y se desbloquea el primer recuerdo del viaje.</p>
      </section>
    `;
  }

  const missionById = new Map(missions.map((mission) => [mission.id, mission]));
  const collectionSize = Math.max(8, stamps.length);
  const locked = Array.from({ length: Math.max(0, 8 - stamps.length) }, (_, index) => `
    <article class="stamp-card locked-card">
      <div class="stamp locked"><span>${String(stamps.length + index + 1).padStart(2, "0")}</span></div>
      <h3>Por desbloquear</h3>
      <p class="muted">Una nueva aventura va a dejar su marca acá.</p>
    </article>
  `).join("");

  return `
    <section class="passport-shell">
      <div class="passport-head">
        <div>
          <span class="eyebrow">Pasaporte digital</span>
          <h2>${stamps.length} ${stamps.length === 1 ? "sello desbloqueado" : "sellos desbloqueados"}</h2>
          <p>Tu colección crece con cada historia que decidís guardar.</p>
        </div>
        <div class="passport-collection-count" aria-label="${stamps.length} de ${collectionSize} sellos conseguidos">
          <strong>${stamps.length}</strong><span>/ ${collectionSize}</span>
          <small>Colección</small>
        </div>
      </div>
      <div class="passport-progress" aria-hidden="true"><span style="width: ${Math.min(100, (stamps.length / collectionSize) * 100)}%"></span></div>
      <div class="passport-grid">
        ${stamps.map((stamp, index) => {
          const mission = missionById.get(stamp.missionId);
          const isLatest = index === stamps.length - 1;
          return `
          <article class="stamp-card unlocked-card ${stampCategoryClass(stamp.category)} ${isLatest ? "is-latest" : ""}">
            ${isLatest ? `<span class="stamp-latest">Más reciente</span>` : ""}
            ${missionMediaDataUrl(mission) ? `
              <figure class="passport-memory-image">
                ${renderMissionEvidence(mission, `Recuerdo de ${polishText(stamp.name)}`)}
              </figure>
            ` : ""}
            <div class="stamp-impression ${stampCategoryClass(stamp.category)}" aria-label="Sello ${escapeHtml(polishText(stamp.name))}">
              <span class="stamp-impression-top">Rumbo</span>
              <strong>${escapeHtml(polishText(stamp.name))}</strong>
              <span class="stamp-impression-bottom">${escapeHtml(labelText(stamp.category))}</span>
            </div>
            <div class="stamp-card-copy">
              <h3>${escapeHtml(polishText(stamp.name))}</h3>
              <p>${escapeHtml(polishText(stamp.phrase))}</p>
              ${mission?.memoryText ? `<small>${escapeHtml(polishText(mission.memoryText))}</small>` : ""}
            </div>
          </article>
        `}).join("")}
        ${locked}
      </div>
    </section>
  `;
}

function renderTravelLog(trip, missions, stamps, travelLog) {
  const completed = missions.filter((mission) => mission.status === "completed");

  if (!completed.length) {
    return `
      <section class="empty">
        <h2>La bitácora necesita recuerdos</h2>
        <p>Completá al menos una misión para convertir el viaje en relato.</p>
      </section>
    `;
  }

  if (!travelLog) {
    return `
      <section class="empty">
        <h2>Listo para escribir la bitácora</h2>
        <p>${completed.length} recuerdos pueden transformarse en una historia final de ${escapeHtml(trip.destination)}.</p>
        ${state.user.readOnly ? "" : `<button class="btn primary" data-action="generate-log" data-trip-id="${trip.id}" ${state.loading ? "disabled" : ""}>
          ${buttonLabel("Generar bitácora con IA", "log")}
        </button>`}
      </section>
    `;
  }

  const phrase = travelLog.memorablePhrases?.[0] || "Este viaje ya tiene historia.";
  const photos = completed.filter((mission) => missionMediaType(mission) === "image");
  const coverMission = photos[0];
  const coverPhoto = coverMission?.photoDataUrl || "";
  const dateRange = [formatTripDate(trip.startDate), formatTripDate(trip.endDate)].filter(Boolean).join(" al ");
  const generatedMoments = Array.isArray(travelLog.bestMoments) ? travelLog.bestMoments : [];
  const bestMoments = completed.map((mission, index) => (
    generatedMoments[index]
    || mission.note
    || mission.memoryText
    || mission.title
    || `Recuerdo ${index + 1}`
  ));
  const awards = travelLog.awards || [];

  return `
    <section class="travel-journal">
      <header class="journal-cover ${coverPhoto ? "has-photo" : ""}">
        ${coverPhoto ? `<img src="${escapeHtml(coverPhoto)}" alt="Recuerdo destacado de ${escapeHtml(trip.destination)}" style="${missionMediaPositionStyle(coverMission)}" />` : ""}
        <div class="journal-cover-copy">
          <span class="eyebrow">Bitácora de viaje</span>
          <h2>${escapeHtml(polishText(travelLog.title))}</h2>
          <div class="journal-meta">
            <span>${escapeHtml(trip.destination)}</span>
            ${dateRange ? `<span>${escapeHtml(dateRange)}</span>` : ""}
            <span>${completed.length} ${completed.length === 1 ? "recuerdo" : "recuerdos"}</span>
            <span>${stamps.length} ${stamps.length === 1 ? "sello" : "sellos"}</span>
          </div>
        </div>
      </header>

      <div class="journal-content">
        <article class="journal-story">
          <span class="journal-section-label">La historia</span>
          <p>${escapeHtml(polishText(travelLog.story))}</p>
          <blockquote>${escapeHtml(polishText(phrase))}</blockquote>
        </article>

        <aside class="journal-stamps" aria-label="Sellos del viaje">
          <span class="journal-section-label">Sellos del viaje</span>
          <div class="journal-stamp-row">
            ${stamps.map((stamp) => `
              <div class="journal-stamp ${stampCategoryClass(stamp.category)}">
                <span>Rumbo</span>
                <strong>${escapeHtml(polishText(stamp.name))}</strong>
                <small>${escapeHtml(labelText(stamp.category))}</small>
              </div>
            `).join("") || `<p class="muted">Todavía no hay sellos.</p>`}
          </div>
        </aside>
      </div>

      <section class="journal-moments">
        <div class="journal-section-head">
          <span class="journal-section-label">Recorrido</span>
          <h3>Momentos que hicieron el viaje</h3>
        </div>
        <ol class="journal-timeline">
          ${bestMoments.map((moment, index) => {
            const mission = completed[index];
            return `
              <li class="${missionMediaDataUrl(mission) ? "has-photo" : ""}">
                <span class="journal-moment-number">${String(index + 1).padStart(2, "0")}</span>
                ${missionMediaDataUrl(mission) ? renderMissionEvidence(mission, `Momento ${index + 1} del viaje`) : ""}
                <div>
                  ${mission ? `<small>${escapeHtml(labelText(mission.category))}</small>` : ""}
                  <p>${escapeHtml(polishText(moment))}</p>
                </div>
              </li>
            `;
          }).join("")}
        </ol>
      </section>

      ${awards.length ? `
        <section class="journal-awards">
          <div class="journal-section-head">
            <span class="journal-section-label">Hallazgos</span>
            <h3>Lo que dejó esta aventura</h3>
          </div>
          <div class="journal-award-list">
            ${awards.map((award, index) => `
              <div><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(polishText(award))}</p></div>
            `).join("")}
          </div>
        </section>
      ` : ""}

      <footer class="journal-share">
        <div>
          <span class="journal-section-label">Para compartir</span>
          <p>${escapeHtml(polishText(travelLog.socialCaption))}</p>
        </div>
        <div class="journal-actions">
          ${state.user.readOnly ? "" : `<button class="btn ghost" data-action="generate-log" data-trip-id="${trip.id}" ${state.loading ? "disabled" : ""}>
            ${buttonLabel("Actualizar bitácora", "log")}
          </button>`}
          <button class="btn primary" data-action="copy-caption" data-caption="${escapeHtml(travelLog.socialCaption)}">Copiar caption</button>
        </div>
      </footer>
    </section>
  `;
}

function renderLogList(title, items = []) {
  return `
    <h3>${title}</h3>
    <ul class="list">
      ${items.map((item) => `<li>${escapeHtml(polishText(item))}</li>`).join("") || "<li>Sin datos todavía.</li>"}
    </ul>
  `;
}

function renderCompleteModal(mission) {
  const mediaDataUrl = missionMediaDataUrl(mission);
  const mediaType = missionMediaType(mission);
  const posterDataUrl = missionPosterDataUrl(mission);
  const visiblePosterDataUrl = posterDataUrl || (mediaType === "video" ? videoFallbackPoster() : "");
  const hasEvidence = Boolean(mediaDataUrl);
  const isEditing = mission.status === "completed";
  const selectedMoods = new Set(
    missionMoodValues(mission)
      .map((mood) => (moodOptions.includes(mood) ? mood : legacyMoodAliases[mood]))
      .filter(Boolean)
  );
  const mediaPosition = missionMediaPosition(mission);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <section class="modal-card mission-complete-modal" role="dialog" aria-modal="true" aria-labelledby="complete-mission-title">
      <header class="mission-modal-head">
        <div class="mission-modal-title">
          <span class="tag ${stampCategoryClass(mission.category)}">${escapeHtml(labelText(mission.category))}</span>
          <span class="eyebrow">${isEditing ? "Editando recuerdo" : "Misión en curso"}</span>
          <h2 id="complete-mission-title">${escapeHtml(polishText(mission.title))}</h2>
          <p>${escapeHtml(conciseMissionDescription(mission.description))}</p>
        </div>
        <button class="mission-modal-close" data-action="close-modal" aria-label="Cerrar" title="Cerrar">×</button>
      </header>
      <form class="form mission-complete-form" data-form="complete" data-mission-id="${mission.id}">
        <section class="mission-form-section">
          <div class="mission-section-title">
            <span>1</span>
            <div>
              <h3>Sumá una evidencia</h3>
              <p>Una foto o un video puede convertir esta misión en un recuerdo.</p>
            </div>
          </div>
          <input type="hidden" id="mediaDataUrl" name="mediaDataUrl" value="${escapeHtml(mediaDataUrl)}" />
          <input type="hidden" id="mediaType" name="mediaType" value="${escapeHtml(mediaType)}" />
          <input type="hidden" id="posterDataUrl" name="posterDataUrl" value="${escapeHtml(posterDataUrl)}" />
          <input type="hidden" id="mediaPositionX" name="mediaPositionX" value="${mediaPosition.x}" />
          <input type="hidden" id="mediaPositionY" name="mediaPositionY" value="${mediaPosition.y}" />
          <input class="mission-photo-input" id="mission-media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" />
          <div class="mission-photo-drop ${hasEvidence ? "has-photo" : ""} ${mediaType === "image" ? "has-image" : ""}">
            <img src="${mediaType === "image" ? escapeHtml(mediaDataUrl) : ""}" alt="Vista previa de la evidencia" style="object-position: ${mediaPosition.x}% ${mediaPosition.y}%" draggable="false" ${mediaType === "image" ? "" : "hidden"} />
            <video src="${mediaType === "video" ? escapeHtml(mediaDataUrl) : ""}" poster="${mediaType === "video" ? escapeHtml(visiblePosterDataUrl) : ""}" controls playsinline preload="auto" data-video-preview data-fallback-poster="${posterDataUrl ? "false" : "true"}" ${mediaType === "video" ? "" : "hidden"}></video>
            <label class="mission-photo-placeholder" for="mission-media" data-action="choose-mission-media" ${hasEvidence ? "hidden" : ""}>
              <strong>Elegir foto o video</strong>
              <small>Fotos hasta 12 MB · videos hasta 40 MB y 30 segundos</small>
            </label>
            <div class="mission-photo-position-actions" ${mediaType === "image" ? "" : "hidden"}>
              <button type="button" data-action="toggle-mission-position" aria-pressed="false">Ajustar encuadre</button>
              <button type="button" data-action="center-mission-position" title="Centrar foto">Centrar</button>
            </div>
            <label class="mission-photo-change" for="mission-media" data-action="choose-mission-media">Cambiar evidencia</label>
          </div>
          <button class="mission-photo-remove" type="button" data-action="remove-mission-photo" ${hasEvidence ? "" : "hidden"}>Quitar evidencia</button>
        </section>

        <section class="mission-form-section mission-mood-field" aria-labelledby="mission-mood-title">
          <div class="mission-section-title" id="mission-mood-title">
            <span>2</span>
            <span>
              <strong>¿Cómo se sintió?</strong>
              <small>Elegí una o varias emociones que representen el momento.</small>
            </span>
          </div>
          <div class="mission-mood-options">
            ${moodOptions.map((mood) => `
              <label class="mission-mood-option">
                <input type="checkbox" name="moods" value="${mood}" ${selectedMoods.has(mood) ? "checked" : ""} />
                <span>${escapeHtml(labelText(mood))}</span>
              </label>
            `).join("")}
          </div>
        </section>

        <section class="mission-form-section mission-story-fields">
          <div class="mission-section-title">
            <span>3</span>
            <div>
              <h3>Guardá la historia</h3>
              <p>Con una o dos frases alcanza.</p>
            </div>
          </div>
          <div class="field">
            <label for="note">¿Qué hace especial este momento?</label>
            <textarea id="note" name="note" required placeholder="Contá qué viste, qué pasó o por qué querés recordarlo...">${escapeHtml(mission.note || "")}</textarea>
          </div>
          <div class="field">
            <label for="memoryText">Un detalle que no querés olvidar <span>Opcional</span></label>
            <input id="memoryText" name="memoryText" value="${escapeHtml(mission.memoryText || "")}" placeholder="Una frase, una anécdota o un detalle" />
          </div>
        </section>

        <footer class="mission-complete-footer">
          <p>${isEditing ? "El sello se conserva mientras actualizás este recuerdo." : "Al completar la misión se suma un sello a tu pasaporte."}</p>
          <button class="btn primary" type="submit" data-complete-submit data-idle-label="${isEditing ? "Guardar cambios" : "Guardar recuerdo y desbloquear sello"}" ${state.loading ? "disabled" : ""}>
            ${buttonLabel(isEditing ? "Guardar cambios" : "Guardar recuerdo y desbloquear sello", "complete")}
          </button>
        </footer>
      </form>
    </section>
  `;

  document.body.appendChild(modal);
  initializeVideoPreviews(modal);
  modal.querySelector(".mission-modal-close")?.focus({ preventScroll: true });
}

function refreshCompleteSubmitButton() {
  const modal = document.querySelector(".mission-complete-modal");
  const submitButton = modal?.querySelector("[data-complete-submit]");
  if (!submitButton) return false;

  const idleLabel = submitButton.dataset.idleLabel || "Guardar recuerdo";
  const isLoading = state.loading === "complete";
  submitButton.disabled = isLoading;
  submitButton.innerHTML = buttonLabel(idleLabel, "complete");
  modal.setAttribute("aria-busy", String(isLoading));
  return true;
}

function setMissionPhotoPosition(modal, x, y) {
  const xInput = modal?.querySelector("#mediaPositionX");
  const yInput = modal?.querySelector("#mediaPositionY");
  const image = modal?.querySelector(".mission-photo-drop img");
  if (!xInput || !yInput || !image) return;

  const nextX = Math.round(normalizeMediaPositionValue(x) * 10) / 10;
  const nextY = Math.round(normalizeMediaPositionValue(y) * 10) / 10;
  xInput.value = String(nextX);
  yInput.value = String(nextY);
  image.style.objectPosition = `${nextX}% ${nextY}%`;
}

function setMissionPhotoPositioning(dropZone, enabled, focusImage = false) {
  const image = dropZone?.querySelector("img");
  const toggle = dropZone?.querySelector('[data-action="toggle-mission-position"]');
  if (!dropZone || !image || !toggle) return;

  const active = Boolean(enabled) && !image.hidden;
  dropZone.classList.toggle("is-positioning", active);
  toggle.setAttribute("aria-pressed", String(active));
  toggle.textContent = active ? "Listo" : "Ajustar encuadre";
  image.tabIndex = active ? 0 : -1;
  if (active) {
    image.setAttribute("aria-label", "Ajustar encuadre de la foto");
    if (focusImage) image.focus({ preventScroll: true });
  } else {
    image.removeAttribute("aria-label");
  }
}

function updateMissionPhotoPreview(modal, mediaDataUrl, mediaType = "", posterDataUrl = "") {
  const hiddenInput = modal.querySelector("#mediaDataUrl");
  const typeInput = modal.querySelector("#mediaType");
  const posterInput = modal.querySelector("#posterDataUrl");
  const dropZone = modal.querySelector(".mission-photo-drop");
  const imagePreview = dropZone?.querySelector("img");
  const videoPreview = dropZone?.querySelector("video");
  const placeholder = dropZone?.querySelector(".mission-photo-placeholder");
  const positionActions = dropZone?.querySelector(".mission-photo-position-actions");
  const removeButton = modal.querySelector(".mission-photo-remove");

  if (!hiddenInput || !typeInput || !posterInput || !dropZone || !imagePreview || !videoPreview || !placeholder || !positionActions || !removeButton) return;

  hiddenInput.value = mediaDataUrl;
  typeInput.value = mediaType;
  posterInput.value = posterDataUrl;
  imagePreview.src = mediaType === "image" ? mediaDataUrl : "";
  imagePreview.hidden = mediaType !== "image";
  setMissionPhotoPosition(modal, 50, 50);
  videoPreview.src = mediaType === "video" ? mediaDataUrl : "";
  if (mediaType === "video") {
    videoPreview.poster = posterDataUrl || videoFallbackPoster();
    videoPreview.dataset.fallbackPoster = posterDataUrl ? "false" : "true";
  } else {
    videoPreview.removeAttribute("poster");
    delete videoPreview.dataset.fallbackPoster;
  }
  delete videoPreview.dataset.previewBound;
  delete videoPreview.dataset.previewReady;
  delete videoPreview.dataset.userStarted;
  videoPreview.hidden = mediaType !== "video";
  if (mediaType === "video") {
    videoPreview.load();
    initializeVideoPreviews(modal);
  }
  placeholder.hidden = Boolean(mediaDataUrl);
  positionActions.hidden = mediaType !== "image";
  removeButton.hidden = !mediaDataUrl;
  dropZone.classList.toggle("has-photo", Boolean(mediaDataUrl));
  dropZone.classList.toggle("has-image", mediaType === "image");
  dropZone.classList.toggle("has-video", mediaType === "video");
  setMissionPhotoPositioning(dropZone, mediaType === "image");
}

async function prepareMissionPhoto(file, modal) {
  const dropZone = modal.querySelector(".mission-photo-drop");
  dropZone?.classList.add("is-loading");

  try {
    const isVideo = file.type.startsWith("video/");
    if (isVideo) {
      const { mediaDataUrl, posterDataUrl } = await readMissionVideo(file);
      updateMissionPhotoPreview(modal, mediaDataUrl, "video", posterDataUrl);
    } else {
      const mediaDataUrl = await resizeMissionPhoto(file);
      updateMissionPhotoPreview(modal, mediaDataUrl, "image");
    }
    showToast(`${isVideo ? "Video" : "Foto"} listo para guardar.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    dropZone?.classList.remove("is-loading", "is-dragging");
  }
}

function renderStampUnlock(stamp, mission) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop stamp-unlock-backdrop";
  modal.innerHTML = `
    <section class="stamp-unlock-modal ${stampCategoryClass(stamp.category)}" role="dialog" aria-modal="true" aria-labelledby="stamp-unlock-title">
      <div class="stamp-burst" aria-hidden="true">
        ${Array.from({ length: 12 }, (_, index) => `<i style="--piece: ${index}"></i>`).join("")}
      </div>
      <button class="stamp-unlock-close" data-action="close-modal" aria-label="Cerrar" title="Cerrar">×</button>
      <span class="eyebrow">Nuevo sello</span>
      <div class="stamp-unlock-stage">
        <div class="stamp-unlock-shadow" aria-hidden="true"></div>
        <div class="stamp-unlock-impression" aria-hidden="true">
          <span>Rumbo</span>
          <strong>${escapeHtml(polishText(stamp.name))}</strong>
          <small>${escapeHtml(labelText(stamp.category))}</small>
        </div>
      </div>
      <h2 id="stamp-unlock-title">¡Sello desbloqueado!</h2>
      <p class="stamp-unlock-phrase">${escapeHtml(polishText(stamp.phrase))}</p>
      <div class="stamp-unlock-memory">
        ${missionMediaDataUrl(mission) ? renderMissionEvidence(mission, "Evidencia del recuerdo") : ""}
        <div>
          <span>Recuerdo guardado</span>
          <p>${escapeHtml(polishText(mission.note))}</p>
        </div>
      </div>
      <div class="stamp-unlock-actions">
        <button class="btn primary" data-action="close-modal">Ver en mi pasaporte</button>
        <button class="btn ghost" data-action="continue-missions">Seguir con otra misión</button>
      </div>
    </section>
  `;

  document.body.appendChild(modal);
  initializeVideoPreviews(modal);
  modal.querySelector(".stamp-unlock-actions .primary")?.focus({ preventScroll: true });
}

function renderDeleteTripModal(tripId) {
  const trip = state.trips.find((item) => item.id === tripId) || state.current?.trip;
  if (!trip || trip.id !== tripId) return;

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <section class="modal-card delete-trip-modal" role="dialog" aria-modal="true" aria-labelledby="delete-trip-title">
      <span class="delete-trip-symbol" aria-hidden="true">!</span>
      <span class="eyebrow">Eliminar viaje</span>
      <h2 id="delete-trip-title">¿Eliminar ${escapeHtml(trip.name)}?</h2>
      <p class="muted">Se borrarán también sus misiones, sellos y bitácora. Esta acción no se puede deshacer.</p>
      <div class="delete-trip-actions">
        <button class="btn ghost" data-action="close-modal">Cancelar</button>
        <button class="btn danger solid" data-action="confirm-delete-trip" data-trip-id="${trip.id}">Eliminar viaje</button>
      </div>
    </section>
  `;

  document.body.appendChild(modal);
  modal.querySelector("[data-action='close-modal']")?.focus();
}

function renderResetMissionModal(missionId) {
  const mission = state.current?.missions.find((item) => item.id === missionId);
  if (!mission) return;

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <section class="modal-card delete-trip-modal reset-mission-modal" role="dialog" aria-modal="true" aria-labelledby="reset-mission-title">
      <span class="delete-trip-symbol" aria-hidden="true">↺</span>
      <span class="eyebrow">Rehacer misión</span>
      <h2 id="reset-mission-title">¿Volver a hacer “${escapeHtml(polishText(mission.title))}”?</h2>
      <p class="muted">La misión volverá a pendiente. Se eliminarán su evidencia, emociones, texto y sello. Si había una bitácora, podrás generarla de nuevo con los recuerdos actuales.</p>
      <div class="delete-trip-actions">
        <button class="btn ghost" data-action="close-modal">Cancelar</button>
        <button class="btn danger solid" data-action="confirm-reset-mission" data-mission-id="${mission.id}">Rehacer misión</button>
      </div>
    </section>
  `;

  document.body.appendChild(modal);
  modal.querySelector("[data-action='close-modal']")?.focus();
}

function closeModal() {
  document.querySelector(".modal-backdrop")?.remove();
}

function render() {
  unmountInteractiveGlobe();
  if (!state.user) return renderAuth();
  if (state.view === "create") return renderCreateTrip();
  if (state.view === "trip" && state.current) return renderTrip();
  return renderDashboard();
}

async function handleAuth(form) {
  const data = Object.fromEntries(new FormData(form));
  const isRegister = state.authMode === "register";
  state.authDraft = {
    name: data.name || "",
    email: data.email || ""
  };

  const errors = validateAuthForm(data, isRegister);

  if (Object.keys(errors).length) {
    state.authErrors = errors;
    if (!refreshAuthFormPanel()) render();
    return;
  }

  state.authErrors = {};
  setLoading("auth");

  try {
    const path = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = await api(path, {
      method: "POST",
      body: JSON.stringify({ ...data, email: data.email.trim() })
    });

    saveUser(payload.user, payload.token);
    await loadTrips();
    state.view = "dashboard";
    clearLoading();
    showToast(isRegister ? "Cuenta creada. Buen viaje." : "Sesión iniciada.");
  } catch (error) {
    if (error.message.includes("Credenciales")) {
      state.authErrors = {
        form: "No encontramos una cuenta con esos datos. Revisá el email y la contraseña.",
        email: "Puede que el email no coincida con ninguna cuenta.",
        password: "La contraseña no coincide."
      };
    } else if (error.message.includes("Ya existe")) {
      state.authErrors = { email: "Ya existe una cuenta con ese email." };
    } else {
      state.authErrors = { form: error.message };
    }
    clearLoading();
  }
}

async function handleShowcaseLogin() {
  setLoading("showcase");

  try {
    const payload = await api("/api/auth/showcase");
    saveUser(payload.user, payload.token);
    await loadTrips();
    state.view = "dashboard";
    clearLoading();
    showToast("Recorrido de muestra listo para explorar.");
  } catch (error) {
    state.authErrors = { form: error.message };
    clearLoading();
  }
}

async function handleTrip(form) {
  const formData = new FormData(form);
  const values = Object.fromEntries(formData);
  values.travelStyles = formData.getAll("travelStyles");
  setLoading("trip");

  try {
    const payload = await api("/api/trips", {
      method: "POST",
      body: JSON.stringify(values)
    });

    await loadTrips();
    clearLoading();
    showToast("Viaje creado.");
    state.missionFilter = "all";
    await openTrip(payload.trip.id, "missions");
  } catch (error) {
    clearLoading();
    showToast(error.message);
  }
}

async function handleComplete(form) {
  const formData = new FormData(form);
  const values = Object.fromEntries(formData);
  values.moods = formData.getAll("moods");
  values.mood = values.moods.join(", ");

  if (!values.moods.length) {
    const moodField = form.querySelector(".mission-mood-field");
    moodField?.classList.add("is-invalid");
    moodField?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Elegí al menos una emoción para guardar el recuerdo.");
    return;
  }

  const missionId = form.dataset.missionId;
  const wasCompleted = state.current?.missions.some((mission) => mission.id === missionId && mission.status === "completed");
  setLoading("complete");

  try {
    const payload = await api(`/api/missions/${missionId}/complete`, {
      method: "PATCH",
      body: JSON.stringify(values)
    });

    closeModal();
    await openTrip(payload.mission.tripId, "passport");
    clearLoading();
    if (wasCompleted) {
      showToast("Recuerdo actualizado.");
    } else {
      renderStampUnlock(payload.stamp, payload.mission);
    }
  } catch (error) {
    clearLoading();
    showToast(error.message);
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const { action } = target.dataset;

  if (action === "showcase-login") {
    await handleShowcaseLogin();
    return;
  }

  if (action === "auth-mode") {
    state.authMode = target.dataset.mode;
    state.authErrors = {};
    state.authDraft = {};
    if (!refreshAuthFormPanel({ focusMode: true })) render();
    return;
  }

  if (action === "logout") {
    await logout();
    return;
  }

  if (action === "toggle-mission-position") {
    const dropZone = target.closest(".mission-photo-drop");
    const enabled = !dropZone?.classList.contains("is-positioning");
    setMissionPhotoPositioning(dropZone, enabled, enabled);
    return;
  }

  if (action === "center-mission-position") {
    const modal = target.closest(".mission-complete-modal");
    const dropZone = target.closest(".mission-photo-drop");
    setMissionPhotoPosition(modal, 50, 50);
    setMissionPhotoPositioning(dropZone, true, true);
    return;
  }

  const readOnlyActions = new Set([
    "new-trip",
    "delete-trip",
    "confirm-delete-trip",
    "generate-missions",
    "regenerate-mission",
    "complete-modal",
    "reset-mission",
    "confirm-reset-mission",
    "generate-log"
  ]);

  if (state.user?.readOnly && readOnlyActions.has(action)) {
    showToast("Este recorrido es solo para explorar.");
    return;
  }

  if (action === "dashboard") {
    state.view = "dashboard";
    state.current = null;
    await loadTrips();
    render();
  }

  if (action === "new-trip") {
    state.view = "create";
    render();
  }

  if (action === "open-trip") {
    await openTrip(target.dataset.tripId);
  }

  if (action === "delete-trip") {
    renderDeleteTripModal(target.dataset.tripId);
  }

  if (action === "confirm-delete-trip") {
    target.disabled = true;
    target.textContent = "Eliminando...";

    try {
      await api(`/api/trips/${target.dataset.tripId}`, {
        method: "DELETE"
      });
      closeModal();
      state.view = "dashboard";
      state.current = null;
      await loadTrips();
      render();
      showToast("Viaje eliminado.");
    } catch (error) {
      target.disabled = false;
      target.textContent = "Eliminar viaje";
      showToast(error.message);
    }
  }

  if (action === "reset-mission") {
    renderResetMissionModal(target.dataset.missionId);
  }

  if (action === "confirm-reset-mission") {
    target.disabled = true;
    target.textContent = "Preparando...";

    try {
      const payload = await api(`/api/missions/${target.dataset.missionId}/reset`, {
        method: "PATCH"
      });
      closeModal();
      await loadTrips();
      await openTrip(payload.mission.tripId, "missions");
      showToast("Misión lista para volver a hacer.");
    } catch (error) {
      target.disabled = false;
      target.textContent = "Rehacer misión";
      showToast(error.message);
    }
  }

  if (action === "tab") {
    state.activeTab = target.dataset.tab;
    render();
  }

  if (action === "filter") {
    state.missionFilter = target.dataset.filter;
    render();
  }

  if (action === "generate-missions") {
    setLoading("missions");
    try {
      const payload = await api("/api/ai/missions", {
        method: "POST",
        body: JSON.stringify({ tripId: target.dataset.tripId })
      });
      await loadTrips();
      state.missionFilter = "all";
      await openTrip(target.dataset.tripId, "missions");
      clearLoading();
      showToast(payload.ai?.source === "ai"
        ? "Misiones personalizadas creadas con Gemini."
        : "Misiones listas en modo de respaldo.");
    } catch (error) {
      clearLoading();
      showToast(error.message);
    }
  }

  if (action === "regenerate-mission") {
    const missionId = target.dataset.missionId;
    const tripId = state.current?.trip.id;
    setLoading(`mission-${missionId}`);

    try {
      const payload = await api(`/api/ai/missions/${missionId}/regenerate`, {
        method: "POST"
      });
      await loadTrips();
      await openTrip(tripId, "missions");
      clearLoading();
      showToast(payload.ai?.source === "ai"
        ? "Misión reemplazada con una nueva propuesta de Gemini."
        : "Misión reemplazada con una nueva propuesta.");
    } catch (error) {
      clearLoading();
      showToast(error.message);
    }
  }

  if (action === "complete-modal") {
    const mission = state.current.missions.find((item) => item.id === target.dataset.missionId);
    if (mission) renderCompleteModal(mission);
  }

  if (action === "close-modal") {
    closeModal();
  }

  if (action === "continue-missions") {
    closeModal();
    state.activeTab = "missions";
    render();
  }

  if (action === "remove-mission-photo") {
    const modal = target.closest(".mission-complete-modal");
    if (modal) {
      updateMissionPhotoPreview(modal, "");
      const fileInput = modal.querySelector(".mission-photo-input");
      if (fileInput) fileInput.value = "";
    }
  }

  if (target.matches('label[for="mission-media"]')) {
    const fileInput = document.querySelector("#mission-media");
    if (fileInput) fileInput.value = "";
  }

  if (action === "generate-log") {
    setLoading("log");
    try {
      const payload = await api("/api/ai/travel-log", {
        method: "POST",
        body: JSON.stringify({ tripId: target.dataset.tripId })
      });
      await loadTrips();
      await openTrip(target.dataset.tripId, "log");
      clearLoading();
      showToast(payload.ai?.source === "ai"
        ? "Bitácora narrativa creada con Gemini."
        : "Bitácora generada en modo de respaldo.");
    } catch (error) {
      clearLoading();
      showToast(error.message);
    }
  }

  if (action === "copy-caption") {
    const caption = target.dataset.caption || "";

    try {
      await navigator.clipboard.writeText(caption);
      showToast("Caption copiado.");
    } catch {
      showToast("No se pudo copiar automáticamente.");
    }
  }
});

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

document.addEventListener("pointerdown", (event) => {
  const positionImage = event.target.closest(".mission-photo-drop.is-positioning img:not([hidden])");
  if (positionImage) {
    const modal = positionImage.closest(".mission-complete-modal");
    const xInput = modal?.querySelector("#mediaPositionX");
    const yInput = modal?.querySelector("#mediaPositionY");
    const bounds = positionImage.getBoundingClientRect();
    if (!modal || !xInput || !yInput || !bounds.width || !bounds.height) return;

    event.preventDefault();
    positionImage.setPointerCapture?.(event.pointerId);
    positionImage.closest(".mission-photo-drop")?.classList.add("is-adjusting");
    activePhotoDrag = {
      pointerId: event.pointerId,
      image: positionImage,
      modal,
      bounds,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startPositionX: normalizeMediaPositionValue(xInput.value),
      startPositionY: normalizeMediaPositionValue(yInput.value)
    };
    return;
  }

});

document.addEventListener("pointermove", (event) => {
  if (!activePhotoDrag || event.pointerId !== activePhotoDrag.pointerId) return;
  event.preventDefault();
  const deltaX = ((event.clientX - activePhotoDrag.startPointerX) / activePhotoDrag.bounds.width) * 100;
  const deltaY = ((event.clientY - activePhotoDrag.startPointerY) / activePhotoDrag.bounds.height) * 100;
  setMissionPhotoPosition(
    activePhotoDrag.modal,
    activePhotoDrag.startPositionX - deltaX,
    activePhotoDrag.startPositionY - deltaY
  );
});

function finishPhotoDrag(event) {
  if (!activePhotoDrag || event.pointerId !== activePhotoDrag.pointerId) return;
  activePhotoDrag.image.closest(".mission-photo-drop")?.classList.remove("is-adjusting");
  if (activePhotoDrag.image.hasPointerCapture?.(event.pointerId)) {
    activePhotoDrag.image.releasePointerCapture(event.pointerId);
  }
  activePhotoDrag = null;
}

document.addEventListener("pointerup", finishPhotoDrag);
document.addEventListener("pointercancel", finishPhotoDrag);

document.addEventListener("keydown", (event) => {
  const positionImage = event.target.closest(".mission-photo-drop.is-positioning img");
  if (positionImage && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    const modal = positionImage.closest(".mission-complete-modal");
    const current = {
      x: normalizeMediaPositionValue(modal?.querySelector("#mediaPositionX")?.value),
      y: normalizeMediaPositionValue(modal?.querySelector("#mediaPositionY")?.value)
    };
    const step = event.shiftKey ? 10 : 2;
    event.preventDefault();
    if (event.key === "ArrowLeft") current.x -= step;
    if (event.key === "ArrowRight") current.x += step;
    if (event.key === "ArrowUp") current.y -= step;
    if (event.key === "ArrowDown") current.y += step;
    setMissionPhotoPosition(modal, current.x, current.y);
    return;
  }

});

document.addEventListener("change", async (event) => {
  const moodInput = event.target.closest(".mission-mood-option input");
  if (moodInput) {
    moodInput.closest(".mission-mood-field")?.classList.remove("is-invalid");
    return;
  }

  const input = event.target.closest(".mission-photo-input");
  const file = input?.files?.[0];
  const modal = input?.closest(".mission-complete-modal");
  if (!file || !modal) return;
  await prepareMissionPhoto(file, modal);
});

document.addEventListener("dragover", (event) => {
  const dropZone = event.target.closest(".mission-photo-drop");
  if (!dropZone) return;
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

document.addEventListener("dragleave", (event) => {
  event.target.closest(".mission-photo-drop")?.classList.remove("is-dragging");
});

document.addEventListener("drop", async (event) => {
  const dropZone = event.target.closest(".mission-photo-drop");
  if (!dropZone) return;
  event.preventDefault();
  const modal = dropZone.closest(".mission-complete-modal");
  const file = event.dataTransfer?.files?.[0];
  if (!file || !modal) return;
  await prepareMissionPhoto(file, modal);
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();

  if (state.user?.readOnly && ["trip", "complete"].includes(form.dataset.form)) {
    showToast("Este recorrido es solo para explorar.");
    return;
  }

  if (form.dataset.form === "login" || form.dataset.form === "register") {
    await handleAuth(form);
  }

  if (form.dataset.form === "trip") {
    if (!validateTripForm(form)) return;
    await handleTrip(form);
  }

  if (form.dataset.form === "complete") {
    await handleComplete(form);
  }
});

document.addEventListener("input", (event) => {
  const energyRange = event.target.closest("[data-energy-range]");
  if (energyRange) updateEnergyControl(energyRange);

  const tripForm = event.target.closest("[data-form='trip']");
  if (tripForm && event.target.name) {
    clearTripFieldValidation(event.target, tripForm);
  }

  const form = event.target.closest("[data-form='login'], [data-form='register']");
  if (!form || !event.target.name) return;

  state.authDraft[event.target.name] = event.target.value;
  delete state.authErrors[event.target.name];
  delete state.authErrors.form;
  event.target.closest(".field")?.classList.remove("invalid");
  event.target.closest(".field")?.querySelector(".field-error")?.remove();
  document.querySelector(".form-error")?.remove();
});

if (state.user) {
  loadTrips()
    .catch((error) => showToast(error.message))
    .finally(render);
} else {
  render();
}
