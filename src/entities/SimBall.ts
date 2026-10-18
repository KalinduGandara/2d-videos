import { SimEntity } from "../core/SimEntity.js";
import type { SimManager } from "../core/SimManager.js";

const { Bodies, Body, Vector, World } = Matter;

export interface SimBallOptions {
  name?: string;
  radius?: number;
  color?: string;
  restitution?: number;
  friction?: number;
  frictionAir?: number;
  density?: number;
  maxHealth?: number;
  health?: number;
  collisionDamageScale?: number;
  minImpactForDamage?: number;
  explodeImpactThreshold?: number;
  destroyOnZeroHealth?: boolean;
  splitOnZeroHealth?: boolean;
  canExplodeOnImpact?: boolean;
  winnerTag?: string;
  durabilityMode?: "scaled_health" | "hit_points";
  maxHits?: number;
  hitPoints?: number;
  damageCollisionTags?: string[];
  hitSpeedFactor?: number;
  speedChangeCollisionTags?: string[];
  maxSpeedAfterHit?: number | null;
  speedFactorByCollisionTag?: Record<string, number>;
}

export interface BallCollisionContext {
  otherEntity: SimEntity | null;
  otherBody: any;
  pair: any;
  impactSpeed: number;
  collisionTag: string;
}

export class SimBall extends SimEntity {
  name: string;
  radius: number;
  color: string;
  restitution: number;
  maxHealth: number;
  health: number;
  collisionDamageScale: number;
  minImpactForDamage: number;
  explodeImpactThreshold: number;
  destroyOnZeroHealth: boolean;
  splitOnZeroHealth: boolean;
  canExplodeOnImpact: boolean;
  winnerTag: string;
  durabilityMode: "scaled_health" | "hit_points";
  maxHits: number;
  hitPoints: number;
  damageCollisionTags: string[];
  hitSpeedFactor: number;
  speedChangeCollisionTags: string[];
  maxSpeedAfterHit: number | null;
  speedFactorByCollisionTag: Record<string, number>;
  body: any | null;

  constructor(sim: SimManager, x: number, y: number, options: SimBallOptions = {}) {
    super(sim, "ball");
    this.name = options.name || "ball";
    this.radius = options.radius ?? 18;
    this.color = options.color || "#00f5ff";
    this.restitution = options.restitution ?? 0.96;
    this.maxHealth = options.maxHealth ?? 100;
    this.health = options.health ?? this.maxHealth;
    this.collisionDamageScale = options.collisionDamageScale ?? 12;
    this.minImpactForDamage = options.minImpactForDamage ?? 1.2;
    this.explodeImpactThreshold = options.explodeImpactThreshold ?? Infinity;
    this.destroyOnZeroHealth = options.destroyOnZeroHealth ?? true;
    this.splitOnZeroHealth = options.splitOnZeroHealth ?? false;
    this.canExplodeOnImpact = options.canExplodeOnImpact ?? false;
    this.winnerTag = options.winnerTag ?? this.color;
    this.durabilityMode = options.durabilityMode ?? ((options.maxHits ?? options.hitPoints) !== undefined ? "hit_points" : "scaled_health");
    this.maxHits = Math.max(1, Math.floor(options.maxHits ?? options.hitPoints ?? 3));
    this.hitPoints = Math.max(0, Math.floor(options.hitPoints ?? this.maxHits));
    this.damageCollisionTags = options.damageCollisionTags ?? ["any"];
    this.hitSpeedFactor = options.hitSpeedFactor ?? 1;
    this.speedChangeCollisionTags = options.speedChangeCollisionTags ?? ["any"];
    this.maxSpeedAfterHit = options.maxSpeedAfterHit ?? null;
    this.speedFactorByCollisionTag = options.speedFactorByCollisionTag ?? {};

    this.body = Bodies.circle(x, y, this.radius, {
      restitution: this.restitution,
      friction: options.friction ?? 0.001,
      frictionAir: options.frictionAir ?? 0.001,
      density: options.density ?? 0.0018,
      label: "ball"
    });

    this.body.entity = this;
    this.body.ballId = this.name;
    World.add(this.sim.world, this.body);
  }

  update(): void {}

  show(): void {
    if (!this.body) {
      return;
    }
    const { x, y } = this.body.position;
    push();
    noStroke();
    fill(this.color);
    drawingContext.shadowBlur = 24;
    drawingContext.shadowColor = this.color;
    circle(x, y, this.radius * 2);

    const hpRatio = this.durabilityMode === "hit_points"
      ? constrain(this.hitPoints / this.maxHits, 0, 1)
      : constrain(this.health / this.maxHealth, 0, 1);
    const barW = this.radius * 1.9;
    const barH = 3;
    const by = y - this.radius - 9;
    fill(255, 255, 255, 32);
    rectMode(CENTER);
    rect(x, by, barW, barH, 3);
    fill(this.color);
    rectMode(CORNER);
    rect(x - barW * 0.5, by - barH * 0.5, barW * hpRatio, barH, 3);
    pop();
  }

  playSound(relativeSpeed = 1): void {
    this.sim.playCollisionNote(this, relativeSpeed);
  }

  onCollision(context: BallCollisionContext): void {
    if (!this.body) {
      return;
    }

    const impactSpeed = context.impactSpeed ?? 0;
    const otherEntity = context.otherEntity;
    const collisionTag = context.collisionTag || "unknown";

    this.applyHitSpeedChange(collisionTag);

    if (!this.canTakeDamageFrom(collisionTag)) {
      return;
    }

    if (this.canExplodeOnImpact && impactSpeed >= this.explodeImpactThreshold) {
      this.sim.playSplitSound(this.radius, impactSpeed);
      this.splitOrDestroy();
      return;
    }

    if (this.durabilityMode === "hit_points") {
      this.applyHitDamage(1);
      return;
    }

    let damage = 0;
    if (otherEntity?.kind === "spike") {
      damage = this.maxHealth;
    } else if (impactSpeed >= this.minImpactForDamage) {
      damage = impactSpeed * this.collisionDamageScale;
    }

    if (damage > 0) {
      this.applyDamage(damage);
    }
  }

  canTakeDamageFrom(collisionTag: string): boolean {
    if (this.damageCollisionTags.includes("any")) {
      return true;
    }
    return this.damageCollisionTags.includes(collisionTag);
  }

  applyHitDamage(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.hitPoints = Math.max(0, this.hitPoints - Math.floor(amount));
    if (this.hitPoints <= 0) {
      if (this.splitOnZeroHealth) {
        this.splitOrDestroy();
        return;
      }
      if (this.destroyOnZeroHealth) {
        this.destroy();
      }
    }
  }

  canApplySpeedChangeFrom(collisionTag: string): boolean {
    if (this.speedChangeCollisionTags.includes("any")) {
      return true;
    }
    return this.speedChangeCollisionTags.includes(collisionTag);
  }

  applyHitSpeedChange(collisionTag: string): void {
    if (!this.body) {
      return;
    }
    if (!this.canApplySpeedChangeFrom(collisionTag)) {
      return;
    }
    const hitSpeedFactor = this.getHitSpeedFactorForTag(collisionTag);
    if (!Number.isFinite(hitSpeedFactor) || hitSpeedFactor <= 0 || hitSpeedFactor === 1) {
      return;
    }

    const currentVelocity = this.body.velocity;
    let vx = currentVelocity.x * hitSpeedFactor;
    let vy = currentVelocity.y * hitSpeedFactor;

    if (this.maxSpeedAfterHit !== null && this.maxSpeedAfterHit > 0) {
      const speed = Math.hypot(vx, vy);
      if (speed > this.maxSpeedAfterHit) {
        const ratio = this.maxSpeedAfterHit / speed;
        vx *= ratio;
        vy *= ratio;
      }
    }

    Body.setVelocity(this.body, { x: vx, y: vy });
  }

  getHitSpeedFactorForTag(collisionTag: string): number {
    const specificFactor = this.speedFactorByCollisionTag[collisionTag];
    if (Number.isFinite(specificFactor)) {
      return specificFactor;
    }
    return this.hitSpeedFactor;
  }

  applyDamage(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      if (this.splitOnZeroHealth) {
        this.splitOrDestroy();
        return;
      }
      if (this.destroyOnZeroHealth) {
        this.destroy();
      }
    }
  }

  splitOrDestroy(): void {
    if (!this.body) {
      return;
    }
    if (this.radius <= 9) {
      this.destroy();
      return;
    }

    const newRadius = this.radius * 0.72;
    const baseSpeed = Math.max(2.8, this.body.speed * 0.8) * this.sim.motionSpeedScale;
    const p = this.body.position;
    const offset = newRadius * 0.95;
    const colors = this.sim.palette;

    const childOptions: SimBallOptions = {
      radius: newRadius,
      color: random(colors),
      restitution: Math.min(0.99, this.restitution + 0.015),
      maxHealth: Math.max(28, this.maxHealth * 0.62),
      health: Math.max(28, this.maxHealth * 0.62),
      collisionDamageScale: this.collisionDamageScale,
      minImpactForDamage: this.minImpactForDamage,
      canExplodeOnImpact: this.canExplodeOnImpact,
      explodeImpactThreshold: this.explodeImpactThreshold,
      splitOnZeroHealth: this.splitOnZeroHealth,
      destroyOnZeroHealth: this.destroyOnZeroHealth,
      winnerTag: this.winnerTag,
      durabilityMode: this.durabilityMode,
      maxHits: this.maxHits,
      hitPoints: this.hitPoints,
      damageCollisionTags: [...this.damageCollisionTags],
      hitSpeedFactor: this.hitSpeedFactor,
      speedChangeCollisionTags: [...this.speedChangeCollisionTags],
      maxSpeedAfterHit: this.maxSpeedAfterHit,
      speedFactorByCollisionTag: { ...this.speedFactorByCollisionTag }
    };

    const b1 = new SimBall(this.sim, p.x - offset, p.y, {
      ...childOptions,
      name: `${this.name}-split-a`
    });
    const b2 = new SimBall(this.sim, p.x + offset, p.y, {
      ...childOptions,
      name: `${this.name}-split-b`
    });

    Body.setVelocity(b1.body, Vector.create(-baseSpeed, -baseSpeed * 0.25));
    Body.setVelocity(b2.body, Vector.create(baseSpeed, -baseSpeed * 0.25));

    this.sim.addEntity(b1);
    this.sim.addEntity(b2);
    this.sim.playSplitSound(newRadius, baseSpeed);
    this.destroy();
  }

  destroy(): void {
    if (this.body) {
      World.remove(this.sim.world, this.body);
      this.body = null;
    }
    this.markDead();
  }
}
