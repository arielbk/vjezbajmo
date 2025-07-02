// Evaluation runner for testing different AI models on Croatian grammar

import { TestCase, ALL_TEST_CASES } from './test-cases';
import { ModelConfig, fetchAllModels } from './model-configs';

export interface EvaluationResult {
  testCaseId: string;
  modelName: string;
  userAnswer: string;
  aiResponse: {
    isCorrect: boolean;
    explanation: string;
  };
  expectedCorrect: boolean;
  actualCorrect: boolean; // Whether AI correctly identified if answer was right/wrong
  explanationQuality: 'good' | 'acceptable' | 'poor';
  notes?: string;
}

export interface ModelPerformance {
  modelName: string;
  accuracy: number; // Percentage of correct evaluations
  explanationQuality: number; // Average explanation quality score
  totalTests: number;
  correctEvaluations: number;
  results: EvaluationResult[];
}

export class EvaluationRunner {
  async runEvaluation(
    modelConfig: ModelConfig,
    testCases: TestCase[] = ALL_TEST_CASES,
    onProgress?: (progress: number, currentTest?: string) => void
  ): Promise<ModelPerformance> {
    const results: EvaluationResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      // Update progress before starting each test
      if (onProgress) {
        onProgress((i / testCases.length) * 100, `${testCase.exerciseType}: ${testCase.id}`);
      }

      try {
        const aiResponse = await this.evaluateAnswer(modelConfig, testCase);
        const actualCorrect = aiResponse.isCorrect === testCase.expectedCorrect;
        
        // Simple heuristic for explanation quality
        const explanationQuality = this.assessExplanationQuality(
          aiResponse.explanation,
          testCase.expectedExplanation
        );

        results.push({
          testCaseId: testCase.id,
          modelName: modelConfig.name,
          userAnswer: testCase.userAnswer,
          aiResponse,
          expectedCorrect: testCase.expectedCorrect,
          actualCorrect,
          explanationQuality,
          notes: testCase.notes,
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error evaluating test case ${testCase.id} with ${modelConfig.name}:`, error);
        results.push({
          testCaseId: testCase.id,
          modelName: modelConfig.name,
          userAnswer: testCase.userAnswer,
          aiResponse: {
            isCorrect: false,
            explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
          expectedCorrect: testCase.expectedCorrect,
          actualCorrect: false,
          explanationQuality: 'poor',
          notes: `Error during evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress(100, 'Completed');
    }

    return this.calculatePerformance(modelConfig.name, results);
  }

  private async evaluateAnswer(
    modelConfig: ModelConfig,
    testCase: TestCase
  ): Promise<{ isCorrect: boolean; explanation: string }> {
    // Use the new AI evaluation API
    const response = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseType: testCase.exerciseType,
        question: testCase.question,
        userAnswer: testCase.userAnswer,
        provider: modelConfig.provider,
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        // Include alternative answers for context
        alternativeAnswers: testCase.alternativeCorrectAnswers,
        difficultyLevel: testCase.difficultyLevel,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      isCorrect: data.isCorrect || false,
      explanation: data.explanation || 'No explanation provided',
    };
  }

  private assessExplanationQuality(
    aiExplanation: string,
    expectedExplanation?: string
  ): 'good' | 'acceptable' | 'poor' {
    if (!aiExplanation || aiExplanation.length < 10) return 'poor';
    
    // Simple heuristics for explanation quality
    const hasGrammarTerms = /\b(case|tense|aspect|gender|number|agreement|declension|conjugation|locative|accusative|instrumental|nominative|genitive|dative|vocative)\b/i.test(aiExplanation);
    const hasSpecificDetails = aiExplanation.length > 50;
    const isRelevant = expectedExplanation ? 
      this.calculateSimilarity(aiExplanation, expectedExplanation) > 0.3 : true;

    if (hasGrammarTerms && hasSpecificDetails && isRelevant) return 'good';
    if (hasSpecificDetails && isRelevant) return 'acceptable';
    return 'poor';
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculatePerformance(modelName: string, results: EvaluationResult[]): ModelPerformance {
    const correctEvaluations = results.filter(r => r.actualCorrect).length;
    const accuracy = (correctEvaluations / results.length) * 100;
    
    const explanationScores = results.map(r => {
      switch (r.explanationQuality) {
        case 'good': return 3;
        case 'acceptable': return 2;
        case 'poor': return 1;
        default: return 1;
      }
    });
    
    const explanationQuality = explanationScores.reduce((a, b) => a + b, 0) / explanationScores.length;

    return {
      modelName,
      accuracy,
      explanationQuality,
      totalTests: results.length,
      correctEvaluations,
      results,
    };
  }

  async runAllModels(testCases: TestCase[] = ALL_TEST_CASES, onProgress?: (modelIndex: number, totalModels: number, testProgress: number, currentTest?: string) => void): Promise<ModelPerformance[]> {
    const performances: ModelPerformance[] = [];
    
    // Fetch all available models dynamically
    const allModels = await fetchAllModels();
    
    for (let i = 0; i < allModels.length; i++) {
      const modelConfig = allModels[i];
      console.log(`Evaluating model: ${modelConfig.name}`);
      
      try {
        const performance = await this.runEvaluation(modelConfig, testCases, (testProgress, currentTest) => {
          if (onProgress) {
            onProgress(i, allModels.length, testProgress, currentTest);
          }
        });
        performances.push(performance);
      } catch (error) {
        console.error(`Failed to evaluate model ${modelConfig.name}:`, error);
        // Create a failed performance record
        performances.push({
          modelName: modelConfig.name,
          accuracy: 0,
          explanationQuality: 0,
          totalTests: 0,
          correctEvaluations: 0,
          results: [],
        });
      }
    }

    return performances.sort((a, b) => b.accuracy - a.accuracy);
  }

  async getAvailableModels(): Promise<ModelConfig[]> {
    return fetchAllModels();
  }
}
