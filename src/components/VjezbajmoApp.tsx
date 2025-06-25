"use client";

import { ExerciseSelection } from "@/components/ExerciseSelection";
import { ParagraphExercise } from "@/components/ParagraphExercise";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { SentenceExercise as SentenceExerciseComponent } from "@/components/SentenceExercise";
import { CompletedExercisesView } from "@/components/CompletedExercisesView";
import { SettingsModal } from "@/components/SettingsModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import type { ParagraphExerciseSet, SentenceExerciseSet } from "@/types/exercise";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

type AppScreen = "selection" | "exercise" | "results" | "completed";

export function VjezbajmoApp() {
  const { state, dispatch, generateExercises } = useExercise();
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

  const handleViewCompletedExercises = () => {
    setCurrentScreen("completed");
  };

  const handleRestartExercise = () => {
    if (state.currentExerciseType) {
      dispatch({ type: "START_SESSION", payload: { exerciseType: state.currentExerciseType } });
      setCurrentScreen("exercise");
    }
  };

  const handleNextExercise = async () => {
    if (state.currentExerciseType) {
      try {
        // Generate a new exercise for the same type
        await generateExercises(state.currentExerciseType);
        // Start new session and navigate to exercise
        dispatch({ type: "START_SESSION", payload: { exerciseType: state.currentExerciseType } });
        setCurrentScreen("exercise");
      } catch (error) {
        console.error("Failed to generate next exercise:", error);
      }
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
    switch (state.currentExerciseType) {
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

  const renderContent = () => {
    switch (currentScreen) {
      case "selection":
        return <ExerciseSelection onViewCompleted={handleViewCompletedExercises} />;

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

        if (state.currentExerciseType === "verbTenses" || state.currentExerciseType === "nounDeclension") {
          return (
            <ParagraphExercise
              exerciseSet={exerciseData as ParagraphExerciseSet}
              exerciseType={state.currentExerciseType}
              title={getExerciseTitle()}
              onComplete={handleCompleteExercise}
              onBack={handleBackToSelection}
            />
          );
        } else {
          return (
            <SentenceExerciseComponent
              exerciseSet={exerciseData as SentenceExerciseSet}
              exerciseType={state.currentExerciseType!}
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
            onNextExercise={handleNextExercise}
          />
        );

      case "completed":
        return <CompletedExercisesView onBack={handleBackToSelection} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header with app title and settings */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="mr-2 rounded-full bg-white inline-grid place-items-center w-12 h-12 text-4xl">🇭🇷</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vježbajmo</h1>
              <p className="text-gray-500">Croatian Language Practice</p>
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

        {renderContent()}
      </div>
    </div>
  );
}
