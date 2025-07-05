// User progress tracking for completed exercises
// Uses localStorage to track which exercises a user has completed with performance data

import { ExerciseType, CefrLevel, CompletedExerciseRecord } from "@/types/exercise";

interface UserExerciseProgress {
  completedExercises: string[]; // Array of exercise IDs (kept for backward compatibility)
  completedRecords: CompletedExerciseRecord[]; // Enhanced completion records
  lastUpdated: number;
}

// Legacy interface for migration
interface LegacyUserExerciseProgress {
  completedExercises: string[];
  lastUpdated: number;
}

class UserProgressManager {
  private getStorageKey(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): string {
    return `vjezbajmo-progress:${exerciseType}:${cefrLevel}:${theme || "default"}`;
  }

  private getGlobalStorageKey(): string {
    return `vjezbajmo-completed-exercises`;
  }

  private migrateProgressData(data: LegacyUserExerciseProgress | UserExerciseProgress): UserExerciseProgress {
    // Handle legacy data structure
    if (Array.isArray(data.completedExercises) && !("completedRecords" in data)) {
      return {
        completedExercises: data.completedExercises,
        completedRecords: [],
        lastUpdated: data.lastUpdated || Date.now(),
      };
    }

    // Handle modern data structure
    if ("completedRecords" in data) {
      return data as UserExerciseProgress;
    }

    // Fallback for completely unknown structure
    return {
      completedExercises: [],
      completedRecords: [],
      lastUpdated: Date.now(),
    };
  }

  getCompletedExercises(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): string[] {
    if (typeof window === "undefined") return []; // SSR safety

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const stored = localStorage.getItem(key);

      if (!stored) return [];

      const progress = this.migrateProgressData(JSON.parse(stored));

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

  markExerciseCompleted(
    exerciseId: string,
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string
  ): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const stored = localStorage.getItem(key);
      const existing = stored
        ? this.migrateProgressData(JSON.parse(stored))
        : {
            completedExercises: [],
            completedRecords: [],
            lastUpdated: Date.now(),
          };

      // Check if exercise is already completed
      if (!existing.completedExercises.includes(exerciseId)) {
        existing.completedExercises.push(exerciseId);
      }

      // Find existing attempt number for this exercise
      const existingAttempts = existing.completedRecords.filter((r) => r.exerciseId === exerciseId);
      const attemptNumber = existingAttempts.length + 1;

      // Create new completion record if score data is provided
      if (scoreData) {
        const completionRecord: CompletedExerciseRecord = {
          exerciseId,
          exerciseType,
          completedAt: Date.now(),
          score: {
            correct: scoreData.correct,
            total: scoreData.total,
            percentage: Math.round((scoreData.correct / scoreData.total) * 100),
          },
          cefrLevel,
          theme,
          attemptNumber,
          title,
        };

        existing.completedRecords.push(completionRecord);

        // Also store in global completed exercises for cross-type analytics
        this.addToGlobalCompletedExercises(completionRecord);
      }

      const updated: UserExerciseProgress = {
        completedExercises: existing.completedExercises,
        completedRecords: existing.completedRecords,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to mark exercise completed:", error);
    }
  }

  private addToGlobalCompletedExercises(record: CompletedExerciseRecord): void {
    try {
      const key = this.getGlobalStorageKey();
      const stored = localStorage.getItem(key);
      const existing: CompletedExerciseRecord[] = stored ? JSON.parse(stored) : [];

      existing.push(record);

      // Keep only the last 1000 records to prevent storage bloat
      const trimmed = existing.slice(-1000);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to add to global completed exercises:", error);
    }
  }

  getAllCompletedRecords(): CompletedExerciseRecord[] {
    if (typeof window === "undefined") return [];

    try {
      const key = this.getGlobalStorageKey();
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get all completed records:", error);
      return [];
    }
  }

  getCompletedRecords(exerciseType?: ExerciseType, cefrLevel?: CefrLevel, theme?: string): CompletedExerciseRecord[] {
    if (typeof window === "undefined") return [];

    try {
      if (exerciseType && cefrLevel) {
        // Get records for specific exercise type/level
        const key = this.getStorageKey(exerciseType, cefrLevel, theme);
        const stored = localStorage.getItem(key);
        if (!stored) return [];

        const progress = this.migrateProgressData(JSON.parse(stored));
        return progress.completedRecords;
      } else {
        // Get all records from global storage
        return this.getAllCompletedRecords();
      }
    } catch (error) {
      console.error("Failed to get completed records:", error);
      return [];
    }
  }

  getPerformanceStats(exerciseType?: ExerciseType): {
    totalCompleted: number;
    averageScore: number;
    byExerciseType: Record<ExerciseType, { completed: number; averageScore: number; lastAttempted?: number }>;
  } {
    const records = this.getAllCompletedRecords();

    if (exerciseType) {
      const filteredRecords = records.filter((r) => r.exerciseType === exerciseType);
      const totalCompleted = filteredRecords.length;
      const averageScore =
        totalCompleted > 0 ? filteredRecords.reduce((sum, r) => sum + r.score.percentage, 0) / totalCompleted : 0;

      return {
        totalCompleted,
        averageScore: Math.round(averageScore),
        byExerciseType: {
          verbTenses: { completed: 0, averageScore: 0 },
          nounDeclension: { completed: 0, averageScore: 0 },
          verbAspect: { completed: 0, averageScore: 0 },
          relativePronouns: { completed: 0, averageScore: 0 },
        },
      };
    }

    const totalCompleted = records.length;
    const averageScore =
      totalCompleted > 0 ? records.reduce((sum, r) => sum + r.score.percentage, 0) / totalCompleted : 0;

    const byExerciseType: Record<ExerciseType, { completed: number; averageScore: number; lastAttempted?: number }> = {
      verbTenses: { completed: 0, averageScore: 0 },
      nounDeclension: { completed: 0, averageScore: 0 },
      verbAspect: { completed: 0, averageScore: 0 },
      relativePronouns: { completed: 0, averageScore: 0 },
    };

    // Calculate stats by exercise type
    const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "relativePronouns"];

    exerciseTypes.forEach((type) => {
      const typeRecords = records.filter((r) => r.exerciseType === type);
      byExerciseType[type] = {
        completed: typeRecords.length,
        averageScore:
          typeRecords.length > 0
            ? Math.round(typeRecords.reduce((sum, r) => sum + r.score.percentage, 0) / typeRecords.length)
            : 0,
        lastAttempted: typeRecords.length > 0 ? Math.max(...typeRecords.map((r) => r.completedAt)) : undefined,
      };
    });

    return {
      totalCompleted,
      averageScore: Math.round(averageScore),
      byExerciseType,
    };
  }

  // Get performance data for a specific exercise
  getExercisePerformance(exerciseId: string, exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): {
    bestScore: number | null;
    attempts: number;
    records: CompletedExerciseRecord[];
  } {
    if (typeof window === "undefined") {
      return { bestScore: null, attempts: 0, records: [] };
    }

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return { bestScore: null, attempts: 0, records: [] };
      }

      const progress = this.migrateProgressData(JSON.parse(stored));
      const exerciseRecords = progress.completedRecords.filter(r => r.exerciseId === exerciseId);
      
      if (exerciseRecords.length === 0) {
        return { bestScore: null, attempts: 0, records: [] };
      }

      const bestScore = Math.max(...exerciseRecords.map(r => r.score.percentage));
      
      return {
        bestScore,
        attempts: exerciseRecords.length,
        records: exerciseRecords.sort((a, b) => b.completedAt - a.completedAt)
      };
    } catch (error) {
      console.error("Failed to get exercise performance:", error);
      return { bestScore: null, attempts: 0, records: [] };
    }
  }

  // Get performance summary for all exercises in a category
  getCategoryPerformanceMap(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): Map<string, {
    bestScore: number | null;
    attempts: number;
    isCompleted: boolean;
  }> {
    const performanceMap = new Map();

    if (typeof window === "undefined") {
      return performanceMap;
    }

    try {
      const key = this.getStorageKey(exerciseType, cefrLevel, theme);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return performanceMap;
      }

      const progress = this.migrateProgressData(JSON.parse(stored));
      
      // Group records by exercise ID
      const recordsByExercise = new Map<string, CompletedExerciseRecord[]>();
      progress.completedRecords.forEach(record => {
        if (!recordsByExercise.has(record.exerciseId)) {
          recordsByExercise.set(record.exerciseId, []);
        }
        recordsByExercise.get(record.exerciseId)!.push(record);
      });

      // Calculate performance for each exercise
      recordsByExercise.forEach((records, exerciseId) => {
        const bestScore = Math.max(...records.map(r => r.score.percentage));
        performanceMap.set(exerciseId, {
          bestScore,
          attempts: records.length,
          isCompleted: true
        });
      });

      return performanceMap;
    } catch (error) {
      console.error("Failed to get category performance map:", error);
      return performanceMap;
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

  clearAllProgress(): void {
    if (typeof window === "undefined") return; // SSR safety

    try {
      // Clear global completed exercises storage
      const globalKey = this.getGlobalStorageKey();
      localStorage.removeItem(globalKey);

      // Clear all exercise-type specific storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("vjezbajmo-progress:")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear the cleanup flag to force cleanup on next session
      sessionStorage.removeItem("vjezbajmo-cleaned");
    } catch (error) {
      console.error("Failed to clear all progress:", error);
      throw error; // Re-throw to allow caller to handle error feedback
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
            progress[key] = this.migrateProgressData(JSON.parse(value));
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
            const progress = this.migrateProgressData(JSON.parse(value));
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
