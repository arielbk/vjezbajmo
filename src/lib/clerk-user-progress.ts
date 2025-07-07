// Enhanced user progress system with Clerk integration
// Handles both local storage (anonymous users) and server-side storage (authenticated users)

import { ExerciseType, CefrLevel, CompletedExerciseRecord } from "@/types/exercise";
import { userProgressManager } from "./user-progress";

interface UserExerciseProgress {
  completedExercises: string[];
  completedRecords: CompletedExerciseRecord[];
  lastUpdated: number;
}

class ClerkUserProgressService {
  
  // Get user progress - checks if user is authenticated and merges local storage
  async getUserProgress(userId?: string): Promise<UserExerciseProgress | null> {
    if (!userId) {
      // Anonymous user - return local storage data
      return this.getLocalStorageProgress();
    }

    try {
      // Authenticated user - fetch from server
      const response = await fetch('/api/user/progress', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch user progress from server');
        return this.getLocalStorageProgress();
      }

      const serverProgress = await response.json();
      return serverProgress;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return this.getLocalStorageProgress();
    }
  }

  // Migrate local storage progress to user account when they sign up/sign in
  async migrateLocalProgressToUser(userId: string): Promise<boolean> {
    try {
      const localProgress = this.getLocalStorageProgress();
      
      if (!localProgress || localProgress.completedRecords.length === 0) {
        return true; // Nothing to migrate
      }

      const response = await fetch('/api/user/progress/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          localProgress,
          userId 
        }),
      });

      if (!response.ok) {
        console.error('Failed to migrate progress to user account');
        return false;
      }

      // Clear local storage after successful migration
      this.clearAllLocalProgress();
      return true;
    } catch (error) {
      console.error('Error migrating progress:', error);
      return false;
    }
  }

  // Save progress for authenticated users
  async saveProgressToUser(
    exerciseId: string,
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          exerciseType,
          cefrLevel,
          theme,
          scoreData,
          title,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving progress to user account:', error);
      return false;
    }
  }

  // Get completed exercises for a specific type/level
  async getCompletedExercises(
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string,
    userId?: string
  ): Promise<string[]> {
    if (!userId) {
      // Anonymous user - use local storage
      return userProgressManager.getCompletedExercises(exerciseType, cefrLevel, theme);
    }

    try {
      const response = await fetch(`/api/user/progress/completed?exerciseType=${exerciseType}&cefrLevel=${cefrLevel}&theme=${theme || 'default'}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback to local storage
        return userProgressManager.getCompletedExercises(exerciseType, cefrLevel, theme);
      }

      const data = await response.json();
      return data.completedExercises || [];
    } catch (error) {
      console.error('Error fetching completed exercises:', error);
      // Fallback to local storage
      return userProgressManager.getCompletedExercises(exerciseType, cefrLevel, theme);
    }
  }

  // Mark exercise as completed
  async markExerciseCompleted(
    exerciseId: string,
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      // Anonymous user - use local storage
      userProgressManager.markExerciseCompleted(
        exerciseId,
        exerciseType,
        cefrLevel,
        theme,
        scoreData,
        title
      );
      return;
    }

    // Authenticated user - save to server
    const success = await this.saveProgressToUser(
      exerciseId,
      exerciseType,
      cefrLevel,
      theme,
      scoreData,
      title
    );

    if (!success) {
      // Fallback to local storage if server save fails
      userProgressManager.markExerciseCompleted(
        exerciseId,
        exerciseType,
        cefrLevel,
        theme,
        scoreData,
        title
      );
    }
  }

  // Get performance stats
  async getPerformanceStats(userId?: string, exerciseType?: ExerciseType) {
    if (!userId) {
      // Anonymous user - use local storage
      return userProgressManager.getPerformanceStats(exerciseType);
    }

    try {
      const response = await fetch(`/api/user/progress/stats${exerciseType ? `?exerciseType=${exerciseType}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback to local storage
        return userProgressManager.getPerformanceStats(exerciseType);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      // Fallback to local storage
      return userProgressManager.getPerformanceStats(exerciseType);
    }
  }

  // Private helper methods
  private getLocalStorageProgress(): UserExerciseProgress {
    const allProgress = userProgressManager.getAllProgress();
    const allRecords = userProgressManager.getAllCompletedRecords();
    
    // Aggregate all completed exercises
    const allCompletedExercises = new Set<string>();
    Object.values(allProgress).forEach(progress => {
      progress.completedExercises.forEach(id => allCompletedExercises.add(id));
    });

    return {
      completedExercises: Array.from(allCompletedExercises),
      completedRecords: allRecords,
      lastUpdated: Date.now(),
    };
  }

  private clearAllLocalProgress(): void {
    userProgressManager.clearAllProgress();
  }
}

// Singleton instance
export const clerkUserProgressService = new ClerkUserProgressService();
