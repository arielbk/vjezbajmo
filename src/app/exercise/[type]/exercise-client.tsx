"use client";

import { ParagraphExercise } from "@/components/ParagraphExercise";
import { SentenceExercise as SentenceExerciseComponent } from "@/components/SentenceExercise";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import { SettingsModal } from "@/components/SettingsModal";
import type { ParagraphExerciseSet, SentenceExerciseSet, ExerciseType } from "@/types/exercise";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExerciseClient({ exerciseType }: { exerciseType: ExerciseType }) {
  const { state, dispatch } = useExercise();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set the exercise type and start session when component mounts
    if (exerciseType) {
      dispatch({ type: "SET_EXERCISE_TYPE", payload: exerciseType });
      dispatch({ type: "START_SESSION", payload: { exerciseType } });
      setIsLoading(false);
    }
  }, [exerciseType, dispatch]);

  const handleCompleteExercise = () => {
    dispatch({ type: "COMPLETE_SESSION" });
    router.push(`/exercise/${exerciseType}/results`);
  };

  const handleBackToSelection = () => {
    dispatch({ type: "RESET_SESSION" });
    router.push("/");
  };

  const getCurrentExerciseData = () => {
    switch (exerciseType) {
      case "verbTenses":
        return state.verbTensesParagraph;
      case "nounDeclension":
        return state.nounAdjectiveParagraph;
      case "verbAspect":
        return state.verbAspectExercises;
      case "interrogativePronouns":
        return state.interrogativePronounsExercises;
      default:
        return null;
    }
  };

  const getExerciseTitle = () => {
    switch (exerciseType) {
      case "verbTenses":
        return "Verb Tenses in Text";
      case "nounDeclension":
        return "Noun & Adjective Declension";
      case "verbAspect":
        return "Verb Aspect";
      case "interrogativePronouns":
        return "Interrogative Pronouns";
      default:
        return "Exercise";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const exerciseData = getCurrentExerciseData();

  if (!exerciseData || !exerciseType) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No exercise data available. Please return to selection.</AlertDescription>
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

        {exerciseType === "verbTenses" || exerciseType === "nounDeclension" ? (
          <ParagraphExercise
            exerciseSet={exerciseData as ParagraphExerciseSet}
            exerciseType={exerciseType}
            title={getExerciseTitle()}
            onComplete={handleCompleteExercise}
            onBack={handleBackToSelection}
          />
        ) : (
          <SentenceExerciseComponent
            exerciseSet={exerciseData as SentenceExerciseSet}
            exerciseType={exerciseType!}
            onComplete={handleCompleteExercise}
            onBack={handleBackToSelection}
            title={getExerciseTitle()}
          />
        )}
      </div>
    </div>
  );
}
