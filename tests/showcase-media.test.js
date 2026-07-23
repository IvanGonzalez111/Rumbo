import test from "node:test";
import assert from "node:assert/strict";
import { applyShowcaseMediaFallback } from "../server/showcaseMedia.js";

const showcaseMissionId = "mis_a266d4cd-1368-4a79-b5d4-e8dc7b3398ce";

test("restores a playable showcase video when production only retained its poster", () => {
  const [mission] = applyShowcaseMediaFallback([
    {
      id: showcaseMissionId,
      mediaType: "image",
      mediaDataUrl: "data:image/jpeg;base64,poster",
      photoDataUrl: "data:image/jpeg;base64,poster"
    }
  ], true);

  assert.equal(mission.mediaType, "video");
  assert.equal(mission.mediaDataUrl, "/assets/showcase/sonido-del-mar.mp4");
  assert.equal(mission.posterDataUrl, "/assets/showcase/sonido-del-mar.jpg");
  assert.equal(mission.photoDataUrl, "");
});

test("keeps a video uploaded by the user instead of replacing it", () => {
  const original = {
    id: showcaseMissionId,
    mediaType: "video",
    mediaDataUrl: "data:video/mp4;base64,new-video",
    posterDataUrl: "data:image/jpeg;base64,new-poster"
  };

  const [mission] = applyShowcaseMediaFallback([original], true);
  assert.deepEqual(mission, original);
});

test("restores showcase media by title when sanitized data has a different id", () => {
  const [mission] = applyShowcaseMediaFallback([
    {
      id: "mis_sanitized",
      title: "Sonido del Mar",
      mediaType: "image",
      mediaDataUrl: "data:image/jpeg;base64,poster"
    }
  ], true);

  assert.equal(mission.mediaType, "video");
  assert.equal(mission.mediaDataUrl, "/assets/showcase/sonido-del-mar.mp4");
});

test("does not change regular accounts or unrelated missions", () => {
  const missions = [{ id: showcaseMissionId, mediaType: "image" }, { id: "mis_other", mediaType: "image" }];
  assert.deepEqual(applyShowcaseMediaFallback(missions, false), missions);
  assert.deepEqual(applyShowcaseMediaFallback([missions[1]], true), [missions[1]]);
});
