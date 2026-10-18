import type { VideoScene } from "./core/VideoScene.js";

export interface VideoDefinition {
  id: string;
  title: string;
  description: string;
  createScene: () => VideoScene;
}
