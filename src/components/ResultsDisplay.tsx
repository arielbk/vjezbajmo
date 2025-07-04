"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExercise } from "@/contexts/ExerciseContext";
import { calculateScore } from "@/lib/exercise-utils";
import { RotateCcw, Target, TrendingUp, Award, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

interface ResultsDisplayProps {
  onRestart: () => void;
  onReviewMistakes: () => void;
  onNextExercise?: () => void;
}

export function ResultsDisplay({ onRestart, onReviewMistakes, onNextExercise }: ResultsDisplayProps) {
  const { state, markExerciseCompleted } = useExercise();

  if (!state.currentSession) {
    return null;
  }

  const { correct, total, percentage } = calculateScore(state.currentSession.results);
  const mistakes = state.currentSession.results.filter((r) => !r.correct);
  const diacriticWarnings = state.currentSession.results.filter((r) => r.correct && r.diacriticWarning);
  const hasMistakes = mistakes.length > 0;
  const hasDiacriticWarnings = diacriticWarnings.length > 0;
  const isGenerating = state.isGenerating;

  // Get the current exercise data to extract the exercise ID
  const getCurrentExerciseData = () => {
    switch (state.currentExerciseType) {
      case "verbTenses":
        return state.verbTensesParagraph;
      case "nounDeclension":
        return state.nounAdjectiveParagraph;
      case "verbAspect":
        return state.verbAspectExercises;
      case "interrogativePronouns":
        return state.interrogativePronounsExercises;
      default:
        return null;
    }
  };

  const handleNextExercise = async () => {
    // Automatically mark as completed and proceed to next exercise
    const exerciseData = getCurrentExerciseData();
    if (exerciseData && state.currentExerciseType) {
      markExerciseCompleted(
        exerciseData.id,
        state.currentExerciseType,
        undefined, // theme
        { correct, total }, // scoreData
        getExerciseTitle(state.currentExerciseType)
      );
    }

    if (onNextExercise) {
      await onNextExercise();
    }
  };

  const getExerciseTitle = (exerciseType: string) => {
    switch (exerciseType) {
      case "verbTenses":
        return "Verb Tenses in Text";
      case "nounDeclension":
        return "Noun & Adjective Declension";
      case "verbAspect":
        return "Verb Aspect";
      case "interrogativePronouns":
        return "Koji, koja, koje";
      default:
        return "Exercise";
    }
  };

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
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4" aria-hidden="true">
            {getScoreIcon(percentage)}
          </div>
          <CardTitle className="text-2xl" id="results-title">
            Exercise Complete!
          </CardTitle>
          <CardDescription id="results-description">
            {getScoreDescription(percentage)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div 
              className={`text-4xl font-bold ${getScoreColor(percentage)}`}
              aria-labelledby="score-label"
            >
              <span id="score-label" className="sr-only">
                Your score: {correct} correct out of {total} total questions
              </span>
              {correct}/{total}
            </div>
            <div className={`text-xl ${getScoreColor(percentage)}`}>
              {percentage}% Correct
            </div>
            <Progress 
              value={percentage} 
              className="w-full max-w-md mx-auto" 
              aria-label={`Progress: ${percentage} percent correct`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center" role="group" aria-labelledby="score-breakdown">
            <h3 id="score-breakdown" className="sr-only">Score Breakdown</h3>
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

          <div className="flex flex-col sm:flex-row gap-2 justify-center" role="group" aria-labelledby="action-buttons">
            <h3 id="action-buttons" className="sr-only">Action Buttons</h3>
            <Button 
              onClick={onRestart} 
              size="lg" 
              variant="outline" 
              disabled={isGenerating}
              aria-describedby="restart-description"
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
            <div id="restart-description" className="sr-only">
              Reset the exercise and try answering the questions again
            </div>

            {onNextExercise && (
              <>
                <Button 
                  onClick={handleNextExercise} 
                  size="lg" 
                  variant="default" 
                  disabled={isGenerating}
                  aria-describedby="next-description"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                      Next Exercise
                    </>
                  )}
                </Button>
                <div id="next-description" className="sr-only">
                  Generate and move to a new exercise of the same type
                </div>
              </>
            )}

            {hasMistakes && (
              <>
                <Button 
                  variant="outline" 
                  onClick={onReviewMistakes} 
                  size="lg" 
                  disabled={isGenerating}
                  aria-describedby="review-description"
                >
                  <Target className="h-4 w-4 mr-2" aria-hidden="true" />
                  Review Mistakes ({mistakes.length})
                </Button>
                <div id="review-description" className="sr-only">
                  Review the {mistakes.length} questions you answered incorrectly
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {mistakes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle id="mistakes-title">Review Your Mistakes</CardTitle>
            <CardDescription id="mistakes-description">
              Here are the questions you got wrong. Review them to improve your understanding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" role="list" aria-labelledby="mistakes-title">
              {mistakes.map((mistake, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50" role="listitem">
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
