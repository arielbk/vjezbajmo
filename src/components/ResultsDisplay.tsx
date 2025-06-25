"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { calculateScore } from "@/lib/exercise-utils";
import { ArrowLeft, RotateCcw, Target, TrendingUp, Award, AlertTriangle } from "lucide-react";

interface ResultsDisplayProps {
  onBack: () => void;
  onRestart: () => void;
  onReviewMistakes: () => void;
}

export function ResultsDisplay({ onBack, onRestart, onReviewMistakes }: ResultsDisplayProps) {
  const { state } = useExercise();

  if (!state.currentSession) {
    return null;
  }

  const { correct, total, percentage } = calculateScore(state.currentSession.results);
  const mistakes = state.currentSession.results.filter((r) => !r.correct);
  const diacriticWarnings = state.currentSession.results.filter((r) => r.correct && r.diacriticWarning);
  const hasMistakes = mistakes.length > 0;
  const hasDiacriticWarnings = diacriticWarnings.length > 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreDescription = (percentage: number) => {
    if (percentage >= 90) return "Excellent work!";
    if (percentage >= 70) return "Good job!";
    if (percentage >= 50) return "Not bad, keep practicing!";
    return "Keep studying, you can do better!";
  };

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 90) return <Award className="h-8 w-8 text-green-600" />;
    if (percentage >= 70) return <TrendingUp className="h-8 w-8 text-blue-600" />;
    if (percentage >= 50) return <Target className="h-8 w-8 text-yellow-600" />;
    return <RotateCcw className="h-8 w-8 text-red-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getScoreIcon(percentage)}</div>
          <CardTitle className="text-2xl">Exercise Complete!</CardTitle>
          <CardDescription>{getScoreDescription(percentage)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
              {correct}/{total}
            </div>
            <div className={`text-xl ${getScoreColor(percentage)}`}>{percentage}% Correct</div>
            <Progress value={percentage} className="w-full max-w-md mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correct}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{mistakes.length}</div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onRestart} size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {hasMistakes && (
              <Button variant="outline" onClick={onReviewMistakes} size="lg">
                <Target className="h-4 w-4 mr-2" />
                Review Mistakes ({mistakes.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {mistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Mistakes</CardTitle>
            <CardDescription>
              Here are the questions you got wrong. Review them to improve your understanding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mistakes.map((mistake, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50">
                  <div className="space-y-2">
                    <div className="font-medium">Question {index + 1}</div>
                    <div className="text-sm">
                      <span className="text-gray-600">Your answer:</span>{" "}
                      <span className="font-mono bg-white px-2 py-1 rounded">{mistake.userAnswer || "(empty)"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Correct answer:</span>{" "}
                      <span className="font-mono bg-green-100 px-2 py-1 rounded text-green-800">
                        {Array.isArray(mistake.correctAnswer)
                          ? mistake.correctAnswer.join(" or ")
                          : mistake.correctAnswer}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 bg-white p-2 rounded">
                      <strong>Explanation:</strong> {mistake.explanation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasDiacriticWarnings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Diacritic Reminders
            </CardTitle>
            <CardDescription>
              These answers were correct, but remember to use the proper Croatian diacritics (č, ć, đ, š, ž).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diacriticWarnings.map((warning, index) => (
                <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="space-y-2">
                    <div className="font-medium">Question {index + 1}</div>
                    <div className="text-sm">
                      <span className="text-gray-600">Your answer:</span>{" "}
                      <span className="font-mono bg-white px-2 py-1 rounded">{warning.userAnswer}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">With proper diacritics:</span>{" "}
                      <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                        {warning.matchedAnswer}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 bg-white p-2 rounded">
                      <strong>Note:</strong> Your answer was correct! Just remember to use the proper Croatian letters
                      next time.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
