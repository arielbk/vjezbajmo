"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EvaluationRunner, ModelPerformance } from "@/evals/evaluation-runner";
import { ALL_TEST_CASES } from "@/evals/test-cases";
import { ModelConfig } from "@/evals/model-configs";

// Only allow access in development mode
export default function EvalsPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>This page is only available in development mode.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <EvalsPageContent />;
}

function EvalsPageContent() {
  const [isRunning, setIsRunning] = useState(false);
  const [performances, setPerformances] = useState<ModelPerformance[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  // Load available models on mount
  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const runner = new EvaluationRunner();
      const models = await runner.getAvailableModels();
      setAvailableModels(models);
      // Select all models by default
      setSelectedModels(models.map((m) => m.name));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load models");
    }
  };

  const runEvaluations = async () => {
    if (selectedModels.length === 0) {
      setError("Please select at least one model");
      return;
    }

    setIsRunning(true);
    setError(null);
    setPerformances([]);
    setProgress(0);
    setCurrentStatus("Starting evaluations...");

    try {
      const runner = new EvaluationRunner();
      const selectedModelConfigs = availableModels.filter((m) => selectedModels.includes(m.name));
      const results: ModelPerformance[] = [];

      for (let i = 0; i < selectedModelConfigs.length; i++) {
        const modelConfig = selectedModelConfigs[i];
        setCurrentStatus(`Evaluating ${modelConfig.name}...`);

        try {
          const performance = await runner.runEvaluation(modelConfig, ALL_TEST_CASES, (testProgress, currentTest) => {
            // Calculate overall progress: (models completed + current model progress) / total models
            const modelProgress = (i / selectedModelConfigs.length) * 100;
            const currentModelProgress = (testProgress / 100) * (100 / selectedModelConfigs.length);
            const totalProgress = modelProgress + currentModelProgress;

            setProgress(totalProgress);
            setCurrentStatus(`${modelConfig.name}: ${currentTest || "Processing..."}`);
          });

          results.push(performance);
          setPerformances([...results].sort((a, b) => b.accuracy - a.accuracy));
        } catch (error) {
          console.error(`Failed to evaluate ${modelConfig.name}:`, error);
          // Add a failed result
          results.push({
            modelName: modelConfig.name,
            accuracy: 0,
            explanationQuality: 0,
            totalTests: 0,
            correctEvaluations: 0,
            results: [],
          });
          setPerformances([...results].sort((a, b) => b.accuracy - a.accuracy));
        }
      }

      setCurrentStatus("Evaluation completed!");
      setProgress(100);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to run evaluations");
      setCurrentStatus("Evaluation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const toggleModelSelection = (modelName: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelName) ? prev.filter((name) => name !== modelName) : [...prev, modelName]
    );
  };

  const selectAllModels = () => {
    setSelectedModels(availableModels.map((m) => m.name));
  };

  const deselectAllModels = () => {
    setSelectedModels([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Evaluations</h1>
        <p className="text-gray-600">
          Evaluate AI models on Croatian grammar exercises. Only available in development mode.
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Model Selection and Evaluation */}
        <Card>
          <CardHeader>
            <CardTitle>Model Evaluation</CardTitle>
            <CardDescription>
              Select models to test on {ALL_TEST_CASES.length} Croatian grammar test cases. Found{" "}
              {availableModels.length} available models.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllModels}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllModels}>
                    Deselect All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableModels.map((model) => (
                    <div
                      key={model.name}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedModels.includes(model.name)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleModelSelection(model.name)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{model.name}</span>
                        <Badge
                          variant={model.provider === "openai" ? "default" : "secondary"}
                          className={
                            selectedModels.includes(model.name) && model.provider === "anthropic"
                              ? "bg-white text-gray-900"
                              : ""
                          }
                        >
                          {model.provider}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Evaluation */}
              <div className="space-y-4 pt-4 border-t">
                <Button
                  onClick={runEvaluations}
                  disabled={isRunning || selectedModels.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? "Running Evaluations..." : `Evaluate ${selectedModels.length} Selected Models`}
                </Button>

                {isRunning && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full transition-all duration-500 ease-out" />
                    <p className="text-sm text-gray-600 text-center">{progress.toFixed(0)}% complete</p>
                    <p className="text-xs text-gray-500 text-center">{currentStatus}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {performances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Results</CardTitle>
              <CardDescription>
                Results sorted by accuracy. Higher accuracy means the model correctly identified whether answers were
                right or wrong.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {performances.map((perf, index) => (
                    <div key={perf.modelName} className="p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{perf.modelName}</span>
                        <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Accuracy:</span>
                          <br />
                          <span className="font-medium">{perf.accuracy.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Correct:</span>
                          <br />
                          <span className="font-medium">
                            {perf.correctEvaluations}/{perf.totalTests}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Explanation Quality:</span>
                          <br />
                          <span className="font-medium">{perf.explanationQuality.toFixed(1)}/3.0</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
                  {performances.map((perf) => (
                    <div key={perf.modelName} className="space-y-2">
                      <h3 className="font-medium">{perf.modelName}</h3>
                      <div className="space-y-1 text-sm">
                        {perf.results.map((result) => (
                          <div
                            key={result.testCaseId}
                            className={`p-2 rounded ${result.actualCorrect ? "bg-green-50" : "bg-red-50"}`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{result.testCaseId}</span>
                              <Badge variant={result.actualCorrect ? "default" : "destructive"}>
                                {result.actualCorrect ? "Correct" : "Failed"}
                              </Badge>
                            </div>
                            <div className="text-gray-600 mt-1">
                              Expected: {result.expectedCorrect ? "Correct" : "Incorrect"} | AI said:{" "}
                              {result.aiResponse.isCorrect ? "Correct" : "Incorrect"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.aiResponse.explanation.slice(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
