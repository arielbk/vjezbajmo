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
import { getExerciseSourceInfo } from "@/lib/exercise-source-utils";
import { Check, X, RefreshCw, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { getExerciseDescription } from "@/lib/exercise-descriptions";
import { ExerciseInfoButton } from "@/components/ExerciseInfoButton";
import { toast } from "sonner";

interface ParagraphExerciseProps {
  exerciseSet: ParagraphExerciseSet;
  exerciseType: ExerciseType;
  onComplete: () => void;
  title: string;
}

export function ParagraphExercise({ exerciseSet, exerciseType, onComplete, title }: ParagraphExerciseProps) {
  const router = useRouter();
  const {
    dispatch,
    checkAnswer,
    forceRegenerateExercise,
    state,
    markExerciseCompleted,
    loadNextStaticWorksheet,
    hasRemainingStaticWorksheets,
  } = useExercise();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Reset component state when exercise set changes (new exercise loaded)
  useResetExerciseState(exerciseSet.id, setAnswers, setResults, setHasChecked, () => {});

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

      // Calculate correct answers from the new results
      const correctCount = Object.values(newResults).filter((r) => r.correct).length;

      // Show success toast with score
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      if (percentage === 100) {
        toast.success(`Perfect! All ${totalQuestions} answers correct! 🎉`);
      } else if (percentage >= 80) {
        toast.success(`Great job! ${correctCount}/${totalQuestions} correct (${percentage}%)`);
      } else {
        toast(`Exercise completed: ${correctCount}/${totalQuestions} correct (${percentage}%)`);
      }

      // Mark the exercise as completed when answers are checked
      markExerciseCompleted(
        exerciseSet.id,
        exerciseType,
        undefined,
        { correct: correctCount, total: totalQuestions },
        title
      );

      // Note: Completion now happens when checking answers, not when clicking next exercise
    } catch (error) {
      console.error("Error checking answers:", error);
      toast.error("Failed to check answers. Please try again.");
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
        <span key={question.id} className="inline-block mx-1 my-1">
          <Input
            ref={(el) => {
              if (el) inputRefs.current[question.id] = el;
            }}
            type="text"
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className={`inline-block min-w-24 sm:min-w-28 md:min-w-32 text-center text-base sm:text-lg h-10 sm:h-12 ${getInputStyling(
              results[question.id]
            )}`}
            style={{
              width: `${Math.max(120, (answers[question.id]?.length || question.baseForm?.length || 8) * 10 + 24)}px`,
            }}
            disabled={hasChecked}
          />
          {hasResult && <span className="ml-2 inline-flex items-center">{getResultIcon(results[question.id])}</span>}
          <span className="ml-2 text-xs sm:text-sm text-muted-foreground italic">
            ({question.baseForm}
            {question.isPlural ? " - plural" : ""})
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

    return <div className="text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose">{result}</div>;
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const totalQuestions = exerciseSet.questions.length;
  const filledAnswers = exerciseSet.questions.filter((q) => answers[q.id] && answers[q.id].trim() !== "").length;
  const progress = hasChecked ? (correctAnswers / totalQuestions) * 100 : (filledAnswers / totalQuestions) * 100;

  // Get exercise source info for MVP static-first messaging
  const sourceInfo = getExerciseSourceInfo(exerciseSet.id, exerciseType);

  return (
    <>
      {/* Fixed progress bar at top of viewport - nprogress style */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="w-full h-1 rounded-none border-none bg-transparent" />
      </div>

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pt-4 px-3 sm:px-4 lg:px-6">
        {hasChecked && (
          <div className="flex justify-end">
            <div className="text-sm sm:text-base text-muted-foreground font-medium">
              Score: {correctAnswers}/{totalQuestions} ({Math.round(progress)}%)
            </div>
          </div>
        )}

        <Card className="mx-0 sm:mx-auto shadow-lg sm:shadow-xl border-0 sm:border">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">{title}</CardTitle>
              <ExerciseInfoButton 
                exerciseId={exerciseSet.id} 
                exerciseType={exerciseType} 
                cefrLevel={state.cefrLevel}
                currentIndex={sourceInfo.currentIndex}
                totalCount={sourceInfo.totalCount}
              />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">{getExerciseDescription(exerciseType)}</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {!hasChecked ? (
              <form onSubmit={handleFormSubmit} className="space-y-6" data-testid="exercise-form">
                <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 rounded-lg">{renderParagraphWithInputs()}</div>

                <div className="text-center">
                  <Button
                    type="submit"
                    disabled={isChecking || Object.keys(answers).length === 0}
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px] h-12 text-base font-semibold"
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
                      size="lg"
                      className="mt-3 w-full sm:w-auto min-w-[160px] h-10"
                    >
                      Clear All Answers
                    </Button>
                  </div>
                )}
              </form>
            ) : (
              <>
                <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 rounded-lg">{renderParagraphWithInputs()}</div>

                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    {state.currentSession?.isReviewMode ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Review complete! You can practice again or go back to see your results.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            onClick={() => {
                              setAnswers(state.currentSession?.previousAnswers || {});
                              setResults({});
                              setHasChecked(false);
                            }}
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold"
                          >
                            Try Again
                          </Button>
                          <Button
                            onClick={onComplete}
                            size="lg"
                            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold"
                          >
                            Back to Results
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setAnswers(state.currentSession?.previousAnswers || {});
                            setResults({});
                            setHasChecked(false);
                          }}
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>

                        <Button
                          onClick={async () => {
                            setIsGeneratingNext(true);
                            try {
                              // First, check if there are remaining static worksheets
                              const hasMoreStatic = hasRemainingStaticWorksheets(exerciseType);

                              if (hasMoreStatic) {
                                // Load the next static worksheet
                                const success = loadNextStaticWorksheet(exerciseType);
                                if (success) {
                                  // Start new session and navigate to exercise
                                  dispatch({ type: "START_SESSION", payload: { exerciseType } });
                                  router.push(`/exercise/${exerciseType}`);
                                  return;
                                }
                              }

                              // If no static worksheets remain, generate a new exercise
                              await forceRegenerateExercise(exerciseType);
                              dispatch({ type: "START_SESSION", payload: { exerciseType } });
                              router.push(`/exercise/${exerciseType}`);
                            } catch (error) {
                              console.error("Failed to load next exercise:", error);
                              toast.error("Failed to generate new exercise. Please try again.");
                            } finally {
                              setIsGeneratingNext(false);
                            }
                          }}
                          size="lg"
                          disabled={isGeneratingNext}
                          className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold"
                        >
                          {isGeneratingNext ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Next Exercise
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg sm:text-xl">Explanations:</h3>
                    {exerciseSet.questions.map((question, index) => {
                      const result = results[question.id];
                      if (!result) return null;

                      return (
                        <div key={question.id} className="border rounded-lg p-3 sm:p-4 bg-card">
                          <div className="flex items-start gap-3">
                            <span className="font-semibold text-base flex-shrink-0 min-w-[2rem] sm:min-w-[2.5rem] bg-primary/10 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <span className="font-semibold text-base sm:text-lg">
                                  {question.baseForm}
                                  {question.isPlural ? " (plural)" : ""}
                                </span>
                                {!result.correct && (
                                  <div className="mt-1 text-sm sm:text-base">
                                    <div className="mb-1">
                                      Your answer:{" "}
                                      <span className="font-mono bg-red-50 px-2 py-1 rounded">{result.userAnswer}</span>
                                    </div>
                                    <div>
                                      Correct:{" "}
                                      <span className="font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
                                        {Array.isArray(result.correctAnswer)
                                          ? result.correctAnswer.join(" or ")
                                          : result.correctAnswer}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {result.correct && result.diacriticWarning && (
                                  <div className="mt-1 text-sm sm:text-base text-yellow-700 bg-yellow-50 p-2 rounded">
                                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                                    Correct! Remember diacritics:{" "}
                                    <span className="font-mono">{result.matchedAnswer}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {result.explanation}
                              </p>
                            </div>
                            {result.correct && result.diacriticWarning ? (
                              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600 flex-shrink-0" />
                            ) : result.correct ? (
                              <Check className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 flex-shrink-0" />
                            ) : (
                              <X className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 flex-shrink-0" />
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
      </div>
    </>
  );
}
