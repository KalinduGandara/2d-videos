import { SimEntity } from "../core/SimEntity.js";
import type { SimManager } from "../core/SimManager.js";

const { Bodies, World } = Matter;

interface SimBoundaryOptions {
  color?: string;
  restitution?: number;
  friction?: number;
}

export class SimBoundary extends SimEntity {
  w: number;
  h: number;
  color: string;
  body: any;

  constructor(sim: SimManager, x: number, y: number, w: number, h: number, options: SimBoundaryOptions = {}) {
    super(sim, "boundary");
    this.w = w;
    this.h = h;
    this.color = options.color || "#4dd0e1";

    this.body = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      restitution: options.restitution ?? 0.95,
      friction: options.friction ?? 0.05,
      label: "boundary"
    });

    this.body.entity = this;
    World.add(this.sim.world, this.body);
  }

  show(): void {
    const { x, y } = this.body.position;
    const angle = this.body.angle;
    push();
    translate(x, y);
    rotate(angle);
    noStroke();
    fill(this.color);
    drawingContext.shadowBlur = 16;
    drawingContext.shadowColor = this.color;
    rectMode(CENTER);
    rect(0, 0, this.w, this.h, 4);
    pop();
  }
}
