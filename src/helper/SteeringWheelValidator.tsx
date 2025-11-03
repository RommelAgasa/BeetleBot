import { SteeringDirection } from "../types/SteeringDirection";

/**
 * SteeringValidator - Responsible for determining if steering input has meaningfully changed
 * Single Responsibility: Validate steering changes to avoid redundant commands
 */
export class SteeringValidator {
  /**
   * Checks if the steering angle has changed significantly
   */
  hasAngleChanged(
    currentAngle: number,
    lastAngle: number,
    threshold: number
  ): boolean {
    return Math.abs(currentAngle - lastAngle) > threshold;
  }

  /**
   * Checks if the steering direction category has changed
   */
  hasDirectionChanged(
    currentDirection: SteeringDirection,
    lastDirection: SteeringDirection
  ): boolean {
    return currentDirection !== lastDirection;
  }

  /**
   * Determines if steering has meaningfully changed to avoid redundant commands
   */
  hasSteeringChanged(
    currentAngle: number,
    lastAngle: number,
    currentDirection: SteeringDirection,
    lastDirection: SteeringDirection,
    angleThreshold: number
  ): boolean {
    const angleChanged = this.hasAngleChanged(currentAngle, lastAngle, angleThreshold);
    const directionChanged = this.hasDirectionChanged(currentDirection, lastDirection);
    return angleChanged || directionChanged;
  }
}
