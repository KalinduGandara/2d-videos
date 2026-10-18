import type { SimManager } from "../SimManager.js";
import type { SimBall } from "../../entities/SimBall.js";

export interface EndConditionResult {
  met: boolean;
  winner?: SimBall | null;
  message?: string;
}

export class SimEndCondition {
  check(_sim: SimManager): EndConditionResult {
    return {
      met: false
    };
  }
}
