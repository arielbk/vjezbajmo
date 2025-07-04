"use client";

import React, { useState } from "react";
import { ExerciseType, CefrLevel } from "@/types/exercise";
import { userProgressManager } from "@/lib/user-progress";
import { getStaticWorksheetProgress, getStaticWorksheets } from "@/lib/static-worksheets";
import { getExerciseSourceInfo } from "@/lib/exercise-source-utils";
import { useExercise } from "@/contexts/ExerciseContext";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  Star,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";

interface ExerciseInfoModalProps {
  exerciseId: string;
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  children: React.ReactNode; // The trigger element
}

export function ExerciseInfoModal({
  exerciseId,
  exerciseType,
  cefrLevel,
  children,
}: ExerciseInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("");
  const { forceRegenerateExercise, state, loadSpecificStaticWorksheet } = useExercise();
  const router = useRouter();

  // Get exercise source info
  const sourceInfo = getExerciseSourceInfo(exerciseId, exerciseType);

  // Get static worksheet progress
  const staticProgress = getStaticWorksheetProgress(exerciseType, cefrLevel);

  // Get all static worksheets for this exercise type
  const allStaticWorksheets = getStaticWorksheets(exerciseType).filter(w => w.cefrLevel === cefrLevel);
  
  // Get performance map for all exercises in this category
  const categoryPerformanceMap = userProgressManager.getCategoryPerformanceMap(
    exerciseType, 
    cefrLevel
  );
  
  // Get exercise summary with scores
  const exerciseSummary = allStaticWorksheets.map(worksheet => {
    const performance = categoryPerformanceMap.get(worksheet.id) || {
      bestScore: null,
      attempts: 0,
      isCompleted: false
    };
    
    return {
      id: worksheet.id,
      title: worksheet.title || `Exercise ${worksheet.id.split('-').pop()}`,
      bestScore: performance.bestScore,
      isCompleted: performance.isCompleted,
      isCurrent: worksheet.id === exerciseId,
      attempts: performance.attempts
    };
  });

  const handleRegenerateExercise = async () => {
    try {
      await forceRegenerateExercise(exerciseType, theme || undefined);
      setTheme("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate exercise:", error);
    }
  };

  const handleNavigateToExercise = async (targetExerciseId: string) => {
    try {
      // Load the specific worksheet
      const success = loadSpecificStaticWorksheet(targetExerciseId, exerciseType);
      if (!success) {
        console.error("Failed to load worksheet:", targetExerciseId);
        return;
      }

      setIsOpen(false);
      
      // Navigate to the exercise page 
      router.push(`/exercise/${exerciseType}`);
    } catch (error) {
      console.error("Failed to navigate to exercise:", error);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sourceInfo.isStatic ? (
              <>
                <BookOpen className="h-5 w-5" />
                Static Exercise Details
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generated Exercise Details
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            View your progress and performance for this {exerciseType.replace(/([A-Z])/g, ' $1').toLowerCase()} exercise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exercises Section */}
          {exerciseSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Static {exerciseType.replace(/([A-Z])/g, ' $1')} Exercises
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{cefrLevel}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{staticProgress.progressText}</span>
                      <div className="w-12 bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary rounded-full h-1.5 transition-all duration-300"
                          style={{ width: `${(staticProgress.completed / staticProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {sourceInfo.isStatic 
                    ? "Browse and jump to other exercises in this category"
                    : "Browse and jump to static exercises in this category"
                  }
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                  {exerciseSummary
                    .map((exercise) => (
                    <div
                      key={exercise.id}
                      className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                        exercise.isCurrent 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
                      }`}
                      onClick={() => !exercise.isCurrent && handleNavigateToExercise(exercise.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {exercise.isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {exercise.title}
                            {exercise.isCurrent && (
                              <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">Current</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {exercise.attempts > 0 ? (
                              `${exercise.attempts} attempt${exercise.attempts > 1 ? 's' : ''}`
                            ) : (
                              'Not attempted yet'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {exercise.bestScore !== null && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium ${getScoreColor(exercise.bestScore)}`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {exercise.bestScore}%
                          </Badge>
                        )}
                        {!exercise.isCurrent && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {exerciseSummary.filter(e => !e.isCurrent).length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground border-t pt-3">
                    💡 Click on any static exercise to practice it directly
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generate New Exercise Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate New Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Want to practice with different questions? Generate a new exercise with optional theme.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Optional theme (e.g., 'travel', 'food', 'family')"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="flex-1"
                  disabled={state.isGenerating}
                />
                <Button
                  onClick={handleRegenerateExercise}
                  disabled={state.isGenerating}
                  className="w-full sm:w-auto"
                >
                  {state.isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate New Exercise
                    </>
                  )}
                </Button>
              </div>

              {!state.apiKey && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  💡 Set your API key in Settings to generate custom exercises
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
