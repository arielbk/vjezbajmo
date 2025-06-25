"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { ParagraphExerciseSet, ExerciseType } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { ArrowLeft, Check, X, RefreshCw } from "lucide-react";

interface ParagraphExerciseProps {
  exerciseSet: ParagraphExerciseSet;
  exerciseType: ExerciseType;
  onComplete: () => void;
  onBack: () => void;
  title: string;
}

export function ParagraphExercise({ exerciseSet, exerciseType, onComplete, onBack, title }: ParagraphExerciseProps) {
  const { dispatch, checkAnswer, generateExercises, state } = useExercise();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [theme, setTheme] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

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
    await generateExercises(exerciseType, theme || undefined);
    setTheme("");
    // Reset all state for the new exercises
    setAnswers({});
    setResults({});
    setHasChecked(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const nextIndex = e.shiftKey
        ? Math.max(0, currentIndex - 1)
        : Math.min(exerciseSet.questions.length - 1, currentIndex + 1);

      const nextQuestion = exerciseSet.questions[nextIndex];
      if (nextQuestion && inputRefs.current[nextQuestion.id]) {
        inputRefs.current[nextQuestion.id].focus();
      }
    }
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
            const result = await checkAnswer(question.id, userAnswer);
            const exerciseResult = createExerciseResult(
              question.id,
              userAnswer,
              result.correctAnswer || question.correctAnswer,
              result.explanation
            );
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
    } catch (error) {
      console.error("Error checking answers:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const renderParagraphWithInputs = () => {
    const paragraphParts = exerciseSet.paragraph.split(/___\d+___/);
    const inputs: React.ReactElement[] = [];

    exerciseSet.questions.forEach((question, index) => {
      const isCorrect = results[question.id]?.correct;
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
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`inline-block w-32 text-center ${
              hasResult ? (isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") : ""
            }`}
            placeholder={`(${question.baseForm})`}
            disabled={hasChecked}
          />
          {hasResult && (
            <span className="ml-1">
              {isCorrect ? (
                <Check className="h-4 w-4 text-green-600 inline" />
              ) : (
                <X className="h-4 w-4 text-red-600 inline" />
              )}
            </span>
          )}
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

    return <div className="text-lg leading-relaxed">{result}</div>;
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const totalQuestions = exerciseSet.questions.length;
  const filledAnswers = exerciseSet.questions.filter((q) => answers[q.id] && answers[q.id].trim() !== "").length;
  const progress = hasChecked ? (correctAnswers / totalQuestions) * 100 : (filledAnswers / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        {hasChecked && (
          <div className="text-sm text-muted-foreground">
            Score: {correctAnswers}/{totalQuestions} ({Math.round(progress)}%)
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Optional theme..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-40"
                disabled={state.isGenerating}
              />
              <Button variant="outline" size="sm" onClick={handleRegenerateExercise} disabled={state.isGenerating}>
                <RefreshCw className={`h-4 w-4 ${state.isGenerating ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-lg">{renderParagraphWithInputs()}</div>

          {!hasChecked ? (
            <div className="text-center">
              <Button onClick={handleCheckAnswers} disabled={isChecking || Object.keys(answers).length === 0} size="lg">
                {isChecking ? "Checking..." : "Check My Work"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">Use Tab to navigate between fields</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <Button onClick={onComplete} size="lg">
                  Continue
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Explanations:</h3>
                {exerciseSet.questions.map((question, index) => {
                  const result = results[question.id];
                  if (!result) return null;

                  return (
                    <div key={question.id} className="border rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-sm">#{index + 1}</span>
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-medium">{question.baseForm}</span>
                            {!result.correct && (
                              <span className="ml-2 text-sm">
                                Your answer: <span className="font-mono">{result.userAnswer}</span>
                                {" → "}
                                Correct: <span className="font-mono text-green-600">{result.correctAnswer}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.explanation}</p>
                        </div>
                        {result.correct ? (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
