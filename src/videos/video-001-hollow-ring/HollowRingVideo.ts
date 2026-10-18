import { SimBall } from "../../entities/SimBall.js";
import { SimHollowCircle } from "../../entities/SimHollowCircle.js";
import { LastBallStandingCondition } from "../../core/conditions/LastBallStandingCondition.js";
import { VideoScene } from "../core/VideoScene.js";
import type { SimManager } from "../../core/SimManager.js";

const { Body } = Matter;

interface Video001Config {
  ring: {
    radiusRatio: number;
    thickness: number;
    segments: number;
    color: string;
  };
  physics: {
    gravityY: number;
    timeScale: number;
    motionSpeedScale: number;
    autospawnSecondBall: boolean;
  };
  balls: {
    count: number;
    radiusRatio: number;
    baseRestitution: number;
    restitutionJitter: number;
    startSpeed: number;
    directionJitter: number;
    maxHealth: number;
    durabilityMode: "scaled_health" | "hit_points";
    hitPoints: number;
    damageRules: {
      fromBall: boolean;
      fromSpike: boolean;
      fromWall: boolean;
      wallTags: string[];
    };
    hitSpeed: {
      factorPerHit: number;
      affectsCollisionTags: string[];
      maxSpeedAfterHit: number | null;
      factorByCollisionTag: Record<string, number>;
    };
    collisionDamageScale: number;
    minImpactForDamage: number;
    canExplodeOnImpact: boolean;
    explodeImpactThreshold: number;
    spawnHeightRatio: number;
    spreadRatio: number;
  };
}

const VIDEO_001_CONFIG: Video001Config = {
  ring: {
    radiusRatio: 0.35,
    thickness: 14,
    segments: 72,
    color: "#f15bff"
  },
  physics: {
    gravityY: 0,
    timeScale: 0.72,
    motionSpeedScale: 0.7,
    autospawnSecondBall: false
  },
  balls: {
    count: 6,
    radiusRatio: 0.018,
    baseRestitution: 0.988,
    restitutionJitter: 0.008,
    startSpeed: 2.8,
    directionJitter: 0.32,
    maxHealth: 3,
    durabilityMode: "hit_points",
    hitPoints: 3,
    damageRules: {
      fromBall: true,
      fromSpike: true,
      fromWall: false,
      wallTags: ["hollow-circle", "boundary"]
    },
    hitSpeed: {
      factorPerHit: 2.02,
      affectsCollisionTags: ["any"],
      maxSpeedAfterHit: 12,
      factorByCollisionTag: {
        "hollow-circle": 1.16,
        boundary: 1.16,
        ball: 1.03
      }
    },
    collisionDamageScale: 7.5,
    minImpactForDamage: 1.35,
    canExplodeOnImpact: true,
    explodeImpactThreshold: 8.8,
    spawnHeightRatio: 0.56,
    spreadRatio: 0.24
  }
};

export class HollowRingVideo extends VideoScene {
  private getDamageCollisionTags(config: Video001Config): string[] {
    const tags: string[] = [];
    if (config.balls.damageRules.fromBall) {
      tags.push("ball");
    }
    if (config.balls.damageRules.fromSpike) {
      tags.push("spike");
    }
    if (config.balls.damageRules.fromWall) {
      tags.push(...config.balls.damageRules.wallTags);
    }
    return tags.length ? tags : ["none"];
  }

  setup(simManager: SimManager): void {
    const config = VIDEO_001_CONFIG;
    const cx = width * 0.5;
    const cy = height * 0.52;
    const ringRadius = Math.min(width, height) * config.ring.radiusRatio;
    const ballRadius = Math.max(12, Math.min(width, height) * config.balls.radiusRatio);

    simManager.configurePhysics({
      gravityY: config.physics.gravityY,
      timeScale: config.physics.timeScale,
      motionSpeedScale: config.physics.motionSpeedScale
    });
    simManager.autospawnSecondBall = config.physics.autospawnSecondBall;

    const ring = new SimHollowCircle(simManager, cx, cy, ringRadius, {
      color: config.ring.color,
      thickness: config.ring.thickness,
      segmentCount: config.ring.segments
    });
    simManager.addEntity(ring);

    const palette = simManager.palette;
    const damageCollisionTags = this.getDamageCollisionTags(config);
    for (let i = 0; i < config.balls.count; i += 1) {
      const laneProgress = config.balls.count === 1 ? 0.5 : i / (config.balls.count - 1);
      const xOffset = map(laneProgress, 0, 1, -ringRadius * config.balls.spreadRatio, ringRadius * config.balls.spreadRatio);
      const yPos = cy - ringRadius * config.balls.spawnHeightRatio + Math.sin(i * 1.2) * 8;
      const color = palette[i % palette.length];
      const restitution = config.balls.baseRestitution - (i % 2) * config.balls.restitutionJitter;
      const launchAngle = ((TWO_PI / config.balls.count) * i) + random(-config.balls.directionJitter, config.balls.directionJitter);
      const launchSpeed = config.balls.startSpeed * config.physics.motionSpeedScale;

      const ball = new SimBall(simManager, cx + xOffset, yPos, {
        name: `video001-ball-${i + 1}`,
        radius: ballRadius,
        color,
        restitution,
        maxHealth: config.balls.maxHealth,
        health: config.balls.maxHealth,
        durabilityMode: config.balls.durabilityMode,
        hitPoints: config.balls.hitPoints,
        maxHits: config.balls.hitPoints,
        damageCollisionTags: [...damageCollisionTags],
        hitSpeedFactor: config.balls.hitSpeed.factorPerHit,
        speedChangeCollisionTags: [...config.balls.hitSpeed.affectsCollisionTags],
        maxSpeedAfterHit: config.balls.hitSpeed.maxSpeedAfterHit,
        speedFactorByCollisionTag: { ...config.balls.hitSpeed.factorByCollisionTag },
        collisionDamageScale: config.balls.collisionDamageScale,
        minImpactForDamage: config.balls.minImpactForDamage,
        canExplodeOnImpact: config.balls.canExplodeOnImpact,
        explodeImpactThreshold: config.balls.explodeImpactThreshold,
        splitOnZeroHealth: false,
        destroyOnZeroHealth: true,
        winnerTag: color.toUpperCase()
      });
      simManager.addEntity(ball);
      if (ball.body) {
        Body.setVelocity(ball.body, {
          x: Math.cos(launchAngle) * launchSpeed,
          y: Math.sin(launchAngle) * launchSpeed
        });
      }
    }

    simManager.addEndCondition(new LastBallStandingCondition({ requireAtLeast: config.balls.count }));
  }
}
