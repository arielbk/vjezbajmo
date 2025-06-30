"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userProgressManager } from "@/lib/user-progress";
import { CompletedExerciseRecord, ExerciseType } from "@/types/exercise";
import { Trophy, Target, TrendingUp, Calendar, RefreshCw } from "lucide-react";

interface CompletedExercisesViewProps {
  onBack?: () => void; // Keep optional for backward compatibility but won't be used
  onRetryExercise?: (exerciseType: ExerciseType, exerciseId: string) => void;
}

export function CompletedExercisesView({ onRetryExercise }: CompletedExercisesViewProps) {
  const [completedRecords, setCompletedRecords] = useState<CompletedExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ExerciseType | "all">("all");

  useEffect(() => {
    loadCompletedRecords();
  }, []);

  const loadCompletedRecords = () => {
    setLoading(true);
    try {
      const records = userProgressManager.getAllCompletedRecords();
      // Sort by completion date (newest first)
      const sortedRecords = records.sort((a, b) => b.completedAt - a.completedAt);
      setCompletedRecords(sortedRecords);
    } catch (error) {
      console.error("Failed to load completed records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseTypeDisplayName = (type: ExerciseType): string => {
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

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const filteredRecords =
    selectedType === "all"
      ? completedRecords
      : completedRecords.filter((record) => record.exerciseType === selectedType);

  const stats = userProgressManager.getPerformanceStats();

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4 px-2 sm:px-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your exercise history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Exercise History</h1>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
              Total Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            <p className="text-xs text-muted-foreground">exercises finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">across all exercises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Best Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const bestType = Object.entries(stats.byExerciseType)
                .filter(([, data]) => data.completed > 0)
                .sort((a, b) => b[1].averageScore - a[1].averageScore)[0];

              return bestType ? (
                <>
                  <div className="text-sm font-bold">{getExerciseTypeDisplayName(bestType[0] as ExerciseType)}</div>
                  <p className="text-xs text-muted-foreground">{bestType[1].averageScore}% average</p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No data yet</div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Exercise Type Filter */}
      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as ExerciseType | "all")}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full justify-start gap-1 p-1">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap">
              All
            </TabsTrigger>
            <TabsTrigger value="verbTenses" className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap">
              Verb Tenses
            </TabsTrigger>
            <TabsTrigger value="nounDeclension" className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap">
              Declension
            </TabsTrigger>
            <TabsTrigger value="verbAspect" className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap">
              Verb Aspect
            </TabsTrigger>
            <TabsTrigger value="interrogativePronouns" className="flex-shrink-0 px-3 py-2 text-sm whitespace-nowrap">
              Pronouns
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedType} className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed exercises</h3>
                <p className="text-muted-foreground">
                  {selectedType === "all"
                    ? "Start practicing to see your exercise history here!"
                    : `You haven't completed any ${getExerciseTypeDisplayName(
                        selectedType as ExerciseType
                      )} exercises yet.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record, index) => (
                <Card key={`${record.exerciseId}-${record.attemptNumber}-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {record.title || getExerciseTypeDisplayName(record.exerciseType)}
                          </h3>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                            {record.cefrLevel}
                          </span>
                          {record.theme && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-700">
                              {record.theme}
                            </span>
                          )}
                          {record.attemptNumber > 1 && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                              Attempt #{record.attemptNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(record.completedAt)}
                          </span>
                          <span>
                            {record.score.correct}/{record.score.total} correct
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getScoreColor(
                            record.score.percentage
                          )} border`}
                        >
                          {record.score.percentage}%
                        </span>
                        {onRetryExercise && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRetryExercise(record.exerciseType, record.exerciseId)}
                            className="h-8 w-8 p-0"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Show improvement indicator for multiple attempts */}
                    {record.attemptNumber > 1 &&
                      (() => {
                        const previousAttempt = completedRecords.find(
                          (r) => r.exerciseId === record.exerciseId && r.attemptNumber === record.attemptNumber - 1
                        );

                        if (previousAttempt) {
                          const improvement = record.score.percentage - previousAttempt.score.percentage;
                          if (improvement > 0) {
                            return (
                              <div className="mt-2 flex items-center text-xs text-green-600">
                                <TrendingUp className="h-3 w-3 mr-1" />+{improvement}% improvement from previous attempt
                              </div>
                            );
                          } else if (improvement < 0) {
                            return (
                              <div className="mt-2 flex items-center text-xs text-red-600">
                                <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                                {improvement}% from previous attempt
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
