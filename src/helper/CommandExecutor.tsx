/**
 * CommandExecutor - Responsible for sending commands to the car
 * Single Responsibility: Execute command sending operations
 */
export class CommandExecutor {
  /**
   * Sends a single command
   */
  async sendCommand(
    commandKey: string,
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    const command = commandMap[commandKey];
    if (command) {
      await sendCommand(command);
    }
  }

  /**
   * Sends multiple commands in sequence
   */
  async sendCommands(
    commandKeys: string[],
    commandMap: Record<string, string>,
    sendCommand: (c: string) => Promise<void>
  ): Promise<void> {
    for (const key of commandKeys) {
      await this.sendCommand(key, commandMap, sendCommand);
    }
  }
}