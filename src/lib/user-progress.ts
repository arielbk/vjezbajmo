// User progress tracking for completed exercises
// Uses localStorage to track which exercises a user has completed

import { ExerciseType, CefrLevel } from "@/types/exercise";

interface UserExerciseProgress {
  completedExercises: string[]; // Array of exercise IDs
  lastUpdated: number;
}

class UserProgressManager {
  private getStorageKey(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): string {
    return `vjezbajmo-progress:${exerciseType}:${cefrLevel}:${theme || "default"}`;
  }

  getCompletedExercises(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): string[] {
    if (typeof window === "undefined") return []; // SSR safety

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const stored = localStorage.getItem(key);

      if (!stored) return [];

      const progress: UserExerciseProgress = JSON.parse(stored);

      // Check if data is older than 30 days and clear it
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      if (progress.lastUpdated < thirtyDaysAgo) {
        localStorage.removeItem(key);
        return [];
      }

      return progress.completedExercises;
    } catch (error) {
      console.error("Failed to get completed exercises:", error);
      return [];
    }
  }

  markExerciseCompleted(exerciseId: string, exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const existing = this.getCompletedExercises(exerciseType, cefrLevel, theme);

      if (!existing.includes(exerciseId)) {
        const updated: UserExerciseProgress = {
          completedExercises: [...existing, exerciseId],
          lastUpdated: Date.now(),
        };

        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch (error) {
      console.error("Failed to mark exercise completed:", error);
    }
  }

  clearCompletedExercises(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear completed exercises:", error);
    }
  }

  // Get all completed exercises across all types (for debugging/stats)
  getAllProgress(): Record<string, UserExerciseProgress> {
    if (typeof window === "undefined") return {}; // SSR safety

    const progress: Record<string, UserExerciseProgress> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vjezbajmo-progress:")) {
          const value = localStorage.getItem(key);
          if (value) {
            progress[key] = JSON.parse(value);
          }
        }
      }
    } catch (error) {
      console.error("Failed to get all progress:", error);
    }

    return progress;
  }

  // Clean up old progress data
  cleanupOldProgress(): void {
    if (typeof window === "undefined") return; // SSR safety

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vjezbajmo-progress:")) {
          const value = localStorage.getItem(key);
          if (value) {
            const progress: UserExerciseProgress = JSON.parse(value);
            if (progress.lastUpdated < thirtyDaysAgo) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to cleanup old progress:", error);
    }
  }
}

// Singleton instance
export const userProgressManager = new UserProgressManager();

// Auto-cleanup on app load (run once per session)
if (typeof window !== "undefined") {
  // Use a flag to ensure cleanup only runs once per session
  const hasCleanedThisSession = sessionStorage.getItem("vjezbajmo-cleaned");
  if (!hasCleanedThisSession) {
    userProgressManager.cleanupOldProgress();
    sessionStorage.setItem("vjezbajmo-cleaned", "true");
  }
}
