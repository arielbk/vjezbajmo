"use client";

import { ResultsDisplay } from "@/components/ResultsDisplay";
import { useExercise } from "@/contexts/ExerciseContext";
import { SettingsModal } from "@/components/SettingsModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ExerciseType } from "@/types/exercise";

export default function ResultsClient({ exerciseType }: { exerciseType: ExerciseType }) {
  const { state, dispatch, generateExercises } = useExercise();
  const router = useRouter();

  const handleBackToSelection = () => {
    dispatch({ type: "RESET_SESSION" });
    router.push("/");
  };

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
        await generateExercises(exerciseType);
        // Start new session and navigate to exercise
        dispatch({ type: "START_SESSION", payload: { exerciseType } });
        router.push(`/exercise/${exerciseType}`);
      } catch (error) {
        console.error("Failed to generate next exercise:", error);
      }
    }
  };

  const handleReviewMistakes = () => {
    if (state.currentSession) {
      dispatch({ type: "START_REVIEW_MISTAKES", payload: state.currentSession });
      router.push(`/exercise/${exerciseType}`);
    }
  };

  // Check if we have a completed session
  if (!state.currentSession || !state.currentSession.completed) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No results available. Please complete an exercise first.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header with app title and settings */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full bg-white inline-grid place-items-center w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-4xl">
              🇭🇷
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vježbajmo</h1>
              <p className="text-sm sm:text-base text-gray-500">Croatian Language Practice</p>
            </div>
          </div>
          <SettingsModal />
        </div>

        {state.error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <ResultsDisplay
          onBack={handleBackToSelection}
          onRestart={handleRestartExercise}
          onReviewMistakes={handleReviewMistakes}
          onNextExercise={handleNextExercise}
        />
      </div>
    </div>
  );
}
