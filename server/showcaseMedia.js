const showcaseMediaByMissionId = new Map([
  [
    "mis_a266d4cd-1368-4a79-b5d4-e8dc7b3398ce",
    {
      mediaDataUrl: "/assets/showcase/sonido-del-mar.mp4",
      posterDataUrl: "/assets/showcase/sonido-del-mar.jpg"
    }
  ],
  [
    "mis_d4adf0d0-6e5f-48a8-95bc-953658887f58",
    {
      mediaDataUrl: "/assets/showcase/danza-del-viento.mp4",
      posterDataUrl: "/assets/showcase/danza-del-viento.jpg"
    }
  ]
]);

const showcaseMediaByMissionTitle = new Map([
  ["sonido del mar", showcaseMediaByMissionId.get("mis_a266d4cd-1368-4a79-b5d4-e8dc7b3398ce")],
  ["danza del viento", showcaseMediaByMissionId.get("mis_d4adf0d0-6e5f-48a8-95bc-953658887f58")]
]);

export function isShowcaseAccount(auth) {
  const showcaseEmail = (process.env.SHOWCASE_USER_EMAIL || "nose@gmail.com").trim().toLowerCase();
  return Boolean(auth?.session?.showcase || auth?.user?.email === showcaseEmail);
}

export function applyShowcaseMediaFallback(missions, enabled = false) {
  if (!enabled) return missions;

  return missions.map((mission) => {
    const normalizedTitle = String(mission.title || "").trim().toLowerCase();
    const fallback = showcaseMediaByMissionId.get(mission.id)
      || showcaseMediaByMissionTitle.get(normalizedTitle);
    const hasPlayableVideo = mission.mediaType === "video"
      && Boolean(mission.mediaDataUrl || mission.mediaPath);

    if (!fallback || hasPlayableVideo) return mission;

    return {
      ...mission,
      mediaType: "video",
      mediaDataUrl: fallback.mediaDataUrl,
      photoDataUrl: "",
      posterDataUrl: fallback.posterDataUrl
    };
  });
}
