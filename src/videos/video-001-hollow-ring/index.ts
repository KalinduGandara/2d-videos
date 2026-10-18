import { HollowRingVideo } from "./HollowRingVideo.js";
import type { VideoDefinition } from "../types.js";

export const video001HollowRing: VideoDefinition = {
  id: "video-001-hollow-ring",
  title: "Video 001 - Hollow Ring Duel",
  description: "Neon balls duel inside a ring with collision damage and last-ball-standing winner.",
  createScene() {
    return new HollowRingVideo();
  }
};
