const activeTimers = new Map<string, NodeJS.Timeout>();

/**
 * Starts a countdown timer for a specific room.
 * If a timer already exists for the room, it is cleared.
 */
export function startTimer(roomId: string, delayMs: number, callback: () => Promise<void> | void) {
  clearTimer(roomId);

  const timeout = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      console.error(`Error in timer callback for room ${roomId}:`, error);
    } finally {
      activeTimers.delete(roomId);
    }
  }, delayMs);

  activeTimers.set(roomId, timeout);
}

/**
 * Clears the active timer for a specific room.
 */
export function clearTimer(roomId: string) {
  const timeout = activeTimers.get(roomId);
  if (timeout) {
    clearTimeout(timeout);
    activeTimers.delete(roomId);
  }
}
