"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { useResetExerciseState } from "@/hooks/useResetExerciseState";
import type { SentenceExercise, SentenceExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { getExerciseSourceInfo } from "@/lib/exercise-source-utils";
import { Check, X, AlertTriangle } from "lucide-react";
import { getExerciseDescription } from "@/lib/exercise-descriptions";
import { ExerciseInfoButton } from "@/components/ExerciseInfoButton";
import { ExerciseFooter } from "@/components/ExerciseFooter";
import { ReviewModeUI } from "@/components/ReviewModeUI";

interface SentenceExerciseProps {
  exerciseSet: SentenceExerciseSet;
  exerciseType: ExerciseType;
  onComplete: () => void;
  title: string;
}

export function SentenceExercise({ exerciseSet, exerciseType, onComplete, title }: SentenceExerciseProps) {
  const {
    dispatch,
    checkAnswer,
    state,
    markExerciseCompleted,
  } = useExercise();
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Extract exercises from the set
  const exercises = exerciseSet.exercises;

  // Reset component state when exercise set changes (new exercise loaded)
  useResetExerciseState(exerciseSet.id, setAnswers, setResults, setHasChecked, () => {});

  // Initialize answers from previous session in review mode
  useEffect(() => {
    if (state.currentSession?.isReviewMode && state.currentSession?.previousAnswers) {
      setAnswers(state.currentSession.previousAnswers);
    }
  }, [state.currentSession]);

  const handleAnswerChange = (questionId: string | number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckAllAnswers = async () => {
    setIsChecking(true);
    const newResults: Record<string | number, ReturnType<typeof createExerciseResult>> = {};

    try {
      for (const exercise of exercises) {
        const userAnswer = answers[exercise.id] || "";

        if (isStaticExercise(exercise.id)) {
          // Handle static exercise locally
          const result = createExerciseResult(exercise.id, userAnswer, exercise.correctAnswer, exercise.explanation);
          newResults[exercise.id] = result;
          dispatch({ type: "ADD_RESULT", payload: result });
        } else {
          // Handle generated exercise via API
          try {
            const apiResponse = await checkAnswer(exercise.id as string, userAnswer);
            const exerciseResult: ReturnType<typeof createExerciseResult> = {
              questionId: exercise.id,
              userAnswer,
              correct: apiResponse.correct,
              explanation: apiResponse.explanation,
              correctAnswer: apiResponse.correct ? undefined : apiResponse.correctAnswer,
              diacriticWarning: apiResponse.diacriticWarning,
              matchedAnswer: apiResponse.matchedAnswer,
            };
            newResults[exercise.id] = exerciseResult;
            dispatch({ type: "ADD_RESULT", payload: exerciseResult });
          } catch {
            // Fallback to local checking if API fails
            const result = createExerciseResult(exercise.id, userAnswer, exercise.correctAnswer, exercise.explanation);
            newResults[exercise.id] = result;
            dispatch({ type: "ADD_RESULT", payload: result });
          }
        }
      }

      setResults(newResults);
      setHasChecked(true);

      // Calculate correct answers from the new results
      const correctCount = Object.values(newResults).filter((r) => r.correct).length;

      // Mark the exercise as completed when answers are checked
      markExerciseCompleted(
        exerciseSet.id,
        exerciseType,
        undefined,
        { correct: correctCount, total: exercises.length },
        title
      );
    } catch (error) {
      console.error("Error checking answers:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChecked && allAnswered) {
      handleCheckAllAnswers();
    }
  };

  const getInputStyling = (result: ReturnType<typeof createExerciseResult> | undefined) => {
    if (!result) return "";
    if (result.correct && result.diacriticWarning) {
      return "border-yellow-500 bg-yellow-50";
    }
    if (result.correct) {
      return "border-green-500 bg-green-50";
    }
    return "border-red-500 bg-red-50";
  };

  const getResultIcon = (result: ReturnType<typeof createExerciseResult> | undefined) => {
    if (!result) return null;
    if (result.correct && result.diacriticWarning) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600 inline" />;
    }
    if (result.correct) {
      return <Check className="h-4 w-4 text-green-600 inline" />;
    }
    return <X className="h-4 w-4 text-red-600 inline" />;
  };

  const renderSentenceWithInput = (exercise: SentenceExercise) => {
    const parts = exercise.text.split("_____");
    const result = results[exercise.id];
    const userAnswer = answers[exercise.id] || "";

    return (
      <div className="text-sm sm:text-base lg:text-lg leading-relaxed">
        <span>{parts[0]}</span>
        <span className="inline-block mx-0.5 sm:mx-1">
          <Input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
            className={`inline-block w-24 sm:w-32 lg:w-40 text-center ${getInputStyling(result)}`}
            disabled={hasChecked}
          />
          {result && <span className="ml-1">{getResultIcon(result)}</span>}
          {exercise.isPlural && <span className="ml-1 text-xs text-muted-foreground italic">(plural)</span>}
        </span>
        <span>{parts[1] || ""}</span>
        {result && result.correct && result.diacriticWarning && (
          <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-1.5 sm:p-2 rounded">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Correct! Remember to use proper diacritics: <strong>{result.matchedAnswer}</strong>
          </div>
        )}
      </div>
    );
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const filledAnswers = exercises.filter((ex) => answers[ex.id] && answers[ex.id].trim() !== "").length;
  const progress = hasChecked ? 100 : (filledAnswers / exercises.length) * 100;

  // Get exercise source info for MVP static-first messaging
  const sourceInfo = getExerciseSourceInfo(exerciseSet.id, exerciseType);
  const allAnswered = exercises.every((ex) => answers[ex.id] && answers[ex.id].trim() !== "");

  return (
    <>
      {/* Fixed progress bar at top of viewport - nprogress style */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="w-full h-1 rounded-none border-none bg-transparent" />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 px-2 sm:px-4">
        {hasChecked && (
          <div className="flex justify-end">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Final Score: {correctAnswers}/{exercises.length} ({Math.round((correctAnswers / exercises.length) * 100)}
              %)
            </div>
          </div>
        )}

        <Card className="mx-0 sm:mx-auto">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">{title}</CardTitle>
              <ExerciseInfoButton 
                exerciseId={exerciseSet.id} 
                exerciseType={exerciseType} 
                cefrLevel={state.cefrLevel}
                currentIndex={sourceInfo.currentIndex}
                totalCount={sourceInfo.totalCount}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{getExerciseDescription(exerciseType)}</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-8 px-3 sm:px-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="space-y-2 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-sm font-medium text-muted-foreground mt-1 min-w-[1.2rem] sm:min-w-[2rem] flex-shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/30 p-2 sm:p-4 rounded-lg">{renderSentenceWithInput(exercise)}</div>

                      {hasChecked && results[exercise.id] && (
                        <div className="mt-2 sm:mt-3 border rounded-lg p-2 sm:p-3">
                          <div className="flex items-start gap-2">
                            {results[exercise.id].correct ? (
                              <Check className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              {!results[exercise.id].correct && (
                                <div className="mb-2 text-sm">
                                  Your answer: <span className="font-mono">{results[exercise.id].userAnswer}</span>
                                  {" → "}
                                  Correct:{" "}
                                  <span className="font-mono text-green-600">{results[exercise.id].correctAnswer}</span>
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground">{results[exercise.id].explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                {!hasChecked ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Button type="submit" disabled={isChecking || !allAnswered} size="lg">
                        {isChecking ? "Checking..." : "Check My Work"}
                      </Button>
                      {!allAnswered && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Please answer all questions before checking.
                        </p>
                      )}
                    </div>

                    {state.currentSession?.isReviewMode && (
                      <ReviewModeUI
                        onClearAnswers={() => {
                          setAnswers({});
                          setResults({});
                          setHasChecked(false);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <ExerciseFooter
                    exerciseType={exerciseType}
                    correctAnswers={correctAnswers}
                    totalAnswers={exercises.length}
                    isReviewMode={state.currentSession?.isReviewMode}
                    onTryAgain={() => {
                      setAnswers(state.currentSession?.previousAnswers || {});
                      setResults({});
                      setHasChecked(false);
                    }}
                    onComplete={onComplete}
                  />
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
