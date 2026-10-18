import type { SimManager } from "./SimManager.js";

export class SimEntity {
  sim: SimManager;
  kind: string;
  dead: boolean;

  constructor(sim: SimManager, kind = "entity") {
    this.sim = sim;
    this.kind = kind;
    this.dead = false;
  }

  update(): void {}

  show(): void {}

  markDead(): void {
    this.dead = true;
  }
}
