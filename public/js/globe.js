import * as THREE from "/vendor/three.module.min.js";

let activeGlobe = null;

function drawPolygon(ctx, rings, width, height, shift = 0) {
  ctx.beginPath();

  rings.forEach((ring) => {
    let previousX = null;
    let wrapOffset = 0;

    ring.forEach(([longitude, latitude], index) => {
      const rawX = ((longitude + 180) / 360) * width;
      if (previousX !== null && rawX - previousX > width / 2) wrapOffset -= width;
      if (previousX !== null && previousX - rawX > width / 2) wrapOffset += width;

      const x = rawX + wrapOffset + shift;
      const y = ((90 - latitude) / 180) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      previousX = rawX;
    });

    ctx.closePath();
  });

  ctx.fill("evenodd");
  ctx.stroke();
}

function createLandMask(countries, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;

  countries.forEach((country) => {
    const polygons = country.geometry.type === "Polygon" ? [country.geometry.coordinates] : country.geometry.coordinates;
    polygons.forEach((rings) => {
      drawPolygon(ctx, rings, width, height, -width);
      drawPolygon(ctx, rings, width, height, 0);
      drawPolygon(ctx, rings, width, height, width);
    });
  });

  return canvas;
}

function createLandDetail(countries, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  for (let index = 0; index < 11000; index += 1) {
    let hash = Math.imul(index + 1, 2654435761);
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    const x = (hash >>> 0) % width;
    hash = Math.imul(hash ^ (hash >>> 13), 3266489917);
    const y = (hash >>> 0) % height;
    const angle = (((hash >>> 8) & 1023) / 1023) * Math.PI * 2;
    const length = 3 + ((hash >>> 20) & 15);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.strokeStyle = index % 5 === 0 ? "rgba(255, 238, 194, 0.16)" : "rgba(43, 49, 31, 0.15)";
    ctx.lineWidth = 0.8 + (index % 3) * 0.6;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(createLandMask(countries, width, height), 0, 0);
  return canvas;
}

function createMapTexture(topology) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, "#1f608e");
  ocean.addColorStop(0.48, "#10436f");
  ocean.addColorStop(1, "#072847");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 250, 240, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += canvas.width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const countries = window.topojson.feature(topology, topology.objects.countries).features;
  const landColors = ["#78905d", "#9b9f6c", "#c1b384", "#5f7e50", "#d1c39b"];
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = "rgba(44, 48, 35, 0.66)";
  ctx.shadowColor = "rgba(1, 14, 28, 0.72)";
  ctx.shadowBlur = 7;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  countries.forEach((country, index) => {
    ctx.fillStyle = landColors[(Number(country.id) || index) % landColors.length];
    const polygons = country.geometry.type === "Polygon" ? [country.geometry.coordinates] : country.geometry.coordinates;
    polygons.forEach((rings) => {
      drawPolygon(ctx, rings, canvas.width, canvas.height, -canvas.width);
      drawPolygon(ctx, rings, canvas.width, canvas.height, 0);
      drawPolygon(ctx, rings, canvas.width, canvas.height, canvas.width);
    });
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = "rgba(255, 239, 199, 0.24)";
  countries.forEach((country) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    const polygons = country.geometry.type === "Polygon" ? [country.geometry.coordinates] : country.geometry.coordinates;
    polygons.forEach((rings) => {
      drawPolygon(ctx, rings, canvas.width, canvas.height, -canvas.width);
      drawPolygon(ctx, rings, canvas.width, canvas.height, 0);
      drawPolygon(ctx, rings, canvas.width, canvas.height, canvas.width);
    });
  });

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(createLandDetail(countries, canvas.width, canvas.height), 0, 0);
  ctx.restore();

  ctx.globalAlpha = 0.11;
  for (let index = 0; index < 12000; index += 1) {
    const value = (index * 47) % 255;
    ctx.fillStyle = value > 130 ? "#f0dfbb" : "#18253a";
    ctx.fillRect((index * 193) % canvas.width, (index * 89) % canvas.height, 1, 1);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createReliefTexture(topology) {
  const width = 2048;
  const height = 1024;
  const countries = window.topojson.feature(topology, topology.objects.countries).features;
  const landMask = createLandMask(countries, width, height);

  const terrain = document.createElement("canvas");
  terrain.width = width;
  terrain.height = height;
  const terrainCtx = terrain.getContext("2d");
  const terrainImage = terrainCtx.createImageData(width, height);

  for (let index = 0; index < terrainImage.data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    let hash = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    const grain = ((hash ^ (hash >>> 16)) & 63) - 31;
    const broad = Math.sin(x * 0.031) * 13 + Math.cos(y * 0.047) * 11 + Math.sin((x + y) * 0.019) * 9;
    const value = Math.max(112, Math.min(232, Math.round(176 + grain * 0.72 + broad)));
    terrainImage.data[index] = value;
    terrainImage.data[index + 1] = value;
    terrainImage.data[index + 2] = value;
    terrainImage.data[index + 3] = 255;
  }

  terrainCtx.putImageData(terrainImage, 0, 0);
  terrainCtx.globalCompositeOperation = "destination-in";
  terrainCtx.drawImage(landMask, 0, 0);

  const relief = document.createElement("canvas");
  relief.width = width;
  relief.height = height;
  const reliefCtx = relief.getContext("2d");
  reliefCtx.fillStyle = "#171717";
  reliefCtx.fillRect(0, 0, width, height);
  reliefCtx.filter = "blur(0.7px)";
  reliefCtx.drawImage(terrain, 0, 0);
  reliefCtx.filter = "none";

  const texture = new THREE.CanvasTexture(relief);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

function createRoughnessTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);

  for (let index = 0; index < image.data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % canvas.width;
    const y = Math.floor(pixel / canvas.width);
    let hash = Math.imul(x + 11, 1597334677) ^ Math.imul(y + 23, 3812015801);
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    const noise = (hash ^ (hash >>> 13)) & 255;
    const value = Math.round(212 + noise * 0.14 + Math.sin(x * 0.08) * 4 + Math.cos(y * 0.1) * 4);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createOrbit(radius, color, rotation) {
  const points = [];
  for (let index = 0; index <= 160; index += 1) {
    const angle = (index / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.66 });
  const line = new THREE.LineLoop(geometry, material);
  line.rotation.set(...rotation);
  return line;
}

export function unmountInteractiveGlobe() {
  activeGlobe?.dispose();
  activeGlobe = null;
}

export async function mountInteractiveGlobe() {
  unmountInteractiveGlobe();

  const container = document.querySelector("[data-globe]");
  const canvas = container?.querySelector("canvas");
  if (!container || !canvas) return;
  if (!window.WebGLRenderingContext || !window.topojson) {
    container.closest(".auth-showcase")?.classList.add("globe-unavailable");
    return;
  }
  container.closest(".auth-showcase")?.classList.remove("globe-unavailable");

  const abortController = new AbortController();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;

  const globe = new THREE.Group();
  globe.position.y = -0.34;
  globe.rotation.x = -0.08;
  scene.add(globe);

  const roughnessTexture = createRoughnessTexture();
  const sphereGeometry = new THREE.SphereGeometry(1.36, 128, 96);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    roughnessMap: roughnessTexture,
    metalness: 0,
    bumpScale: 0.22,
    displacementScale: 0.024,
    displacementBias: -0.004
  });
  globe.add(new THREE.Mesh(sphereGeometry, sphereMaterial));

  const atmosphereGeometry = new THREE.SphereGeometry(1.405, 48, 48);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xb9d2d1,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.07
  });
  globe.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

  const orbitGroup = new THREE.Group();
  orbitGroup.position.copy(globe.position);
  orbitGroup.add(createOrbit(1.62, 0xe86f35, [1.1, 0.22, 0.16]));
  orbitGroup.add(createOrbit(1.7, 0xfff0cf, [0.84, -0.34, -0.22]));
  orbitGroup.add(createOrbit(1.58, 0x60a976, [1.36, 0.38, 0.52]));
  scene.add(orbitGroup);

  const ambient = new THREE.HemisphereLight(0xfff4dc, 0x142743, 2.1);
  const keyLight = new THREE.DirectionalLight(0xffdfb2, 3);
  keyLight.position.set(-3, 4, 5);
  const rimLight = new THREE.DirectionalLight(0x8ab5b1, 0.9);
  rimLight.position.set(4, 0, -4);
  scene.add(ambient, keyLight, rimLight);

  let animationFrame = 0;
  let dragging = false;
  let lastPointerX = 0;
  let targetRotation = 0;
  let velocity = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 520 ? 5.9 : 5.15;
    camera.updateProjectionMatrix();
  }

  function animate() {
    if (!dragging) {
      targetRotation += velocity;
      velocity *= 0.94;
      if (!reducedMotion && Math.abs(velocity) < 0.0003) targetRotation += 0.0011;
    }
    globe.rotation.y += (targetRotation - globe.rotation.y) * 0.12;
    orbitGroup.rotation.y += reducedMotion ? 0 : 0.00045;
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastPointerX = event.clientX;
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  }, { signal: abortController.signal });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - lastPointerX;
    targetRotation += delta * 0.009;
    velocity = delta * 0.00075;
    lastPointerX = event.clientX;
  }, { signal: abortController.signal });

  const finishDrag = () => {
    dragging = false;
    canvas.classList.remove("dragging");
  };
  canvas.addEventListener("pointerup", finishDrag, { signal: abortController.signal });
  canvas.addEventListener("pointercancel", finishDrag, { signal: abortController.signal });
  canvas.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    targetRotation += event.key === "ArrowLeft" ? -0.28 : 0.28;
  }, { signal: abortController.signal });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  animate();

  activeGlobe = {
    dispose() {
      abortController.abort();
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      sphereMaterial.map?.dispose();
      sphereMaterial.bumpMap?.dispose();
      roughnessTexture.dispose();
      renderer.dispose();
    }
  };

  try {
    const response = await fetch("/assets/countries-110m.json", { signal: abortController.signal });
    if (!response.ok) throw new Error("No se pudo cargar el mapa.");
    const topology = await response.json();
    if (!container.isConnected || abortController.signal.aborted) return;
    sphereMaterial.map = createMapTexture(topology);
    const reliefTexture = createReliefTexture(topology);
    sphereMaterial.bumpMap = reliefTexture;
    sphereMaterial.displacementMap = reliefTexture;
    sphereMaterial.needsUpdate = true;
  } catch (error) {
    if (error.name !== "AbortError") console.warn("El globo usa su textura de respaldo.", error);
  }
}
