"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import type { VerbAspectExercise, SentenceExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { getExerciseSourceInfo } from "@/lib/exercise-source-utils";
import { Check, X } from "lucide-react";
import { getExerciseDescription } from "@/lib/exercise-descriptions";
import { ExerciseInfoButton } from "@/components/ExerciseInfoButton";
import { ExerciseFooter } from "@/components/ExerciseFooter";
import { ReviewModeUI } from "@/components/ReviewModeUI";

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
  const {
    dispatch,
    state,
    markExerciseCompleted,
  } = useExercise();
  const [answers, setAnswers] = useState<Record<string | number, "perfective" | "imperfective">>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

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
      return <Check className="h-4 w-4 text-green-600 inline" />;
    }
    return <X className="h-4 w-4 text-red-600 inline" />;
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

  const renderVerbAspectQuestion = (exercise: VerbAspectExercise) => {
    const parts = exercise.text.split("_____");
    const result = results[exercise.id];
    const selectedValue = answers[exercise.id];
    const shuffledOptions = getShuffledOptions(exercise);

    return (
      <div className="space-y-4">
        <div className="text-sm sm:text-base lg:text-lg leading-relaxed mb-4">
          <span>{parts[0]}</span>
          <span className="font-semibold text-blue-600">_____</span>
          <span>{parts[1] || ""}</span>
        </div>

        <div
          className={`space-y-3 p-3 rounded-lg border-2 ${getRadioGroupStyling(result)} ${result ? "relative" : ""}`}
        >
          <RadioGroup
            value={selectedValue || ""}
            onValueChange={(value) => handleAnswerChange(exercise.id, value as "perfective" | "imperfective")}
            disabled={hasChecked}
            className="space-y-3"
          >
            {shuffledOptions.map((option) => (
              <div key={option.aspect} className="flex items-center space-x-2">
                <RadioGroupItem value={option.aspect} id={`${exercise.id}-${option.aspect.substring(0, 4)}`} />
                <Label
                  htmlFor={`${exercise.id}-${option.aspect.substring(0, 4)}`}
                  className="text-sm sm:text-base cursor-pointer flex-1"
                >
                  <span className="font-mono font-semibold">{option.text}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {result && <div className="absolute top-2 right-2">{getResultIcon(result)}</div>}
        </div>
      </div>
    );
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const filledAnswers = exercises.filter((ex) => answers[ex.id]).length;
  const progress = hasChecked ? 100 : (filledAnswers / exercises.length) * 100;
  const allAnswered = exercises.every((ex) => answers[ex.id]);

  // Get exercise source info for MVP static-first messaging
  const sourceInfo = getExerciseSourceInfo(exerciseSet.id, exerciseType);

  return (
    <>
      {/* Fixed progress bar at top of viewport */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="w-full h-1 rounded-none border-none bg-transparent" />
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 px-2 sm:px-4">
        {hasChecked && (
          <div className="flex justify-end">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {`Final Score: ${correctAnswers}/${exercises.length} (${Math.round(
                (correctAnswers / exercises.length) * 100
              )}%)`}
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
                      <div className="bg-muted/30 p-2 sm:p-4 rounded-lg">
                        {renderVerbAspectQuestion(exercise as VerbAspectExercise)}
                      </div>

                      {hasChecked && results[exercise.id] && (
                        <div className="mt-2 sm:mt-3 mb-4 border rounded-lg p-2 sm:p-3">
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
                      if (state.currentSession?.isReviewMode) {
                        // Convert aspect answers back to strings for session storage
                        const stringAnswers: Record<string, string> = {};
                        Object.entries(state.currentSession?.previousAnswers || {}).forEach(([key, value]) => {
                          stringAnswers[key] = value;
                        });
                        setAnswers(answers);
                        setResults({});
                        setHasChecked(false);
                      } else {
                        setAnswers({});
                        setResults({});
                        setHasChecked(false);
                      }
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
