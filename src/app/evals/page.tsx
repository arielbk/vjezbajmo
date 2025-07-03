"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EvaluationRunner, ModelPerformance, GenerationResult } from "@/evals/evaluation-runner";
import { ALL_TEST_CASES } from "@/evals/test-cases";
import { ModelConfig } from "@/evals/model-configs";
import {
  EvaluationResult,
  exportToJSON,
  exportToCSV,
  exportToReport,
  downloadFile,
  generateExportFilename,
} from "@/evals/export-utils";
import { getModelPricing, formatPrice } from "@/evals/models-pricing";
import { ChevronDown, ChevronUp, FileText, Table, FileCode } from "lucide-react";

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
  const [currentModel, setCurrentModel] = useState<string>("");
  const [currentTestCase, setCurrentTestCase] = useState<string>("");
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // Convert ModelPerformance to EvaluationResult for export
  const convertToEvaluationResults = (performances: ModelPerformance[]): EvaluationResult[] => {
    return performances.map((perf) => ({
      modelId: `${perf.provider}-${perf.modelName}`,
      provider: perf.provider,
      model: perf.modelName,
      timestamp: new Date().toISOString(),
      overallScore: perf.overallScore * 100, // Convert to percentage
      criteria: {
        answerCorrectness: perf.criteria.answerCorrectness * 100,
        explanationQuality: perf.criteria.explanationQuality * 100,
        exerciseDesign: perf.criteria.exerciseDesign * 100,
        speedReliability: perf.criteria.speedReliability * 100,
        costEfficiency: perf.criteria.costEfficiency ? perf.criteria.costEfficiency * 100 : undefined,
      },
      testCases: perf.results.map((result) => {
        const testCase = ALL_TEST_CASES.find(tc => tc.id === result.testCaseId);
        return {
          id: result.testCaseId,
          exerciseType: testCase?.request.exerciseType || "unknown",
          passed: result.exerciseGenerated,
          explanation: result.errors.join("; ") || undefined,
          executionTime: result.executionTime,
          error: result.errors.length > 0 ? result.errors[0] : undefined,
        };
      }),
      performance: {
        totalTests: perf.totalTests,
        passed: perf.successfulGenerations,
        failed: perf.totalTests - perf.successfulGenerations,
        averageExecutionTime: perf.averageExecutionTime,
        totalExecutionTime: perf.results.reduce((sum, r) => sum + r.executionTime, 0),
      },
    }));
  };

  // Export functions
  const handleExportJSON = () => {
    const evaluationResults = convertToEvaluationResults(performances);
    const jsonData = exportToJSON(evaluationResults);
    const filename = generateExportFilename("json");
    downloadFile(jsonData, filename, "json");
  };

  const handleExportCSV = () => {
    const evaluationResults = convertToEvaluationResults(performances);
    const csvData = exportToCSV(evaluationResults);
    const filename = generateExportFilename("csv");
    downloadFile(csvData, filename, "csv");
  };

  const handleExportReport = () => {
    const evaluationResults = convertToEvaluationResults(performances);
    const reportData = exportToReport(evaluationResults, {
      format: "report",
      includePerformanceDetails: true,
      includeFailedCases: true,
      includeCostAnalysis: evaluationResults.some((r) => r.criteria.costEfficiency !== undefined),
    });
    const filename = generateExportFilename("report");
    downloadFile(reportData, filename, "report");
  };

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
    setCurrentModel("");
    setCurrentTestCase("");

    try {
      const runner = new EvaluationRunner();
      const selectedModelConfigs = availableModels.filter((m) => selectedModels.includes(m.name));
      const results: ModelPerformance[] = [];
      const totalTests = selectedModelConfigs.length * ALL_TEST_CASES.length;
      let completedTests = 0;

      for (let i = 0; i < selectedModelConfigs.length; i++) {
        const modelConfig = selectedModelConfigs[i];
        setCurrentModel(modelConfig.name);

        // Create a custom function to track individual test progress
        const performanceResults: GenerationResult[] = [];

        try {
          for (let j = 0; j < ALL_TEST_CASES.length; j++) {
            const testCase = ALL_TEST_CASES[j];
            setCurrentTestCase(testCase.id);

            try {
              // Run individual test
              const testResult = await runner.runSingleTest(modelConfig, testCase);
              performanceResults.push(testResult);

              completedTests++;
              const overallProgress = (completedTests / totalTests) * 100;
              setProgress(overallProgress);

              // Add a small delay for better UX (prevents flickering)
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (testError) {
              console.error(`Failed test ${testCase.id} for ${modelConfig.name}:`, testError);
              completedTests++;
              const overallProgress = (completedTests / totalTests) * 100;
              setProgress(overallProgress);
            }
          }

          // Now calculate the overall performance for this model
          const performance = await runner.calculateModelPerformance(modelConfig, performanceResults);
          results.push(performance);
          setPerformances([...results].sort((a, b) => b.overallScore - a.overallScore));
        } catch (error) {
          console.error(`Failed to evaluate ${modelConfig.name}:`, error);
          // Add a failed result
          results.push({
            modelName: modelConfig.name,
            provider: modelConfig.provider,
            overallScore: 0,
            criteria: {
              answerCorrectness: 0,
              explanationQuality: 0,
              exerciseDesign: 0,
              speedReliability: 0,
              costEfficiency: undefined,
            },
            totalTests: ALL_TEST_CASES.length,
            successfulGenerations: 0,
            averageExecutionTime: 0,
            results: [],
          });
          setPerformances([...results].sort((a, b) => b.overallScore - a.overallScore));

          // Update progress even for failed models (skip remaining tests for this model)
          const remainingTestsForThisModel = ALL_TEST_CASES.length - performanceResults.length;
          completedTests += remainingTestsForThisModel;
          const overallProgress = (completedTests / totalTests) * 100;
          setProgress(overallProgress);
        }
      }

      setCurrentModel("");
      setCurrentTestCase("");
      setProgress(100);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to run evaluations");
      setCurrentModel("");
      setCurrentTestCase("");
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

  const toggleExplanation = (resultId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [resultId]: !prev[resultId],
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Evaluations</h1>
        <p className="text-gray-600">
          Evaluate AI models on Croatian grammar exercise generation. Tests the quality, structure, and appropriateness
          of generated exercise sets. Only available in development mode.
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
            <CardTitle>Exercise Generation Evaluation</CardTitle>
            <CardDescription>
              Select models to test on {ALL_TEST_CASES.length} Croatian grammar exercise generation test cases. Found{" "}
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
                  {availableModels.map((model) => {
                    const pricing = getModelPricing(model.model);
                    return (
                      <div
                        key={model.name}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedModels.includes(model.name)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleModelSelection(model.name)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{model.name}</span>
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
                        {pricing && (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>In: {formatPrice(pricing.inputPricePerMToken)}/MTok</div>
                            <div>Out: {formatPrice(pricing.outputPricePerMToken)}/MTok</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    {currentModel && (
                      <p className="text-xs text-gray-400 text-center">
                        Current Model: {currentModel}
                        {currentTestCase && ` • Testing: ${currentTestCase}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {performances.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between ">
              <div>
                <CardTitle className="mb-2">Evaluation Results</CardTitle>
                <CardDescription className="pr-6">
                  Performance comparison using weighted scoring: Answer Correctness (45%), Explanation Quality (15%),
                  Exercise Design (15%), Speed & Reliability (15%), Cost Efficiency (10%).
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportJSON}>
                  <FileCode className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Table className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary">
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  {/* API Error Summary */}
                  {performances.length > 0 &&
                    (() => {
                      const totalApiErrors = performances.reduce(
                        (sum, perf) =>
                          sum +
                          perf.results.filter((r) =>
                            r.errors.some(
                              (error) =>
                                error.includes("API Error:") || error.includes("529") || error.includes("overloaded")
                            )
                          ).length,
                        0
                      );
                      const totalTests = performances.reduce((sum, perf) => sum + perf.totalTests, 0);

                      if (totalApiErrors > 0) {
                        return (
                          <div className="p-4 border border-orange-200 rounded bg-orange-50">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="bg-orange-600 text-white">
                                API Issues Detected
                              </Badge>
                            </div>
                            <p className="text-sm text-orange-800">
                              <strong>{totalApiErrors}</strong> API errors occurred out of <strong>{totalTests}</strong>{" "}
                              total tests ({((totalApiErrors / totalTests) * 100).toFixed(1)}% failure rate). Most
                              appear to be service overload errors (HTTP 529) from provider APIs. Consider running the
                              evaluation again when API load is lower.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  {performances.map((perf, index) => {
                    const apiErrors = perf.results.filter((r) =>
                      r.errors.some(
                        (error) => error.includes("API Error:") || error.includes("529") || error.includes("overloaded")
                      )
                    ).length;
                    const otherErrors = perf.results.filter((r) => r.errors.length > 0).length - apiErrors;

                    return (
                      <div key={perf.modelName} className="p-4 border rounded">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{perf.modelName}</span>
                            {(apiErrors > 0 || otherErrors > 0) && (
                              <div className="flex gap-1">
                                {apiErrors > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-orange-100 text-orange-800 border-orange-300 text-xs"
                                  >
                                    {apiErrors} API error{apiErrors !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                                {otherErrors > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {otherErrors} other error{otherErrors !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Overall Score:</span>
                            <br />
                            <span className="font-medium">{(perf.overallScore * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Generated:</span>
                            <br />
                            <span className="font-medium">
                              {perf.successfulGenerations}/{perf.totalTests}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg Time:</span>
                            <br />
                            <span className="font-medium">{perf.averageExecutionTime.toFixed(0)}ms</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-4 text-xs mt-2 pt-2 border-t">
                          <div>
                            <span className="text-gray-500">Answer Correctness:</span>{" "}
                            {(perf.criteria.answerCorrectness * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="text-gray-500">Explanation Quality:</span>{" "}
                            {(perf.criteria.explanationQuality * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="text-gray-500">Exercise Design:</span>{" "}
                            {(perf.criteria.exerciseDesign * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="text-gray-500">Speed & Reliability:</span>{" "}
                            {(perf.criteria.speedReliability * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="text-gray-500">Cost Efficiency:</span>{" "}
                            {perf.criteria.costEfficiency
                              ? `${(perf.criteria.costEfficiency * 100).toFixed(0)}%`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
                  {performances.map((perf) => {
                    // Calculate error summary for this model
                    const totalErrors = perf.results.filter((r) => r.errors.length > 0).length;
                    const apiErrors = perf.results.filter((r) =>
                      r.errors.some(
                        (error) => error.includes("API Error:") || error.includes("529") || error.includes("overloaded")
                      )
                    ).length;
                    const otherErrors = totalErrors - apiErrors;

                    return (
                      <div key={perf.modelName} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{perf.modelName}</h3>
                          {totalErrors > 0 && (
                            <div className="flex gap-2 text-xs">
                              {apiErrors > 0 && (
                                <Badge variant="destructive" className="bg-orange-600 text-white">
                                  {apiErrors} API Error{apiErrors !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {otherErrors > 0 && (
                                <Badge variant="destructive">
                                  {otherErrors} Other Error{otherErrors !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-sm">
                          {perf.results.map((result) => {
                            const resultId = `${perf.modelName}-${result.testCaseId}`;
                            const isExpanded = expandedExplanations[resultId];
                            const hasErrors = result.errors.length > 0;
                            const errorText = hasErrors ? result.errors.join("; ") : "";
                            const shouldTruncateErrors = errorText.length > 100;
                            const hasApiError =
                              hasErrors &&
                              result.errors.some(
                                (error) =>
                                  error.includes("API Error:") || error.includes("529") || error.includes("overloaded")
                              );

                            return (
                              <div
                                key={result.testCaseId}
                                className={`p-2 rounded border ${
                                  result.exerciseGenerated
                                    ? "bg-green-50 border-green-200"
                                    : hasApiError
                                    ? "bg-orange-50 border-orange-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{result.testCaseId}</span>
                                  <div className="flex gap-2">
                                    {hasApiError && (
                                      <Badge
                                        variant="outline"
                                        className="bg-orange-100 text-orange-800 border-orange-300"
                                      >
                                        API Issue
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={result.exerciseGenerated ? "default" : "destructive"}
                                      className={
                                        result.exerciseGenerated ? "" : "bg-red-600 text-white hover:bg-red-700"
                                      }
                                    >
                                      {result.exerciseGenerated ? "Generated" : "Failed"}
                                    </Badge>
                                    {result.exerciseGenerated && (
                                      <Badge variant="outline">{(result.overallScore * 100).toFixed(0)}%</Badge>
                                    )}
                                  </div>
                                </div>

                                {result.exerciseGenerated && (
                                  <div className="text-gray-600 mt-1 text-xs">
                                    Answer Correctness: {(result.answerCorrectness * 100).toFixed(0)}% | Explanation
                                    Quality: {(result.explanationQuality * 100).toFixed(0)}% | Exercise Design:{" "}
                                    {(result.exerciseDesign * 100).toFixed(0)}% | Speed & Reliability:{" "}
                                    {(result.speedReliability * 100).toFixed(0)}%
                                    {result.costEfficiency &&
                                      ` | Cost Efficiency: ${(result.costEfficiency * 100).toFixed(0)}%`}
                                  </div>
                                )}

                                {hasErrors && (
                                  <div className={`text-xs mt-1 ${hasApiError ? "text-orange-700" : "text-red-600"}`}>
                                    {shouldTruncateErrors && !isExpanded ? (
                                      <div className="flex items-center gap-1">
                                        <span>
                                          {hasApiError ? "API Error:" : "Error:"} {errorText.slice(0, 100)}...
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleExplanation(resultId)}
                                          className={`h-6 px-2 text-xs ${
                                            hasApiError ? "hover:bg-orange-100" : "hover:bg-red-100"
                                          }`}
                                        >
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          see more
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <div
                                          className={`p-2 rounded text-xs ${
                                            hasApiError ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          <strong>{hasApiError ? "API Error:" : "Error:"}</strong> {errorText}
                                        </div>
                                        {shouldTruncateErrors && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleExplanation(resultId)}
                                            className={`h-6 px-2 text-xs ${
                                              hasApiError ? "hover:bg-orange-100" : "hover:bg-red-100"
                                            }`}
                                          >
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            see less
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="text-xs text-gray-500 mt-1">
                                  Execution time: {result.executionTime}ms
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
