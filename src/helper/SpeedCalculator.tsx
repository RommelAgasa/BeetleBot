/**
 * SpeedCalculator - Responsible for managing speed calculations and limits
 * Single Responsibility: Calculate new speed values respecting max speed limits
 */
export class SpeedCalculator {
  /**
   * Calculates new speed after acceleration
   */
  calculateAcceleratedSpeed(
    currentSpeed: number,
    maxSpeed: number,
    speedStep: number
  ): number {
    if (currentSpeed < maxSpeed) {
      return currentSpeed + speedStep;
    }
    return currentSpeed;
  }

  /**
   * Calculates new speed after deceleration
   */
  calculateDeceleratedSpeed(
    currentSpeed: number,
    speedStep: number
  ): number {
    if (currentSpeed > 0) {
      return currentSpeed - speedStep;
    }
    return 0;
  }

  /**
   * Determines if car should stop based on speed
   */
  shouldStop(currentSpeed: number): boolean {
    return currentSpeed <= 0;
  }
}
