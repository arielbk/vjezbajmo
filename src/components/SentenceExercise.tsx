"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { useResetExerciseState } from "@/hooks/useResetExerciseState";
import type { SentenceExercise, SentenceExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { Check, X, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { getExerciseDescription } from "@/lib/exercise-descriptions";
import { GenerateNewQuestionsCard } from "@/components/GenerateNewQuestionsCard";

interface SentenceExerciseProps {
  exerciseSet: SentenceExerciseSet;
  exerciseType: ExerciseType;
  onComplete: () => void;
  title: string;
}

export function SentenceExercise({ exerciseSet, exerciseType, onComplete, title }: SentenceExerciseProps) {
  const router = useRouter();
  const { dispatch, checkAnswer, forceRegenerateExercise, state, markExerciseCompleted } = useExercise();
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

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
    const inputId = `answer-${exercise.id}`;

    return (
      <div className="text-sm sm:text-base lg:text-lg leading-relaxed">
        <label htmlFor={inputId} className="sr-only">
          Fill in the blank for: {exercise.text.replace("_____", "blank space")}
          {exercise.isPlural ? " (plural form required)" : ""}
        </label>
        <span>{parts[0]}</span>
        <span className="inline-block mx-0.5 sm:mx-1">
          <Input
            id={inputId}
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
            className={`inline-block w-24 sm:w-32 lg:w-40 text-center ${getInputStyling(result)}`}
            placeholder="Your answer"
            disabled={hasChecked}
            aria-describedby={result ? `result-${exercise.id}` : undefined}
            aria-invalid={result && !result.correct ? "true" : "false"}
          />
          {result && (
            <span className="ml-1" aria-hidden="true">
              {getResultIcon(result)}
            </span>
          )}
          {exercise.isPlural && (
            <span className="ml-1 text-xs text-muted-foreground italic" aria-label="Plural form required">
              (plural)
            </span>
          )}
        </span>
        <span>{parts[1] || ""}</span>
        {result && result.correct && result.diacriticWarning && (
          <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-1.5 sm:p-2 rounded" role="alert" id={`result-${exercise.id}`}>
            <AlertTriangle className="h-4 w-4 inline mr-1" aria-hidden="true" />
            Correct! Remember to use proper diacritics: <strong>{result.matchedAnswer}</strong>
          </div>
        )}
      </div>
    );
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const filledAnswers = exercises.filter((ex) => answers[ex.id] && answers[ex.id].trim() !== "").length;
  const progress = hasChecked ? 100 : (filledAnswers / exercises.length) * 100;
  const allAnswered = exercises.every((ex) => answers[ex.id] && answers[ex.id].trim() !== "");

  return (
    <>
      {/* Fixed progress bar at top of viewport - nprogress style */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress 
          value={progress} 
          className="w-full h-1 rounded-none border-none bg-transparent"
          aria-label={`Exercise progress: ${hasChecked ? "Complete" : `${filledAnswers} of ${exercises.length} questions answered`}`}
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 px-2 sm:px-4">
        {hasChecked && (
          <div className="flex justify-end" role="status" aria-live="polite">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Final Score: {correctAnswers}/{exercises.length} ({Math.round((correctAnswers / exercises.length) * 100)}
              %)
            </div>
          </div>
        )}

        <Card className="mx-0 sm:mx-auto">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{getExerciseDescription(exerciseType)}</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-8 px-3 sm:px-6">
            <form onSubmit={handleFormSubmit} aria-label="Exercise questions">
              <fieldset>
                <legend className="sr-only">Fill in the blanks in the following sentences</legend>
                {exercises.map((exercise, index) => (
                  <div key={exercise.id} className="space-y-2 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-sm font-medium text-muted-foreground mt-1 min-w-[1.2rem] sm:min-w-[2rem] flex-shrink-0" aria-hidden="true">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/30 p-2 sm:p-4 rounded-lg" role="group" aria-labelledby={`question-${index}`}>
                          <div id={`question-${index}`} className="sr-only">Question {index + 1}</div>
                          {renderSentenceWithInput(exercise)}
                        </div>

                        {hasChecked && results[exercise.id] && (
                          <div className="mt-2 sm:mt-3 border rounded-lg p-2 sm:p-3" role="region" aria-labelledby={`result-heading-${exercise.id}`} id={`result-${exercise.id}`}>
                            <div className="flex items-start gap-2">
                              <div id={`result-heading-${exercise.id}`} className="sr-only">
                                {results[exercise.id].correct ? "Correct answer" : "Incorrect answer"}
                              </div>
                              {results[exercise.id].correct ? (
                                <Check className="h-5 w-5 text-green-600 mt-0.5" aria-hidden="true" />
                              ) : (
                                <X className="h-5 w-5 text-red-600 mt-0.5" aria-hidden="true" />
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
              </fieldset>

              <div className="pt-4 border-t">
                {!hasChecked ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Button type="submit" disabled={isChecking || !allAnswered} size="lg" aria-describedby="check-status">
                        {isChecking ? "Checking..." : "Check My Work"}
                      </Button>
                      {!allAnswered && (
                        <p className="text-sm text-muted-foreground mt-2" id="check-status" role="status">
                          Please answer all questions before checking.
                        </p>
                      )}
                    </div>

                    {state.currentSession?.isReviewMode && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          You&apos;re reviewing your previous answers. You can modify them and check again.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAnswers({});
                            setResults({});
                            setHasChecked(false);
                          }}
                          size="sm"
                          className="mt-2"
                          aria-label="Clear all answers and start over"
                        >
                          Clear All Answers
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4" role="region" aria-labelledby="exercise-complete">
                    {state.currentSession?.isReviewMode ? (
                      <>
                        <div className="text-lg font-semibold" id="exercise-complete">
                          Review Complete! Final Score: {correctAnswers}/{exercises.length} (
                          {Math.round((correctAnswers / exercises.length) * 100)}%)
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Review complete! You can practice again or go back to see your results.
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => {
                              setAnswers(state.currentSession?.previousAnswers || {});
                              setResults({});
                              setHasChecked(false);
                            }}
                            variant="outline"
                            size="lg"
                            aria-label="Try this exercise again"
                          >
                            Try Again
                          </Button>
                          <Button onClick={onComplete} size="lg" aria-label="Return to exercise results">
                            Back to Results
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold" id="exercise-complete">
                          Exercise Complete! Final Score: {correctAnswers}/{exercises.length} (
                          {Math.round((correctAnswers / exercises.length) * 100)}%)
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() => {
                              setAnswers(state.currentSession?.previousAnswers || {});
                              setResults({});
                              setHasChecked(false);
                            }}
                            variant="outline"
                            size="lg"
                            aria-label="Retry this exercise"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                            Try Again
                          </Button>

                          <Button
                            onClick={async () => {
                              setIsGeneratingNext(true);
                              // Generate new exercise and navigate to it
                              try {
                                await forceRegenerateExercise(exerciseType);
                                dispatch({ type: "START_SESSION", payload: { exerciseType } });
                                router.push(`/exercise/${exerciseType}`);
                              } catch (error) {
                                console.error("Failed to generate next exercise:", error);
                              } finally {
                                setIsGeneratingNext(false);
                              }
                            }}
                            size="lg"
                            disabled={isGeneratingNext}
                            aria-label={isGeneratingNext ? "Generating next exercise" : "Generate and start next exercise"}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                            {isGeneratingNext ? "Generating..." : "Next Exercise"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Generate New Questions section */}
        {!hasChecked && (
          <GenerateNewQuestionsCard
            onRegenerate={async (theme) => await forceRegenerateExercise(exerciseType, theme)}
            isGenerating={state.isGenerating}
          />
        )}
      </div>
    </>
  );
}
