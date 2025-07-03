"use client";

import { ParagraphExercise } from "@/components/ParagraphExercise";
import { SentenceExercise as SentenceExerciseComponent } from "@/components/SentenceExercise";
import { VerbAspectExerciseComponent } from "@/components/VerbAspectExercise";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import type { ParagraphExerciseSet, SentenceExerciseSet, ExerciseType, VerbAspectExercise } from "@/types/exercise";
import { AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { clientLogger } from "@/lib/client-logger";

export default function ExerciseClient({ exerciseType }: { exerciseType: ExerciseType }) {
  const { state, dispatch, forceRegenerateExercise } = useExercise();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const getCurrentExerciseData = useCallback(() => {
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
  }, [exerciseType, state.verbTensesParagraph, state.nounAdjectiveParagraph, state.verbAspectExercises, state.interrogativePronounsExercises]);

  useEffect(() => {
    // Set the exercise type and start session when component mounts
    if (exerciseType) {
      dispatch({ type: "SET_EXERCISE_TYPE", payload: exerciseType });

      // Check if this is a review session
      const isReview = searchParams.get("review") === "true";
      const previousAnswersParam = searchParams.get("answers");
      let previousAnswers: Record<string, string> | undefined;

      if (isReview && previousAnswersParam) {
        try {
          previousAnswers = JSON.parse(decodeURIComponent(previousAnswersParam));
        } catch (error) {
          console.error("Failed to parse previous answers:", error);
        }
      }

      dispatch({
        type: "START_SESSION",
        payload: {
          exerciseType,
          previousAnswers,
          isReviewMode: isReview,
        },
      });
      setIsLoading(false);
    }
  }, [exerciseType, dispatch, searchParams]);

  // Auto-generate exercises if we're serving static exercises and user has API key
  useEffect(() => {
    const shouldGenerateExercises = () => {
      // Don't generate if already attempted or currently generating
      if (hasAttemptedGeneration || state.isGenerating) return false;
      
      // Don't generate for review sessions
      if (searchParams.get("review") === "true") return false;
      
      // Only generate if user has API key
      if (!state.apiKey) return false;
      
      // Check if we're currently serving static exercises
      const currentData = getCurrentExerciseData();
      if (!currentData) return false;
      
      // Static exercise IDs are predictable
      const isServingStaticExercise = 
        (exerciseType === "verbAspect" && currentData.id === "static-verb-aspect") ||
        (exerciseType === "interrogativePronouns" && currentData.id === "static-interrogative-pronouns") ||
        (exerciseType === "verbTenses" && currentData.id === "verb-tenses-static-1") ||
        (exerciseType === "nounDeclension" && currentData.id === "noun-adjective-static-1");
      
      return isServingStaticExercise;
    };

    if (shouldGenerateExercises()) {
      setHasAttemptedGeneration(true);
      forceRegenerateExercise(exerciseType)
        .catch((error) => {
          clientLogger.exercise.generateError(exerciseType, error);
          // Don't show error to user, just continue with static exercises
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseType, state.apiKey, state.isGenerating, hasAttemptedGeneration, searchParams, forceRegenerateExercise]);
  // Note: getCurrentExerciseData is intentionally excluded from dependencies to prevent infinite re-render loop

  const handleCompleteExercise = () => {
    // This is primarily used for review mode now, since the exercise components
    // handle their own navigation for normal completion
    if (state.currentSession?.isReviewMode) {
      // If in review mode, go back to results
      router.push(`/exercise/${exerciseType}/results`);
    } else {
      // Fallback for any other completion scenarios
      dispatch({ type: "COMPLETE_SESSION" });
      router.push(`/exercise/${exerciseType}/results`);
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
        return "Koji, koja, koje";
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
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No exercise data available. Please return to selection.</AlertDescription>
      </Alert>
    );
  }

  // Show generating message when auto-generating exercises
  if (state.isGenerating && hasAttemptedGeneration) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Generating personalized exercises... This may take a moment.</AlertDescription>
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

      {exerciseType === "verbTenses" || exerciseType === "nounDeclension" ? (
        <ParagraphExercise
          exerciseSet={exerciseData as ParagraphExerciseSet}
          exerciseType={exerciseType}
          title={getExerciseTitle()}
          onComplete={handleCompleteExercise}
        />
      ) : exerciseType === "verbAspect" ? (
        <VerbAspectExerciseComponent
          exerciseSet={exerciseData as SentenceExerciseSet & { exercises: VerbAspectExercise[] }}
          exerciseType={exerciseType}
          onComplete={handleCompleteExercise}
          title={getExerciseTitle()}
        />
      ) : (
        <SentenceExerciseComponent
          exerciseSet={exerciseData as SentenceExerciseSet}
          exerciseType={exerciseType!}
          onComplete={handleCompleteExercise}
          title={getExerciseTitle()}
        />
      )}
    </>
  );
}
