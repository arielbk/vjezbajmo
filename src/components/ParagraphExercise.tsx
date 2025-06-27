"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { useResetExerciseState } from "@/hooks/useResetExerciseState";
import { ParagraphExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { Check, X, RefreshCw, AlertTriangle, RotateCcw, ArrowRight, Target } from "lucide-react";

interface ParagraphExerciseProps {
  exerciseSet: ParagraphExerciseSet;
  exerciseType: ExerciseType;
  onComplete: () => void;
  title: string;
}

export function ParagraphExercise({ exerciseSet, exerciseType, onComplete, title }: ParagraphExerciseProps) {
  const router = useRouter();
  const { dispatch, checkAnswer, forceRegenerateExercise, state, markExerciseCompleted } = useExercise();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [theme, setTheme] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Reset component state when exercise set changes (new exercise loaded)
  useResetExerciseState(exerciseSet.id, setAnswers, setResults, setHasChecked, setTheme);

  // Initialize answers from previous session in review mode
  useEffect(() => {
    if (state.currentSession?.isReviewMode && state.currentSession?.previousAnswers) {
      setAnswers(state.currentSession.previousAnswers);
    }
  }, [state.currentSession]);

  // Auto-focus first input on mount
  useEffect(() => {
    const firstQuestion = exerciseSet.questions[0];
    if (firstQuestion && inputRefs.current[firstQuestion.id]) {
      inputRefs.current[firstQuestion.id].focus();
    }
  }, [exerciseSet]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleRegenerateExercise = async () => {
    await forceRegenerateExercise(exerciseType, theme || undefined);
    setTheme("");
    // Reset all state for the new exercises
    setAnswers({});
    setResults({});
    setHasChecked(false);
  };



  const handleCheckAnswers = async () => {
    setIsChecking(true);
    const newResults: Record<string, ReturnType<typeof createExerciseResult>> = {};

    try {
      for (const question of exerciseSet.questions) {
        const userAnswer = answers[question.id] || "";

        if (isStaticExercise(question.id)) {
          // Handle static exercise locally
          const result = createExerciseResult(question.id, userAnswer, question.correctAnswer, question.explanation);
          newResults[question.id] = result;
          dispatch({ type: "ADD_RESULT", payload: result });
        } else {
          // Handle generated exercise via API
          try {
            const apiResponse = await checkAnswer(question.id, userAnswer);
            const exerciseResult: ReturnType<typeof createExerciseResult> = {
              questionId: question.id,
              userAnswer,
              correct: apiResponse.correct,
              explanation: apiResponse.explanation,
              correctAnswer: apiResponse.correct ? undefined : apiResponse.correctAnswer,
              diacriticWarning: apiResponse.diacriticWarning,
              matchedAnswer: apiResponse.matchedAnswer,
            };
            newResults[question.id] = exerciseResult;
            dispatch({ type: "ADD_RESULT", payload: exerciseResult });
          } catch {
            // Fallback to local checking if API fails
            const result = createExerciseResult(question.id, userAnswer, question.correctAnswer, question.explanation);
            newResults[question.id] = result;
            dispatch({ type: "ADD_RESULT", payload: result });
          }
        }
      }

      setResults(newResults);
      setHasChecked(true);

      // Note: Completion is now manual - user decides when to mark as completed
    } catch (error) {
      console.error("Error checking answers:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChecked && Object.keys(answers).length > 0) {
      handleCheckAnswers();
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

  const renderParagraphWithInputs = () => {
    // Remove the bracketed base forms from the paragraph since we show them after the inputs
    const cleanParagraph = exerciseSet.paragraph.replace(/\s*\([^)]+\)/g, "");
    const paragraphParts = cleanParagraph.split(/___\d+___/);
    const inputs: React.ReactElement[] = [];

    exerciseSet.questions.forEach((question) => {
      const hasResult = hasChecked && results[question.id];

      inputs.push(
        <span key={question.id} className="inline-block mx-1">
          <Input
            ref={(el) => {
              if (el) inputRefs.current[question.id] = el;
            }}
            type="text"
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`inline-block w-20 sm:w-28 lg:w-32 text-center ${getInputStyling(results[question.id])}`}
            disabled={hasChecked}
          />
          {hasResult && <span className="ml-1">{getResultIcon(results[question.id])}</span>}
          <span className="ml-1 text-xs text-muted-foreground italic">
            ({question.baseForm}{question.isPlural ? " - plural" : ""})
          </span>
        </span>
      );
    });

    const result: React.ReactElement[] = [];
    for (let i = 0; i < paragraphParts.length; i++) {
      result.push(<span key={`text-${i}`}>{paragraphParts[i]}</span>);
      if (inputs[i]) {
        result.push(inputs[i]);
      }
    }

    return <div className="text-sm sm:text-base lg:text-lg leading-relaxed">{result}</div>;
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const incorrectAnswers = Object.values(results).filter((r) => !r.correct);
  const totalQuestions = exerciseSet.questions.length;
  const filledAnswers = exerciseSet.questions.filter((q) => answers[q.id] && answers[q.id].trim() !== "").length;
  const progress = hasChecked ? (correctAnswers / totalQuestions) * 100 : (filledAnswers / totalQuestions) * 100;

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
              Score: {correctAnswers}/{totalQuestions} ({Math.round(progress)}%)
            </div>
          </div>
        )}

        <Card className="mx-0 sm:mx-auto">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-6 px-3 sm:px-6">
            {!hasChecked ? (
              <form onSubmit={handleFormSubmit} className="space-y-4" data-testid="exercise-form">
                <div className="bg-muted/30 p-3 sm:p-6 rounded-lg">{renderParagraphWithInputs()}</div>
                
                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={isChecking || Object.keys(answers).length === 0}
                    size="lg"
                  >
                    {isChecking ? "Checking..." : "Check My Work"}
                  </Button>
                </div>

                {state.currentSession?.isReviewMode && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      You&apos;re reviewing your previous answers. You can modify them and check again.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAnswers({});
                        setResults({});
                        setHasChecked(false);
                      }}
                      size="sm"
                      className="mt-2"
                    >
                      Clear All Answers
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <>
                <div className="bg-muted/30 p-3 sm:p-6 rounded-lg">{renderParagraphWithInputs()}</div>
                
                <div className="space-y-4">
                <div className="text-center space-y-2">
                  {state.currentSession?.isReviewMode ? (
                    <>
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
                        >
                          Try Again
                        </Button>
                        <Button onClick={onComplete} size="lg">
                          Back to Results
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        onClick={() => {
                          setAnswers(state.currentSession?.previousAnswers || {});
                          setResults({});
                          setHasChecked(false);
                        }}
                        variant="outline"
                        size="lg"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          // Mark exercise as completed with score data
                          markExerciseCompleted(
                            exerciseSet.id,
                            exerciseType,
                            theme || undefined,
                            { correct: correctAnswers, total: totalQuestions },
                            title
                          );
                          // Generate new exercise and navigate to it
                          try {
                            await forceRegenerateExercise(exerciseType);
                            dispatch({ type: "START_SESSION", payload: { exerciseType } });
                            router.push(`/exercise/${exerciseType}`);
                          } catch (error) {
                            console.error("Failed to generate next exercise:", error);
                          }
                        }}
                        size="lg"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Next Exercise
                      </Button>

                      {incorrectAnswers.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Mark exercise as completed first
                            markExerciseCompleted(
                              exerciseSet.id,
                              exerciseType,
                              theme || undefined,
                              { correct: correctAnswers, total: totalQuestions },
                              title
                            );
                            // Navigate to review mode with current answers
                            const answersParam = encodeURIComponent(JSON.stringify(answers));
                            router.push(`/exercise/${exerciseType}?review=true&answers=${answersParam}`);
                          }}
                          size="lg"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Review Mistakes ({incorrectAnswers.length})
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Explanations:</h3>
                  {exerciseSet.questions.map((question, index) => {
                    const result = results[question.id];
                    if (!result) return null;

                    return (
                      <div key={question.id} className="border rounded-lg p-2 sm:p-3">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-sm flex-shrink-0 min-w-[1.5rem] sm:min-w-[2rem]">
                            #{index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <span className="font-medium">{question.baseForm}{question.isPlural ? " (plural)" : ""}</span>
                              {!result.correct && (
                                <span className="ml-2 text-sm">
                                  Your answer: <span className="font-mono">{result.userAnswer}</span>
                                  {" → "}
                                  Correct:{" "}
                                  <span className="font-mono text-green-600">
                                    {Array.isArray(result.correctAnswer)
                                      ? result.correctAnswer.join(" or ")
                                      : result.correctAnswer}
                                  </span>
                                </span>
                              )}
                              {result.correct && result.diacriticWarning && (
                                <span className="ml-2 text-sm text-yellow-700">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  Correct! Remember diacritics:{" "}
                                  <span className="font-mono">{result.matchedAnswer}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{result.explanation}</p>
                          </div>
                          {result.correct && result.diacriticWarning ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : result.correct ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Separate Generate New Exercise section */}
        {!hasChecked && (
          <Card>
            <CardContent>
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Want a different exercise?</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2">
                  <Input
                    type="text"
                    placeholder="Optional theme..."
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full sm:w-40"
                    disabled={state.isGenerating}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateExercise}
                    disabled={state.isGenerating}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${state.isGenerating ? "animate-spin" : ""}`} />
                    Generate New Exercise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
