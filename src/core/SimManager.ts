import { SimBall } from "../entities/SimBall.js";
import type { SimEntity } from "./SimEntity.js";
import type { SimEndCondition } from "./conditions/SimEndCondition.js";

const { Engine, Events, Body, Vector } = Matter;

interface SimManagerOptions {
  autospawnSecondBall?: boolean;
  motionSpeedScale?: number;
}

export class SimManager {
  engine: any;
  world: any;
  entities: SimEntity[];
  spawnedOnFirstRingHit: boolean;
  started: boolean;
  ended: boolean;
  winner: SimBall | null;
  endMessage: string;
  endConditions: SimEndCondition[];
  palette: string[];
  scaleNotes: string[];
  audioEnabled: boolean;
  autospawnSecondBall: boolean;
  motionSpeedScale: number;
  synth: any;

  constructor(options: SimManagerOptions = {}) {
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.entities = [];
    this.spawnedOnFirstRingHit = false;
    this.started = false;
    this.ended = false;
    this.winner = null;
    this.endMessage = "";
    this.endConditions = [];

    this.palette = ["#00f5ff", "#f15bff", "#c7ff3d", "#ffd166"];
    this.scaleNotes = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];
    this.audioEnabled = false;
    this.autospawnSecondBall = options.autospawnSecondBall ?? false;
    this.motionSpeedScale = options.motionSpeedScale ?? 1;

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.005,
        decay: 0.12,
        sustain: 0.06,
        release: 0.18
      }
    }).toDestination();

    this.engine.gravity.y = 0.72;
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 8;
    this.engine.timing.timeScale = 1;

    this.registerCollisionEvents();
  }

  addEntity<T extends SimEntity>(entity: T): T {
    this.entities.push(entity);
    return entity;
  }

  setStarted(value: boolean): void {
    this.started = value;
  }

  configurePhysics(options: {
    gravityY?: number;
    timeScale?: number;
    motionSpeedScale?: number;
  }): void {
    if (options.gravityY !== undefined) {
      this.engine.gravity.y = options.gravityY;
    }
    if (options.timeScale !== undefined) {
      this.engine.timing.timeScale = options.timeScale;
    }
    if (options.motionSpeedScale !== undefined) {
      this.motionSpeedScale = options.motionSpeedScale;
    }
  }

  addEndCondition<T extends SimEndCondition>(condition: T): T {
    this.endConditions.push(condition);
    return condition;
  }

  getAllBalls(): SimBall[] {
    return this.entities.filter((e): e is SimBall => e instanceof SimBall);
  }

  getAliveBalls(): SimBall[] {
    return this.getAllBalls().filter((b) => !b.dead && b.body);
  }

  tick(): void {
    this.drawTrailFade();
    if (!this.started) {
      this.drawOutcomeBanner();
      return;
    }
    Engine.update(this.engine, 1000 / 60);
    this.updateEntities();
    this.evaluateEndConditions();
    this.renderEntities();
    this.drawOutcomeBanner();
  }

  updateEntities(): void {
    for (const e of this.entities) {
      if (!e.dead) {
        e.update();
      }
    }
    this.entities = this.entities.filter((e) => !e.dead);
  }

  renderEntities(): void {
    for (const e of this.entities) {
      e.show();
    }
  }

  drawTrailFade(): void {
    noStroke();
    fill(0, 0, 0, 45);
    rect(0, 0, width, height);
  }

  drawOutcomeBanner(): void {
    if (!this.ended) {
      return;
    }
    push();
    textAlign(CENTER, CENTER);
    textSize(22);
    const winnerColor = this.winner?.color ?? "#ffffff";
    fill(winnerColor);
    drawingContext.shadowBlur = 24;
    drawingContext.shadowColor = winnerColor;
    text(this.endMessage || "Simulation complete", width * 0.5, 34);
    pop();
  }

  async resumeAudio(): Promise<void> {
    if (this.audioEnabled) {
      return;
    }
    await Tone.start();
    this.audioEnabled = true;
  }

  playCollisionNote(ball: SimBall, relativeSpeed = 1): void {
    if (!this.audioEnabled || !ball || !ball.body) {
      return;
    }

    const speed = Math.max(relativeSpeed, ball.body.speed, 0.5);
    const radiusFactor = map(ball.radius, 8, 36, this.scaleNotes.length - 1, 0, true);
    const speedFactor = map(speed, 0, 14, 0, this.scaleNotes.length - 1, true);
    const noteIndex = Math.round((radiusFactor * 0.6) + (speedFactor * 0.4));
    const note = this.scaleNotes[constrain(noteIndex, 0, this.scaleNotes.length - 1)];
    const velocity = constrain(map(speed, 0.4, 14, 0.22, 0.95, true), 0.2, 0.95);

    this.synth.triggerAttackRelease(note, "16n", undefined, velocity);
  }

  playSplitSound(radius: number, burstSpeed: number): void {
    if (!this.audioEnabled) {
      return;
    }
    const topNoteIndex = Math.round(map(radius, 6, 26, this.scaleNotes.length - 1, 3, true));
    const topNote = this.scaleNotes[constrain(topNoteIndex, 0, this.scaleNotes.length - 1)];
    const secondIdx = constrain(topNoteIndex - 2, 0, this.scaleNotes.length - 1);
    const secondNote = this.scaleNotes[secondIdx];
    const velocity = constrain(map(burstSpeed, 1, 10, 0.35, 0.92, true), 0.35, 0.95);
    this.synth.triggerAttackRelease([secondNote, topNote], "8n", undefined, velocity);
  }

  registerCollisionEvents(): void {
    Events.on(this.engine, "collisionStart", (evt: any) => {
      for (const pair of evt.pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const entityA = bodyA.entity as SimEntity | null;
        const entityB = bodyB.entity as SimEntity | null;
        if (!entityA || !entityB) {
          continue;
        }

        const ballA = entityA instanceof SimBall ? entityA : null;
        const ballB = entityB instanceof SimBall ? entityB : null;
        const impactSpeed = Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity));
        const collisionTagForA = this.resolveCollisionTag(entityB, bodyB);
        const collisionTagForB = this.resolveCollisionTag(entityA, bodyA);

        if (ballA) {
          ballA.playSound(impactSpeed);
        }
        if (ballB) {
          ballB.playSound(impactSpeed);
        }

        if (ballA && !ballA.dead) {
          ballA.onCollision({
            otherEntity: entityB,
            otherBody: bodyB,
            pair,
            impactSpeed,
            collisionTag: collisionTagForA
          });
        }
        if (ballB && !ballB.dead) {
          ballB.onCollision({
            otherEntity: entityA,
            otherBody: bodyA,
            pair,
            impactSpeed,
            collisionTag: collisionTagForB
          });
        }

        const primaryBall = ballA || ballB;
        if (!primaryBall || primaryBall.dead) {
          continue;
        }

        const otherBody = primaryBall === ballA ? bodyB : bodyA;

        if (this.autospawnSecondBall && !this.spawnedOnFirstRingHit && otherBody.label === "hollow-circle-segment") {
          this.spawnedOnFirstRingHit = true;
          this.spawnSecondBallFrom(primaryBall);
        }
      }
    });
  }

  resolveCollisionTag(otherEntity: SimEntity | null, otherBody: any): string {
    if (otherEntity?.kind) {
      return otherEntity.kind;
    }
    if (otherBody?.label) {
      return otherBody.label;
    }
    return "unknown";
  }

  evaluateEndConditions(): void {
    if (this.ended) {
      return;
    }
    for (const condition of this.endConditions) {
      const result = condition.check(this);
      if (!result.met) {
        continue;
      }
      this.ended = true;
      this.started = false;
      this.winner = result.winner ?? null;
      this.endMessage = result.message ?? "Simulation complete";
      this.playSplitSound(8, 8);
      break;
    }
  }

  spawnSecondBallFrom(sourceBall: SimBall): void {
    if (!sourceBall || !sourceBall.body) {
      return;
    }
    const p = sourceBall.body.position;
    const newBall = new SimBall(this, p.x + 18, p.y - 12, {
      name: `${sourceBall.name}-bonus`,
      radius: sourceBall.radius * 0.92,
      color: random(this.palette),
      restitution: Math.min(0.99, sourceBall.restitution + 0.01),
      maxHealth: Math.max(36, sourceBall.maxHealth * 0.9),
      health: Math.max(36, sourceBall.health * 0.9),
      collisionDamageScale: sourceBall.collisionDamageScale,
      minImpactForDamage: sourceBall.minImpactForDamage,
      canExplodeOnImpact: sourceBall.canExplodeOnImpact,
      explodeImpactThreshold: sourceBall.explodeImpactThreshold,
      splitOnZeroHealth: sourceBall.splitOnZeroHealth,
      destroyOnZeroHealth: sourceBall.destroyOnZeroHealth,
      winnerTag: sourceBall.winnerTag,
      durabilityMode: sourceBall.durabilityMode,
      maxHits: sourceBall.maxHits,
      hitPoints: sourceBall.hitPoints,
      damageCollisionTags: [...sourceBall.damageCollisionTags],
      hitSpeedFactor: sourceBall.hitSpeedFactor,
      speedChangeCollisionTags: [...sourceBall.speedChangeCollisionTags],
      maxSpeedAfterHit: sourceBall.maxSpeedAfterHit,
      speedFactorByCollisionTag: { ...sourceBall.speedFactorByCollisionTag }
    });
    Body.setVelocity(newBall.body, {
      x: 2.2 * this.motionSpeedScale,
      y: -1.4 * this.motionSpeedScale
    });
    this.addEntity(newBall);
    this.playSplitSound(newBall.radius, 4.5);
  }
}
