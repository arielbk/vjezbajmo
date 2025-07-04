"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import type { VerbAspectExercise, SentenceExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { Check, X, RotateCcw, ArrowRight } from "lucide-react";
import { getExerciseDescription } from "@/lib/exercise-descriptions";
import { GenerateNewQuestionsCard } from "@/components/GenerateNewQuestionsCard";

interface VerbAspectExerciseSetProps {
  exerciseSet: SentenceExerciseSet & {
    exercises: VerbAspectExercise[];
  };
  exerciseType: ExerciseType;
  onComplete: () => void;
  title: string;
}

export function VerbAspectExerciseComponent({
  exerciseSet,
  exerciseType,
  onComplete,
  title,
}: VerbAspectExerciseSetProps) {
  const router = useRouter();
  const { dispatch, forceRegenerateExercise, state, markExerciseCompleted } = useExercise();
  const [answers, setAnswers] = useState<Record<string | number, "perfective" | "imperfective">>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  // Extract exercises from the set
  const exercises = exerciseSet.exercises;

  // Reset component state when exercise set changes (new exercise loaded)
  useEffect(() => {
    setAnswers({});
    setResults({});
    setHasChecked(false);
  }, [exerciseSet.id]);

  // Initialize answers from previous session in review mode
  useEffect(() => {
    if (state.currentSession?.isReviewMode && state.currentSession?.previousAnswers) {
      // Convert string answers back to aspect answers
      const aspectAnswers: Record<string | number, "perfective" | "imperfective"> = {};
      Object.entries(state.currentSession.previousAnswers).forEach(([key, value]) => {
        aspectAnswers[key] = value as "perfective" | "imperfective";
      });
      setAnswers(aspectAnswers);
    }
  }, [state.currentSession]);

  const handleAnswerChange = (questionId: string | number, value: "perfective" | "imperfective") => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckAllAnswers = async () => {
    setIsChecking(true);
    const newResults: Record<string | number, ReturnType<typeof createExerciseResult>> = {};

    try {
      for (const exercise of exercises) {
        const userAnswer = answers[exercise.id];
        const isCorrect = userAnswer === exercise.correctAspect;

        // For verb aspect exercises, we check against the correctAspect
        const correctAnswerText = exercise.options[exercise.correctAspect];
        const userAnswerText = userAnswer ? exercise.options[userAnswer] : "";

        if (isStaticExercise(exercise.id)) {
          // Handle static exercise locally
          const result = createExerciseResult(exercise.id, userAnswerText, correctAnswerText, exercise.explanation);
          // Override the correct flag since createExerciseResult doesn't know about our custom logic
          result.correct = isCorrect;
          newResults[exercise.id] = result;
          dispatch({ type: "ADD_RESULT", payload: result });
        } else {
          // Handle generated exercise via API - for verb aspect we'll check locally for now
          // since the API doesn't understand our radio button format yet
          const result = createExerciseResult(exercise.id, userAnswerText, correctAnswerText, exercise.explanation);
          // Override the correct flag since createExerciseResult doesn't know about our custom logic
          result.correct = isCorrect;
          newResults[exercise.id] = result;
          dispatch({ type: "ADD_RESULT", payload: result });
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

  const getRadioGroupStyling = (result: ReturnType<typeof createExerciseResult> | undefined) => {
    if (!result) return "";
    if (result.correct) {
      return "border-green-500 bg-green-50";
    }
    return "border-red-500 bg-red-50";
  };

  const getResultIcon = (result: ReturnType<typeof createExerciseResult> | undefined) => {
    if (!result) return null;
    if (result.correct) {
      return <Check className="h-4 w-4 text-green-600 inline" aria-label="Correct answer" />;
    }
    return <X className="h-4 w-4 text-red-600 inline" aria-label="Incorrect answer" />;
  };

  // Function to create shuffled options for each exercise consistently
  const getShuffledOptions = (exercise: VerbAspectExercise) => {
    // Use the exercise ID as a seed for consistent shuffling per exercise
    const seed = typeof exercise.id === "string" ? exercise.id.charCodeAt(0) : exercise.id;
    const shouldReverse = seed % 2 === 0;

    const options = [
      { aspect: "imperfective", text: exercise.options?.imperfective || "Loading..." },
      { aspect: "perfective", text: exercise.options?.perfective || "Loading..." },
    ];

    return shouldReverse ? options.reverse() : options;
  };

  const renderVerbAspectQuestion = (exercise: VerbAspectExercise, index: number) => {
    const parts = exercise.text.split("_____");
    const result = results[exercise.id];
    const selectedValue = answers[exercise.id];
    const shuffledOptions = getShuffledOptions(exercise);
    const fieldsetId = `fieldset-${exercise.id}`;

    return (
      <div className="space-y-4">
        <div className="text-sm sm:text-base lg:text-lg leading-relaxed mb-4">
          <span>{parts[0]}</span>
          <span className="font-semibold text-blue-600" aria-label="blank to fill">_____</span>
          <span>{parts[1] || ""}</span>
        </div>

        <fieldset
          id={fieldsetId}
          className={`space-y-3 p-3 rounded-lg border-2 ${getRadioGroupStyling(result)} ${result ? "relative" : ""}`}
          aria-labelledby={`legend-${exercise.id}`}
          aria-describedby={result ? `result-description-${exercise.id}` : undefined}
        >
          <legend id={`legend-${exercise.id}`} className="sr-only">
            Question {index + 1}: Choose the correct verb aspect for this sentence
          </legend>
          
          <RadioGroup
            value={selectedValue || ""}
            onValueChange={(value) => handleAnswerChange(exercise.id, value as "perfective" | "imperfective")}
            disabled={hasChecked}
            className="space-y-3"
            aria-labelledby={`legend-${exercise.id}`}
          >
            {shuffledOptions.map((option) => {
              const optionId = `${exercise.id}-${option.aspect.substring(0, 4)}`;
              return (
                <div key={option.aspect} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.aspect} 
                    id={optionId} 
                    aria-describedby={`option-description-${optionId}`}
                  />
                  <Label
                    htmlFor={optionId}
                    className="text-sm sm:text-base cursor-pointer flex-1"
                  >
                    <span className="font-mono font-semibold">{option.text}</span>
                  </Label>
                  <div id={`option-description-${optionId}`} className="sr-only">
                    {option.aspect === "perfective" ? "Perfective aspect - completed action" : "Imperfective aspect - ongoing or repeated action"}
                  </div>
                </div>
              );
            })}
          </RadioGroup>
          
          {result && (
            <>
              <div className="absolute top-2 right-2" aria-hidden="true">
                {getResultIcon(result)}
              </div>
              <div id={`result-description-${exercise.id}`} className="sr-only">
                {result.correct ? "Correct answer" : `Incorrect. The correct answer is ${exercise.correctAspect}`}
              </div>
            </>
          )}
        </fieldset>
      </div>
    );
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const filledAnswers = exercises.filter((ex) => answers[ex.id]).length;
  const progress = hasChecked ? 100 : (filledAnswers / exercises.length) * 100;
  const allAnswered = exercises.every((ex) => answers[ex.id]);

  return (
    <>
      {/* Fixed progress bar at top of viewport */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="w-full h-1 rounded-none border-none bg-transparent" aria-label={`Exercise progress: ${Math.round(progress)}% complete`} />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 px-2 sm:px-4">
        {hasChecked && (
          <div className="flex justify-end" role="status" aria-live="polite">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {`Final Score: ${correctAnswers}/${exercises.length} (${Math.round(
                (correctAnswers / exercises.length) * 100
              )}%)`}
            </div>
          </div>
        )}

        <Card className="mx-0 sm:mx-auto">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{getExerciseDescription(exerciseType)}</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-8 px-3 sm:px-6">
            <form onSubmit={handleFormSubmit} role="form" aria-label="Verb aspect exercise">
              <div role="group" aria-label="Exercise questions">
                {exercises.map((exercise, index) => (
                  <div key={exercise.id} className="space-y-2 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-sm font-medium text-muted-foreground mt-1 min-w-[1.2rem] sm:min-w-[2rem] flex-shrink-0" aria-label={`Question ${index + 1}`}>
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted/30 p-2 sm:p-4 rounded-lg">
                          {renderVerbAspectQuestion(exercise as VerbAspectExercise, index)}
                        </div>

                      {hasChecked && results[exercise.id] && (
                        <div className="mt-2 sm:mt-3 mb-4 border rounded-lg p-2 sm:p-3" role="region" aria-labelledby={`result-${exercise.id}`}>
                          <div className="flex items-start gap-2">
                            {results[exercise.id].correct ? (
                              <Check className="h-5 w-5 text-green-600 mt-0.5" aria-label="Correct answer" />
                            ) : (
                              <X className="h-5 w-5 text-red-600 mt-0.5" aria-label="Incorrect answer" />
                            )}
                            <div className="flex-1">
                              <div id={`result-${exercise.id}`} className="sr-only">
                                {results[exercise.id].correct ? "Correct answer" : "Incorrect answer"}
                              </div>
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
              </div>

              <div className="pt-4 border-t">
                {!hasChecked ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Button type="submit" disabled={isChecking || !allAnswered} size="lg" aria-describedby="submit-instructions">
                        {isChecking ? "Checking..." : "Check My Work"}
                      </Button>
                      {!allAnswered && (
                        <p id="submit-instructions" className="text-sm text-muted-foreground mt-2" role="status">
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
                  <div className="text-center space-y-4" role="status" aria-live="polite">
                    {state.currentSession?.isReviewMode ? (
                      <>
                        <div className="text-lg font-semibold">
                          Review Complete! Final Score: {correctAnswers}/{exercises.length} (
                          {Math.round((correctAnswers / exercises.length) * 100)}%)
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Review complete! You can practice again or go back to see your results.
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => {
                              // Convert aspect answers back to strings for session storage
                              const stringAnswers: Record<string, string> = {};
                              Object.entries(state.currentSession?.previousAnswers || {}).forEach(([key, value]) => {
                                stringAnswers[key] = value;
                              });
                              setAnswers(answers);
                              setResults({});
                              setHasChecked(false);
                            }}
                            variant="outline"
                            size="lg"
                            aria-label="Try the exercise again with new attempt"
                          >
                            Try Again
                          </Button>
                          <Button onClick={onComplete} size="lg" aria-label="Return to results page">
                            Back to Results
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold" aria-label={`Exercise completed with score ${correctAnswers} out of ${exercises.length}, ${Math.round((correctAnswers / exercises.length) * 100)} percent`}>
                          Exercise Complete! Final Score: {correctAnswers}/{exercises.length} (
                          {Math.round((correctAnswers / exercises.length) * 100)}%)
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() => {
                              setAnswers({});
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
                            aria-label={isGeneratingNext ? "Generating new exercise, please wait" : "Generate and start next exercise"}
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
