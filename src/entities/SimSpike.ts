import { SimEntity } from "../core/SimEntity.js";
import type { SimManager } from "../core/SimManager.js";

const { Bodies, World } = Matter;

interface SimSpikeOptions {
  color?: string;
}

export class SimSpike extends SimEntity {
  size: number;
  color: string;
  body: any;

  constructor(sim: SimManager, x: number, y: number, size = 30, options: SimSpikeOptions = {}) {
    super(sim, "spike");
    this.size = size;
    this.color = options.color || "#c7ff3d";

    const h = size;
    const w = size * 0.95;
    const vertices = [
      { x: 0, y: -h * 0.6 },
      { x: -w * 0.5, y: h * 0.45 },
      { x: w * 0.5, y: h * 0.45 }
    ];

    this.body = Bodies.fromVertices(x, y, [vertices], {
      isStatic: true,
      restitution: 0.9,
      friction: 0.1,
      label: "spike"
    }, true);

    this.body.entity = this;
    World.add(this.sim.world, this.body);
  }

  show(): void {
    const verts = this.body.vertices;
    push();
    noStroke();
    fill(this.color);
    drawingContext.shadowBlur = 14;
    drawingContext.shadowColor = this.color;
    beginShape();
    for (const v of verts) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }
}
