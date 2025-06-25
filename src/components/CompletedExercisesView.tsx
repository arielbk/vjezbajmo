"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { userProgressManager } from "@/lib/user-progress";
import { ArrowLeft, Clock, Target, TrendingUp, Trash2 } from "lucide-react";
import { ExerciseType, CefrLevel } from "@/types/exercise";

interface CompletedExercise {
  id: string;
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  theme?: string;
  completedAt: number;
}

interface CompletedExercisesViewProps {
  onBack: () => void;
}

export function CompletedExercisesView({ onBack }: CompletedExercisesViewProps) {
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  useEffect(() => {
    // Get all completed exercises from localStorage
    const allProgress = userProgressManager.getAllProgress();
    const exercises: CompletedExercise[] = [];

    Object.entries(allProgress).forEach(([key, progress]) => {
      // Parse the key: "vjezbajmo-progress:exerciseType:cefrLevel:theme"
      const keyParts = key.replace('vjezbajmo-progress:', '').split(':');
      if (keyParts.length >= 2) {
        const [exerciseType, cefrLevel, theme] = keyParts;
        
        progress.completedExercises.forEach(exerciseId => {
          exercises.push({
            id: exerciseId,
            exerciseType: exerciseType as ExerciseType,
            cefrLevel: cefrLevel as CefrLevel,
            theme: theme && theme !== 'default' ? theme : undefined,
            completedAt: progress.lastUpdated
          });
        });
      }
    });

    // Sort by completion date (newest first)
    exercises.sort((a, b) => b.completedAt - a.completedAt);
    setCompletedExercises(exercises);
  }, []);

  const getExerciseTypeLabel = (type: ExerciseType) => {
    switch (type) {
      case "verbTenses":
        return "Verb Tenses";
      case "nounDeclension":
        return "Noun & Adjective Declension";
      case "verbAspect":
        return "Verb Aspect";
      case "interrogativePronouns":
        return "Interrogative Pronouns";
      default:
        return type;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearProgress = (exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string) => {
    userProgressManager.clearCompletedExercises(exerciseType, cefrLevel, theme);
    // Refresh the list
    const allProgress = userProgressManager.getAllProgress();
    const exercises: CompletedExercise[] = [];

    Object.entries(allProgress).forEach(([key, progress]) => {
      const keyParts = key.replace('vjezbajmo-progress:', '').split(':');
      if (keyParts.length >= 2) {
        const [exerciseType, cefrLevel, theme] = keyParts;
        
        progress.completedExercises.forEach(exerciseId => {
          exercises.push({
            id: exerciseId,
            exerciseType: exerciseType as ExerciseType,
            cefrLevel: cefrLevel as CefrLevel,
            theme: theme && theme !== 'default' ? theme : undefined,
            completedAt: progress.lastUpdated
          });
        });
      }
    });

    exercises.sort((a, b) => b.completedAt - a.completedAt);
    setCompletedExercises(exercises);
  };

  const getProgressStats = () => {
    const typeGroups: Record<string, number> = {};
    completedExercises.forEach(exercise => {
      const key = `${exercise.exerciseType}-${exercise.cefrLevel}`;
      typeGroups[key] = (typeGroups[key] || 0) + 1;
    });

    return typeGroups;
  };

  const progressStats = getProgressStats();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Selection
        </Button>
        <h2 className="text-2xl font-bold">Completed Exercises</h2>
        <div></div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Summary
          </CardTitle>
          <CardDescription>
            Your learning progress across different exercise types and levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(progressStats).map(([key, count]) => {
              const [exerciseType, cefrLevel] = key.split('-');
              return (
                <div key={key} className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-700">
                    {getExerciseTypeLabel(exerciseType as ExerciseType)}
                  </div>
                  <div className="text-sm text-blue-600">{cefrLevel}</div>
                  <div className="text-2xl font-bold text-blue-800">{count}</div>
                  <div className="text-xs text-blue-600">completed</div>
                </div>
              );
            })}
          </div>
          {completedExercises.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No completed exercises yet. Start practicing to track your progress!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Exercises List */}
      {completedExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exercise History
            </CardTitle>
            <CardDescription>
              Chronological list of your completed exercises
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedExercises.map((exercise, index) => (
                <div 
                  key={`${exercise.exerciseType}-${exercise.cefrLevel}-${exercise.theme || 'default'}-${index}`}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {getExerciseTypeLabel(exercise.exerciseType)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Level: {exercise.cefrLevel}
                      {exercise.theme && ` • Theme: ${exercise.theme}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Completed: {formatDate(exercise.completedAt)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearProgress(exercise.exerciseType, exercise.cefrLevel, exercise.theme)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
