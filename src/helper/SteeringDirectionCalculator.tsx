import { SteeringDirection } from "../types/SteeringDirection";

/**
 * SteeringDirectionCalculator - Responsible for converting angle to steering direction
 * Single Responsibility: Calculate steering direction from numeric angle
 */
export class SteeringDirectionCalculator {
  /**
   * Converts a numeric angle to a categorical steering direction
   */
  calculate(angle: number, threshold: number): SteeringDirection {
    if (angle < -threshold) return "left";
    else if (angle > threshold) return "right";
    else return "center";
  }
}