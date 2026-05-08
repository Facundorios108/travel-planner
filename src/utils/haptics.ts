/**
 * Utility functions for triggering haptic feedback on supported devices.
 * Uses the navigator.vibrate API. Safe to call on any platform.
 */

export const hapticFeedback = {
  /**
   * Light vibration, suitable for standard button clicks or tab changes.
   */
  light: () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(10); // 10ms light tap
      } catch (e) {
        // Ignore errors
      }
    }
  },

  /**
   * Medium vibration, suitable for primary actions (like saving or adding).
   */
  medium: () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(30); // 30ms medium tap
      } catch (e) {
        // Ignore errors
      }
    }
  },

  /**
   * Heavy vibration or success pattern, suitable for completing a major flow.
   */
  success: () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([15, 30, 20]); // double tap pattern
      } catch (e) {
        // Ignore errors
      }
    }
  },
  
  /**
   * Error pattern.
   */
  error: () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([50, 50, 50]); // buzz-buzz
      } catch (e) {
        // Ignore errors
      }
    }
  }
};
