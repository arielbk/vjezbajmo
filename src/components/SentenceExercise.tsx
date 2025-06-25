"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import type { SentenceExercise, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { ArrowLeft, Check, X, RefreshCw, AlertTriangle } from "lucide-react";

interface SentenceExerciseProps {
  exercises: SentenceExercise[];
  exerciseType: ExerciseType;
  onComplete: () => void;
  onBack: () => void;
  title: string;
}

export function SentenceExercise({ exercises, exerciseType, onComplete, onBack, title }: SentenceExerciseProps) {
  const { dispatch, checkAnswer, generateExercises, state } = useExercise();
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [theme, setTheme] = useState("");

  const handleAnswerChange = (questionId: string | number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleRegenerateExercise = async () => {
    await generateExercises(exerciseType, theme || undefined);
    setTheme("");
    // Reset all state for the new exercises
    setAnswers({});
    setResults({});
    setHasChecked(false);
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
    } catch (error) {
      console.error("Error checking answers:", error);
    } finally {
      setIsChecking(false);
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
      <div className="text-base sm:text-lg leading-relaxed">
        <span>{parts[0]}</span>
        <span className="inline-block mx-1">
          <Input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
            className={`inline-block w-32 sm:w-40 text-center ${getInputStyling(result)}`}
            placeholder="Your answer"
            disabled={hasChecked}
          />
          {result && <span className="ml-1">{getResultIcon(result)}</span>}
        </span>
        <span>{parts[1] || ""}</span>
        {result && result.correct && result.diacriticWarning && (
          <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
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
  const allAnswered = exercises.every((ex) => answers[ex.id] && answers[ex.id].trim() !== "");

  return (
    <>
      {/* Fixed progress bar at top of viewport - nprogress style */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="w-full h-1 rounded-none border-none bg-transparent" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Selection
          </Button>
          {hasChecked && (
            <div className="text-sm text-muted-foreground">
              Final Score: {correctAnswers}/{exercises.length} ({Math.round((correctAnswers / exercises.length) * 100)}%)
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-sm font-medium text-muted-foreground mt-1 min-w-[1.5rem] sm:min-w-[2rem] flex-shrink-0">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">{renderSentenceWithInput(exercise)}</div>

                  {hasChecked && results[exercise.id] && (
                    <div className="mt-3 border rounded-lg p-3">
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
              <div className="text-center">
                <Button onClick={handleCheckAllAnswers} disabled={isChecking || !allAnswered} size="lg">
                  {isChecking ? "Checking..." : "Check My Work"}
                </Button>
                {!allAnswered && (
                  <p className="text-sm text-muted-foreground mt-2">Please answer all questions before checking.</p>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold">
                  Exercise Complete! Final Score: {correctAnswers}/{exercises.length} (
                  {Math.round((correctAnswers / exercises.length) * 100)}%)
                </div>
                <Button onClick={onComplete} size="lg">
                  Finish Exercise
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Separate Generate New Questions section */}
      {!hasChecked && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Want different questions?</p>
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
                  Generate New Questions
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
