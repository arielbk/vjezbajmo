"use client";

import { ResultsDisplay } from "@/components/ResultsDisplay";
import { useExercise } from "@/contexts/ExerciseContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ExerciseType } from "@/types/exercise";

export default function ResultsClient({ exerciseType }: { exerciseType: ExerciseType }) {
  const { state, dispatch, forceRegenerateExercise } = useExercise();
  const router = useRouter();

  const handleRestartExercise = () => {
    if (exerciseType) {
      dispatch({ type: "START_SESSION", payload: { exerciseType } });
      router.push(`/exercise/${exerciseType}`);
    }
  };

  const handleNextExercise = async () => {
    if (exerciseType) {
      try {
        // Generate a new exercise for the same type
        const newExerciseId = await forceRegenerateExercise(exerciseType);
        // Start new session and navigate to exercise
        dispatch({ type: "START_SESSION", payload: { exerciseType } });
        
        // Navigate to specific exercise if we have an ID, otherwise use the type route
        if (newExerciseId) {
          router.push(`/exercise/${exerciseType}/${newExerciseId}`);
        } else {
          router.push(`/exercise/${exerciseType}`);
        }
      } catch (error) {
        console.error("Failed to generate next exercise:", error);
      }
    }
  };

  const handleReviewMistakes = () => {
    if (state.currentSession) {
      // Extract current answers from session results
      const currentAnswers: Record<string, string> = {};
      state.currentSession.results.forEach((result) => {
        currentAnswers[result.questionId.toString()] = result.userAnswer || "";
      });

      // Use the new method that creates the URL with search params
      const answersParam = encodeURIComponent(JSON.stringify(currentAnswers));
      router.push(`/exercise/${exerciseType}?review=true&answers=${answersParam}`);
    }
  };

  // Check if we have a completed session
  if (!state.currentSession || !state.currentSession.completed) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No results available. Please complete an exercise first.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {state.error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <ResultsDisplay
        onRestart={handleRestartExercise}
        onReviewMistakes={handleReviewMistakes}
        onNextExercise={handleNextExercise}
      />
    </>
  );
}
