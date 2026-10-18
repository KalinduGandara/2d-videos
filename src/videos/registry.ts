import { video001HollowRing } from "./video-001-hollow-ring/index.js";
import type { VideoDefinition } from "./types.js";

export const videoRegistry: VideoDefinition[] = [
  video001HollowRing
];

export function getVideoById(id: string): VideoDefinition {
  return videoRegistry.find((video) => video.id === id) || videoRegistry[0];
}
