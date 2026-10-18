import type { SimManager } from "../../core/SimManager.js";

export class VideoScene {
  setup(_simManager: SimManager): void {
    throw new Error("VideoScene.setup(simManager) must be implemented by each video class.");
  }
}
