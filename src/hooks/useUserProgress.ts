// Custom hook for managing user progress with Clerk integration
"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { clerkUserProgressService } from "@/lib/clerk-user-progress";
import { ExerciseType, CefrLevel } from "@/types/exercise";

export function useUserProgress() {
  const { userId, isSignedIn } = useAuth();
  const [migrationComplete, setMigrationComplete] = useState(false);

  // Auto-migrate progress when user signs in
  useEffect(() => {
    if (isSignedIn && userId && !migrationComplete) {
      const migrateProgress = async () => {
        try {
          const success = await clerkUserProgressService.migrateLocalProgressToUser(userId);
          if (success) {
            setMigrationComplete(true);
          }
        } catch (error) {
          console.error('Failed to migrate user progress:', error);
        }
      };
      
      migrateProgress();
    }
  }, [isSignedIn, userId, migrationComplete]);

  const getCompletedExercises = useCallback(async (
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string
  ): Promise<string[]> => {
    return await clerkUserProgressService.getCompletedExercises(
      exerciseType,
      cefrLevel,
      theme,
      userId || undefined
    );
  }, [userId]);

  const markExerciseCompleted = useCallback(async (
    exerciseId: string,
    exerciseType: ExerciseType,
    cefrLevel: CefrLevel,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string
  ): Promise<void> => {
    await clerkUserProgressService.markExerciseCompleted(
      exerciseId,
      exerciseType,
      cefrLevel,
      theme,
      scoreData,
      title,
      userId || undefined
    );
  }, [userId]);

  const getPerformanceStats = useCallback(async (exerciseType?: ExerciseType) => {
    return await clerkUserProgressService.getPerformanceStats(
      userId || undefined,
      exerciseType
    );
  }, [userId]);

  return {
    userId,
    isSignedIn,
    migrationComplete,
    getCompletedExercises,
    markExerciseCompleted,
    getPerformanceStats,
  };
}
