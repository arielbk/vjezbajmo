"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import type { SentenceExercise } from "@/types/exercise";
import { createExerciseResult, isStaticExercise } from "@/lib/exercise-utils";
import { ArrowLeft, Check, X, ChevronRight } from "lucide-react";

interface SentenceExerciseProps {
  exercises: SentenceExercise[];
  onComplete: () => void;
  onBack: () => void;
  title: string;
}

export function SentenceExercise({ exercises, onComplete, onBack, title }: SentenceExerciseProps) {
  const { dispatch, checkAnswer } = useExercise();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [results, setResults] = useState<Record<string | number, ReturnType<typeof createExerciseResult>>>({});
  const [isChecking, setIsChecking] = useState(false);

  const currentExercise = exercises[currentIndex];
  const hasAnswered = currentExercise && answers[currentExercise.id] !== undefined;
  const hasResult = currentExercise && results[currentExercise.id] !== undefined;
  const isLastExercise = currentIndex === exercises.length - 1;
  const allCompleted = exercises.every((ex) => results[ex.id] !== undefined);

  const handleAnswerChange = (value: string) => {
    if (currentExercise) {
      setAnswers((prev) => ({ ...prev, [currentExercise.id]: value }));
    }
  };

  const handleCheckAnswer = async () => {
    if (!currentExercise || !hasAnswered) return;

    setIsChecking(true);
    const userAnswer = answers[currentExercise.id];

    try {
      if (isStaticExercise(currentExercise.id)) {
        // Handle static exercise locally
        const result = createExerciseResult(
          currentExercise.id,
          userAnswer,
          currentExercise.correctAnswer,
          currentExercise.explanation
        );
        setResults((prev) => ({ ...prev, [currentExercise.id]: result }));
        dispatch({ type: "ADD_RESULT", payload: result });
      } else {
        // Handle generated exercise via API
        try {
          const result = await checkAnswer(currentExercise.id as string, userAnswer);
          const exerciseResult = createExerciseResult(
            currentExercise.id,
            userAnswer,
            result.correctAnswer || currentExercise.correctAnswer,
            result.explanation
          );
          setResults((prev) => ({ ...prev, [currentExercise.id]: exerciseResult }));
          dispatch({ type: "ADD_RESULT", payload: exerciseResult });
        } catch {
          // Fallback to local checking if API fails
          const result = createExerciseResult(
            currentExercise.id,
            userAnswer,
            currentExercise.correctAnswer,
            currentExercise.explanation
          );
          setResults((prev) => ({ ...prev, [currentExercise.id]: result }));
          dispatch({ type: "ADD_RESULT", payload: result });
        }
      }
    } catch (error) {
      console.error("Error checking answer:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const renderSentenceWithInput = (exercise: SentenceExercise) => {
    const parts = exercise.text.split("_____");
    const result = results[exercise.id];
    const userAnswer = answers[exercise.id] || "";

    return (
      <div className="text-lg leading-relaxed">
        <span>{parts[0]}</span>
        <span className="inline-block mx-1">
          <Input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !hasResult && handleCheckAnswer()}
            className={`inline-block w-40 text-center ${
              result ? (result.correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") : ""
            }`}
            placeholder="Your answer"
            disabled={hasResult}
          />
          {result && (
            <span className="ml-1">
              {result.correct ? (
                <Check className="h-4 w-4 text-green-600 inline" />
              ) : (
                <X className="h-4 w-4 text-red-600 inline" />
              )}
            </span>
          )}
        </span>
        <span>{parts[1] || ""}</span>
      </div>
    );
  };

  const correctAnswers = Object.values(results).filter((r) => r.correct).length;
  const totalAnswered = Object.keys(results).length;
  const progress = (totalAnswered / exercises.length) * 100;

  if (!currentExercise) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {exercises.length}
          {totalAnswered > 0 && (
            <span className="ml-2">
              Score: {correctAnswers}/{totalAnswered}
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-lg">{renderSentenceWithInput(currentExercise)}</div>

          {!hasResult ? (
            <div className="text-center">
              <Button onClick={handleCheckAnswer} disabled={isChecking || !hasAnswered} size="lg">
                {isChecking ? "Checking..." : "Check Answer"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  {results[currentExercise.id].correct ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {!results[currentExercise.id].correct && (
                      <div className="mb-2 text-sm">
                        Your answer: <span className="font-mono">{results[currentExercise.id].userAnswer}</span>
                        {" → "}
                        Correct:{" "}
                        <span className="font-mono text-green-600">{results[currentExercise.id].correctAnswer}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{results[currentExercise.id].explanation}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
                  Previous
                </Button>

                {isLastExercise ? (
                  <Button onClick={onComplete}>Complete Exercise</Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {allCompleted && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Exercise Complete!</h3>
              <p className="text-muted-foreground mb-4">
                Final Score: {correctAnswers}/{exercises.length} (
                {Math.round((correctAnswers / exercises.length) * 100)}%)
              </p>
              <Button onClick={onComplete} size="lg">
                Finish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
