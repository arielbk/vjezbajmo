/**
 * Export utilities for AI model evaluation results
 * Provides functionality to export evaluation data in multiple formats
 * for data persistence and sharing as specified in issue #36
 */

export interface EvaluationResult {
  modelId: string;
  provider: string;
  model: string;
  timestamp: string;
  overallScore: number;
  criteria: {
    answerCorrectness: number;
    explanationQuality: number;
    exerciseDesign: number;
    speedReliability: number;
    costEfficiency?: number;
  };
  testCases: Array<{
    id: string;
    exerciseType: string;
    passed: boolean;
    explanation?: string;
    executionTime?: number;
    error?: string;
  }>;
  performance: {
    totalTests: number;
    passed: number;
    failed: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  };
  cost?: {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
    costPerExercise: number;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'report';
  includeFailedCases?: boolean;
  includePerformanceDetails?: boolean;
  includeCostAnalysis?: boolean;
}

/**
 * Export evaluation results to JSON format
 */
export function exportToJSON(
  results: EvaluationResult[],
  options: ExportOptions = { format: 'json' }
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    evaluationCount: results.length,
    results: options.includeFailedCases 
      ? results 
      : results.map(result => ({
          ...result,
          testCases: result.testCases.filter(tc => !tc.error)
        }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export evaluation results to CSV format
 */
export function exportToCSV(
  results: EvaluationResult[],
  options: ExportOptions = { format: 'csv' }
): string {
  if (results.length === 0) {
    return 'No evaluation results to export';
  }

  const headers = [
    'Model ID',
    'Provider',
    'Model',
    'Timestamp',
    'Overall Score',
    'Answer Correctness',
    'Explanation Quality', 
    'Exercise Design',
    'Speed & Reliability',
    'Cost Efficiency',
    'Total Tests',
    'Passed',
    'Failed',
    'Average Execution Time (ms)',
    'Total Execution Time (ms)',
    ...(options.includeCostAnalysis ? ['Input Tokens', 'Output Tokens', 'Total Cost', 'Cost Per Exercise'] : [])
  ];

  const rows = results.map(result => [
    result.modelId,
    result.provider,
    result.model,
    result.timestamp,
    result.overallScore.toFixed(2),
    result.criteria.answerCorrectness.toFixed(2),
    result.criteria.explanationQuality.toFixed(2),
    result.criteria.exerciseDesign.toFixed(2),
    result.criteria.speedReliability.toFixed(2),
    result.criteria.costEfficiency?.toFixed(2) || 'N/A',
    result.performance.totalTests,
    result.performance.passed,
    result.performance.failed,
    result.performance.averageExecutionTime.toFixed(2),
    result.performance.totalExecutionTime.toFixed(2),
    ...(options.includeCostAnalysis && result.cost ? [
      result.cost.inputTokens,
      result.cost.outputTokens,
      result.cost.totalCost.toFixed(4),
      result.cost.costPerExercise.toFixed(4)
    ] : options.includeCostAnalysis ? ['N/A', 'N/A', 'N/A', 'N/A'] : [])
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Export evaluation results to human-readable report format
 */
export function exportToReport(
  results: EvaluationResult[],
  options: ExportOptions = { format: 'report' }
): string {
  const sortedResults = [...results].sort((a, b) => b.overallScore - a.overallScore);
  
  let report = `# AI Model Evaluation Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Models Evaluated:** ${results.length}\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  if (sortedResults.length > 0) {
    const topModel = sortedResults[0];
    report += `**Top Performer:** ${topModel.provider} ${topModel.model} (${topModel.overallScore.toFixed(1)}%)\n`;
    report += `**Average Score:** ${(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length).toFixed(1)}%\n\n`;
  }

  // Model Rankings
  report += `## Model Rankings\n\n`;
  sortedResults.forEach((result, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    
    report += `${medal} **${rank}. ${result.provider} ${result.model}** - ${result.overallScore.toFixed(1)}%\n`;
    report += `   - Answer Correctness: ${result.criteria.answerCorrectness.toFixed(1)}% (Weight: 45%)\n`;
    report += `   - Explanation Quality: ${result.criteria.explanationQuality.toFixed(1)}% (Weight: 15%)\n`;
    report += `   - Exercise Design: ${result.criteria.exerciseDesign.toFixed(1)}% (Weight: 15%)\n`;
    report += `   - Speed & Reliability: ${result.criteria.speedReliability.toFixed(1)}% (Weight: 15%)\n`;
    if (result.criteria.costEfficiency) {
      report += `   - Cost Efficiency: ${result.criteria.costEfficiency.toFixed(1)}% (Weight: 10%)\n`;
    }
    report += `   - Success Rate: ${result.performance.passed}/${result.performance.totalTests} (${((result.performance.passed / result.performance.totalTests) * 100).toFixed(1)}%)\n`;
    report += `   - Avg Response Time: ${result.performance.averageExecutionTime.toFixed(0)}ms\n`;
    if (result.cost && options.includeCostAnalysis) {
      report += `   - Cost per Exercise: $${result.cost.costPerExercise.toFixed(4)}\n`;
    }
    report += `\n`;
  });

  // Detailed Analysis
  if (options.includePerformanceDetails) {
    report += `## Detailed Performance Analysis\n\n`;
    
    // Performance by Exercise Type
    const exerciseTypes = [...new Set(results.flatMap(r => r.testCases.map(tc => tc.exerciseType)))];
    
    exerciseTypes.forEach(exerciseType => {
      report += `### ${exerciseType}\n\n`;
      
      sortedResults.forEach(result => {
        const typeTests = result.testCases.filter(tc => tc.exerciseType === exerciseType);
        const typePassed = typeTests.filter(tc => tc.passed).length;
        const typeTotal = typeTests.length;
        
        if (typeTotal > 0) {
          report += `- **${result.provider} ${result.model}**: ${typePassed}/${typeTotal} (${((typePassed / typeTotal) * 100).toFixed(1)}%)\n`;
        }
      });
      report += `\n`;
    });
  }

  // Failed Test Cases
  if (options.includeFailedCases) {
    report += `## Failed Test Cases\n\n`;
    
    sortedResults.forEach(result => {
      const failedCases = result.testCases.filter(tc => !tc.passed);
      
      if (failedCases.length > 0) {
        report += `### ${result.provider} ${result.model}\n\n`;
        failedCases.forEach(testCase => {
          report += `- **${testCase.id}** (${testCase.exerciseType})\n`;
          if (testCase.error) {
            report += `  - Error: ${testCase.error}\n`;
          }
          if (testCase.explanation) {
            report += `  - Details: ${testCase.explanation}\n`;
          }
        });
        report += `\n`;
      }
    });
  }

  // Cost Analysis
  if (options.includeCostAnalysis && results.some(r => r.cost)) {
    report += `## Cost Analysis\n\n`;
    
    const costsAvailable = sortedResults.filter(r => r.cost);
    if (costsAvailable.length > 0) {
      report += `| Model | Total Cost | Cost/Exercise | Input Tokens | Output Tokens |\n`;
      report += `|-------|------------|---------------|--------------|---------------|\n`;
      
      costsAvailable.forEach(result => {
        const cost = result.cost!;
        report += `| ${result.provider} ${result.model} | $${cost.totalCost.toFixed(4)} | $${cost.costPerExercise.toFixed(4)} | ${cost.inputTokens} | ${cost.outputTokens} |\n`;
      });
      report += `\n`;
    }
  }

  report += `---\n`;
  report += `*Report generated by Croatian Grammar AI Model Evaluation System*\n`;
  
  return report;
}

/**
 * Generate a filename for the export based on the format and timestamp
 */
export function generateExportFilename(format: 'json' | 'csv' | 'report'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = format === 'report' ? 'md' : format;
  return `evaluation-results-${timestamp}.${extension}`;
}

/**
 * Create a downloadable blob for the exported data
 */
export function createDownloadBlob(content: string, format: 'json' | 'csv' | 'report'): Blob {
  const mimeTypes = {
    json: 'application/json',
    csv: 'text/csv',
    report: 'text/markdown'
  };
  
  return new Blob([content], { type: mimeTypes[format] });
}

/**
 * Trigger a download in the browser
 */
export function downloadFile(content: string, filename: string, format: 'json' | 'csv' | 'report'): void {
  const blob = createDownloadBlob(content, format);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
