import { SimEntity } from "../core/SimEntity.js";
import type { SimManager } from "../core/SimManager.js";

const { Bodies, World } = Matter;

interface SimHollowCircleOptions {
  segmentCount?: number;
  thickness?: number;
  color?: string;
}

export class SimHollowCircle extends SimEntity {
  x: number;
  y: number;
  radius: number;
  segmentCount: number;
  thickness: number;
  color: string;
  segments: any[];

  constructor(sim: SimManager, x: number, y: number, radius: number, options: SimHollowCircleOptions = {}) {
    super(sim, "hollow-circle");
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.segmentCount = options.segmentCount ?? 64;
    this.thickness = options.thickness ?? 14;
    this.color = options.color || "#f15bff";
    this.segments = [];

    this.createSegments();
  }

  createSegments(): void {
    const step = TWO_PI / this.segmentCount;
    const segmentLength = (TWO_PI * this.radius) / this.segmentCount;

    for (let i = 0; i < this.segmentCount; i += 1) {
      const angle = i * step;
      const sx = this.x + cos(angle) * this.radius;
      const sy = this.y + sin(angle) * this.radius;

      const segment = Bodies.rectangle(sx, sy, segmentLength + 2, this.thickness, {
        isStatic: true,
        angle: angle + HALF_PI,
        restitution: 0.95,
        friction: 0.01,
        label: "hollow-circle-segment"
      });

      segment.entity = this;
      this.segments.push(segment);
    }

    World.add(this.sim.world, this.segments);
  }

  show(): void {
    noStroke();
    fill(this.color);
    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = this.color;

    for (const seg of this.segments) {
      const { x, y } = seg.position;
      push();
      translate(x, y);
      rotate(seg.angle);
      rectMode(CENTER);
      rect(0, 0, seg.bounds.max.x - seg.bounds.min.x, this.thickness, 2);
      pop();
    }
  }
}
