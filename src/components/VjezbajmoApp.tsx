"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { ExerciseSelection } from "@/components/ExerciseSelection";
import { ParagraphExercise } from "@/components/ParagraphExercise";
import { SentenceExercise as SentenceExerciseComponent } from "@/components/SentenceExercise";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import type { ParagraphExerciseSet, SentenceExercise } from "@/types/exercise";
import { AlertTriangle } from "lucide-react";

type AppScreen = "selection" | "exercise" | "results";

export function VjezbajmoApp() {
  const { state, dispatch } = useExercise();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("selection");

  // Automatically navigate to exercise screen when a session starts
  useEffect(() => {
    if (state.currentSession && !state.currentSession.completed && currentScreen === "selection") {
      setCurrentScreen("exercise");
    }
  }, [state.currentSession, currentScreen]);

  const handleCompleteExercise = () => {
    dispatch({ type: "COMPLETE_SESSION" });
    setCurrentScreen("results");
  };

  const handleBackToSelection = () => {
    dispatch({ type: "RESET_SESSION" });
    setCurrentScreen("selection");
  };

  const handleRestartExercise = () => {
    if (state.currentExerciseType) {
      dispatch({ type: "START_SESSION", payload: { exerciseType: state.currentExerciseType } });
      setCurrentScreen("exercise");
    }
  };

  const handleReviewMistakes = () => {
    if (state.currentSession) {
      dispatch({ type: "START_REVIEW_MISTAKES", payload: state.currentSession });
      setCurrentScreen("exercise");
    }
  };

  const getCurrentExerciseData = () => {
    switch (state.currentExerciseType) {
      case "verb-tenses":
        return state.verbTensesParagraph;
      case "noun-adjective-declension":
        return state.nounAdjectiveParagraph;
      case "verb-aspect":
        return state.verbAspectExercises;
      case "interrogative-pronouns":
        return state.interrogativePronounsExercises;
      default:
        return null;
    }
  };

  const getExerciseTitle = () => {
    switch (state.currentExerciseType) {
      case "verb-tenses":
        return "Verb Tenses in Text";
      case "noun-adjective-declension":
        return "Noun & Adjective Declension";
      case "verb-aspect":
        return "Verb Aspect";
      case "interrogative-pronouns":
        return "Interrogative Pronouns";
      default:
        return "Exercise";
    }
  };

  const renderContent = () => {
    switch (currentScreen) {
      case "selection":
        return <ExerciseSelection />;

      case "exercise":
        const exerciseData = getCurrentExerciseData();

        if (!exerciseData || !state.currentExerciseType) {
          return (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No exercise data available. Please return to selection.</AlertDescription>
            </Alert>
          );
        }

        if (state.currentExerciseType === "verb-tenses" || state.currentExerciseType === "noun-adjective-declension") {
          return (
            <ParagraphExercise
              exerciseSet={exerciseData as ParagraphExerciseSet}
              onComplete={handleCompleteExercise}
              onBack={handleBackToSelection}
            />
          );
        } else {
          return (
            <SentenceExerciseComponent
              exercises={exerciseData as SentenceExercise[]}
              onComplete={handleCompleteExercise}
              onBack={handleBackToSelection}
              title={getExerciseTitle()}
            />
          );
        }

      case "results":
        return (
          <ResultsDisplay
            onBack={handleBackToSelection}
            onRestart={handleRestartExercise}
            onReviewMistakes={handleReviewMistakes}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {currentScreen === "selection" && <ApiKeyManager />}

        {state.error && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
