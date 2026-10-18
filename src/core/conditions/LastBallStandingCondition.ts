import { SimEndCondition, type EndConditionResult } from "./SimEndCondition.js";
import type { SimManager } from "../SimManager.js";

interface LastBallStandingOptions {
  requireAtLeast?: number;
}

export class LastBallStandingCondition extends SimEndCondition {
  requireAtLeast: number;

  constructor(options: LastBallStandingOptions = {}) {
    super();
    this.requireAtLeast = options.requireAtLeast ?? 2;
  }

  check(sim: SimManager): EndConditionResult {
    const aliveBalls = sim.getAliveBalls();
    if (aliveBalls.length > 1) {
      return { met: false };
    }

    const allBallCount = sim.getAllBalls().length;
    if (allBallCount < this.requireAtLeast) {
      return { met: false };
    }

    const winner = aliveBalls[0] ?? null;
    if (!winner) {
      return {
        met: true,
        winner,
        message: "No winner"
      };
    }

    return {
      met: true,
      winner,
      message: `${winner.winnerTag || winner.color} wins`
    };
  }
}
