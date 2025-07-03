// Evaluation runner for testing AI-generated Croatian grammar exercise sets

import { ModelConfig, fetchAllModels } from './model-configs';
import { GenerationTestCase } from './test-cases';

// Type for generated exercise (can be paragraph or sentence exercise set)
type GeneratedExercise = {
  id: string;
  paragraph?: string;
  questions?: Array<{
    id: string;
    blankNumber?: number;
    baseForm?: string;
    text?: string;
    correctAnswer: string | string[];
    explanation: string;
    isPlural?: boolean;
  }>;
  exercises?: Array<{
    id: string | number;
    text: string;
    correctAnswer: string | string[];
    explanation: string;
    isPlural?: boolean;
  }>;
};

export interface GenerationResult {
  testCaseId: string;
  exerciseGenerated: boolean;
  answerCorrectness: number; // 0-1 (45% weight)
  explanationQuality: number; // 0-1 (15% weight)
  exerciseDesign: number; // 0-1 (15% weight)
  speedReliability: number; // 0-1 (15% weight)
  costEfficiency?: number; // 0-1 (10% weight) - optional
  overallScore: number; // 0-1 (weighted average)
  errors: string[];
  generatedExercise?: GeneratedExercise;
  executionTime: number; // milliseconds
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalCost?: number;
  };
}

export interface ModelPerformance {
  modelName: string;
  provider: string;
  overallScore: number; // Weighted score according to issue #36
  criteria: {
    answerCorrectness: number; // 45% weight
    explanationQuality: number; // 15% weight
    exerciseDesign: number; // 15% weight
    speedReliability: number; // 15% weight
    costEfficiency?: number; // 10% weight
  };
  totalTests: number;
  successfulGenerations: number;
  averageExecutionTime: number;
  results: GenerationResult[];
}

export class EvaluationRunner {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async getAvailableModels(): Promise<ModelConfig[]> {
    return fetchAllModels();
  }

  async runAllModels(testCases: GenerationTestCase[]): Promise<ModelPerformance[]> {
    const models = await this.getAvailableModels();
    const performances: ModelPerformance[] = [];

    for (const model of models) {
      console.log(`\n🧪 Testing model: ${model.name} (${model.provider})`);
      const performance = await this.runModelTests(model, testCases);
      performances.push(performance);
    }

    // Sort by overall score descending
    return performances.sort((a, b) => b.overallScore - a.overallScore);
  }

  async runModelTests(model: ModelConfig, testCases: GenerationTestCase[]): Promise<ModelPerformance> {
    const results: GenerationResult[] = [];
    
    for (const testCase of testCases) {
      console.log(`  • Testing: ${testCase.description}`);
      const result = await this.runSingleTest(model, testCase);
      results.push(result);
    }

    return this.calculateModelPerformance(model, results);
  }

  async runSingleTest(model: ModelConfig, testCase: GenerationTestCase): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      testCaseId: testCase.id,
      exerciseGenerated: false,
      answerCorrectness: 0,
      explanationQuality: 0,
      exerciseDesign: 0,
      speedReliability: 0,
      costEfficiency: undefined,
      overallScore: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      // Generate exercise using the actual API
      const exerciseResponse = await this.generateExercise(model, testCase);
      
      if (!exerciseResponse.ok) {
        // Try to get more detailed error information
        let errorDetails = `${exerciseResponse.status} ${exerciseResponse.statusText}`;
        try {
          const errorBody = await exerciseResponse.text();
          if (errorBody) {
            // Parse common error patterns
            if (errorBody.includes('"type":"overloaded_error"')) {
              errorDetails += ' - Service Overloaded (try again later)';
            } else if (errorBody.includes('"type":"rate_limit_error"')) {
              errorDetails += ' - Rate Limit Exceeded';
            } else if (errorBody.includes('"type":"authentication_error"')) {
              errorDetails += ' - Authentication Failed';
            } else if (errorBody.includes('"type":"invalid_request_error"')) {
              errorDetails += ' - Invalid Request';
            }
            // Include the first part of the error message for context
            const truncatedBody = errorBody.length > 200 ? errorBody.substring(0, 200) + '...' : errorBody;
            errorDetails += ` (${truncatedBody})`;
          }
        } catch (parseError) {
          // If we can't parse the error body, just use the status
        }
        
        result.errors.push(`API Error: ${errorDetails}`);
        result.executionTime = Date.now() - startTime;
        return result;
      }

      const generatedExercise = await exerciseResponse.json();
      result.generatedExercise = generatedExercise;
      result.exerciseGenerated = true;

      // Score the generated exercise using the weighted criteria
      result.answerCorrectness = this.scoreAnswerCorrectness(generatedExercise, testCase);
      result.explanationQuality = this.scoreExplanationQuality(generatedExercise, testCase);
      result.exerciseDesign = this.scoreExerciseDesign(generatedExercise, testCase);
      result.speedReliability = this.scoreSpeedReliability(result.executionTime, testCase);
      result.costEfficiency = this.scoreCostEfficiency(result.tokenUsage, testCase);

      // Calculate weighted overall score
      const weights = {
        answerCorrectness: 0.45, // 45% - Most critical (deal breaker)
        explanationQuality: 0.15, // 15%
        exerciseDesign: 0.15, // 15%
        speedReliability: 0.15, // 15%
        costEfficiency: 0.10, // 10%
      };

      result.overallScore = 
        result.answerCorrectness * weights.answerCorrectness +
        result.explanationQuality * weights.explanationQuality +
        result.exerciseDesign * weights.exerciseDesign +
        result.speedReliability * weights.speedReliability +
        (result.costEfficiency || 0) * weights.costEfficiency;

    } catch (error) {
      // Capture detailed error information
      let errorMessage = `Exception: ${error instanceof Error ? error.message : String(error)}`;
      
      // Add more context for common error types
      if (error instanceof Error) {
        if (error.message.includes('529')) {
          errorMessage += ' - Service temporarily overloaded, likely due to high demand';
        } else if (error.message.includes('rate_limit')) {
          errorMessage += ' - API rate limit exceeded';
        } else if (error.message.includes('timeout')) {
          errorMessage += ' - Request timed out';
        } else if (error.message.includes('fetch')) {
          errorMessage += ' - Network connection issue';
        }
      }
      
      result.errors.push(errorMessage);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  private async generateExercise(model: ModelConfig, testCase: GenerationTestCase): Promise<Response> {
    const requestBody = {
      ...testCase.request,
      provider: model.provider,
      forceRegenerate: true, // Always generate fresh for evals
    };

    // Use appropriate API key based on provider
    const apiKey = model.provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      (requestBody as typeof requestBody & { apiKey: string }).apiKey = apiKey;
    }

    return fetch(`${this.baseUrl}/api/generate-exercise-set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Score answer correctness (45% weight) - MOST CRITICAL
   * This is the deal-breaker criterion
   */
  private scoreAnswerCorrectness(exercise: GeneratedExercise, _testCase: GenerationTestCase): number {
    const questions = exercise.questions || exercise.exercises || [];
    if (questions.length === 0) return 0;

    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach((q) => {
      if ('correctAnswer' in q && q.correctAnswer) {
        // This would need actual Croatian grammar validation
        // For now, assume the answer is correct if it exists and follows basic patterns
        const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
        
        if (typeof answer === 'string' && answer.trim().length > 0) {
          // Basic Croatian validation - contains Croatian characters and reasonable length
          const croatianPattern = /^[a-zA-ZčćžšđČĆŽŠĐ\s-]+$/;
          if (croatianPattern.test(answer) && answer.length >= 2 && answer.length <= 50) {
            correctAnswers++;
          }
        }
      }
    });

    const score = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    
    // Apply heavy penalty for poor performance (deal breaker criterion)
    if (score < 0.7) {
      return score * 0.5; // Heavy penalty for low accuracy
    }
    
    return score;
  }

  /**
   * Score explanation quality (15% weight)
   * Pedagogically sound explanations in Croatian
   */
  private scoreExplanationQuality(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    const questions = exercise.questions || exercise.exercises || [];
    if (questions.length === 0) return 0;

    let totalExplanationScore = 0;
    let questionsWithExplanations = 0;

    questions.forEach((q) => {
      if ('explanation' in q && q.explanation && typeof q.explanation === 'string') {
        questionsWithExplanations++;
        
        const explanation = q.explanation.trim();
        let explanationScore = 0;

        // Basic quality criteria
        if (explanation.length > 20) explanationScore += 0.3;
        if (explanation.length > 50) explanationScore += 0.2;
        
        // Croatian grammar terminology
        const grammarTerms = ['padež', 'vrijeme', 'rod', 'broj', 'osoba', 'infinitiv', 'prezent', 'aorist', 'imperativ'];
        const hasGrammarTerms = grammarTerms.some(term => explanation.toLowerCase().includes(term));
        if (hasGrammarTerms) explanationScore += 0.2;
        
        // Reasoning indicators
        if (explanation.includes('jer') || explanation.includes('zato što') || explanation.includes('zbog')) {
          explanationScore += 0.2;
        }
        
        // Appropriate for CEFR level
        const expectedQuality = testCase.expectedCriteria.explanationQuality;
        if (expectedQuality === 'excellent' && explanation.length > 80) {
          explanationScore += 0.1;
        }

        totalExplanationScore += Math.min(explanationScore, 1);
      }
    });

    return questionsWithExplanations > 0 ? totalExplanationScore / questionsWithExplanations : 0;
  }

  /**
   * Score exercise design & guideline adherence (15% weight)
   * CEFR level compliance, theme adherence, cultural relevance
   */
  private scoreExerciseDesign(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    let score = 0;
    
    // CEFR level appropriateness (40% of this criterion)
    const cefrScore = this.scoreCefrCompliance(exercise, testCase);
    score += cefrScore * 0.4;
    
    // Theme adherence (30% of this criterion)
    const themeScore = this.scoreThemeAdherence(exercise, testCase);
    score += themeScore * 0.3;
    
    // Cultural relevance (20% of this criterion)
    const culturalScore = this.scoreCulturalRelevance(exercise, testCase);
    score += culturalScore * 0.2;
    
    // Exercise structure and format (10% of this criterion)
    const structureScore = this.scoreExerciseStructure(exercise, testCase);
    score += structureScore * 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Score speed & reliability (15% weight)
   * Response time consistency and error handling
   */
  private scoreSpeedReliability(executionTime: number, testCase: GenerationTestCase): number {
    // Target execution time ranges based on complexity
    const targetTime = this.getTargetExecutionTime(testCase);
    
    let score = 1.0;
    
    // Penalty for slow responses
    if (executionTime > targetTime * 2) {
      score = 0.5; // Heavy penalty for very slow responses
    } else if (executionTime > targetTime * 1.5) {
      score = 0.7; // Moderate penalty for slow responses
    } else if (executionTime > targetTime) {
      score = 0.85; // Light penalty for somewhat slow responses
    }
    
    // Bonus for fast responses (but not too fast to be suspicious)
    if (executionTime < targetTime * 0.5 && executionTime > 1000) {
      score = Math.min(score + 0.1, 1.0);
    }
    
    return score;
  }

  /**
   * Score cost efficiency (10% weight) - Optional
   * Token usage and cost-effectiveness
   */
  private scoreCostEfficiency(tokenUsage: { inputTokens?: number; outputTokens?: number } | undefined, testCase: GenerationTestCase): number | undefined {
    if (!tokenUsage) return undefined;
    
    // This would need actual pricing data from providers
    // For now, return a score based on token efficiency
    const targetTokens = this.getTargetTokenCount(testCase);
    const actualTokens = (tokenUsage.inputTokens || 0) + (tokenUsage.outputTokens || 0);
    
    if (actualTokens === 0) return undefined;
    
    let score = 1.0;
    
    // Penalty for excessive token usage
    if (actualTokens > targetTokens * 2) {
      score = 0.5;
    } else if (actualTokens > targetTokens * 1.5) {
      score = 0.7;
    } else if (actualTokens > targetTokens) {
      score = 0.85;
    }
    
    return score;
  }

  // Helper methods for the new scoring system
  private scoreCefrCompliance(exercise: GeneratedExercise, _testCase: GenerationTestCase): number {
    // This would need sophisticated CEFR vocabulary and grammar analysis
    // For now, return a reasonable default based on structure quality
    const questions = exercise.questions || exercise.exercises || [];
    return questions.length > 0 ? 0.8 : 0;
  }

  private scoreThemeAdherence(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    if (!testCase.request.theme) return 1; // No theme required, perfect score

    const theme = testCase.request.theme.toLowerCase();
    const exerciseText = JSON.stringify(exercise).toLowerCase();

    // Simple keyword matching for theme adherence
    const themeKeywords = this.getThemeKeywords(theme);
    let matchedKeywords = 0;

    themeKeywords.forEach(keyword => {
      if (exerciseText.includes(keyword)) {
        matchedKeywords++;
      }
    });

    return Math.min(matchedKeywords / Math.max(themeKeywords.length * 0.3, 1), 1);
  }

  private scoreCulturalRelevance(exercise: GeneratedExercise, _testCase: GenerationTestCase): number {
    // Check for Croatian cultural context and authenticity
    const exerciseText = JSON.stringify(exercise).toLowerCase();
    
    // Croatian place names, cultural references, typical Croatian contexts
    const culturalIndicators = [
      'zagreb', 'split', 'rijeka', 'dubrovnik', 'pula', 'zadar',
      'kuna', 'euro', 'croatia', 'hrvatska', 'jadran',
      'crkvica', 'tržnica', 'kafić', 'restoran'
    ];
    
    let culturalScore = 0.7; // Base score
    
    const matches = culturalIndicators.filter(indicator => 
      exerciseText.includes(indicator)
    ).length;
    
    if (matches > 0) {
      culturalScore = Math.min(0.7 + (matches * 0.1), 1.0);
    }
    
    return culturalScore;
  }

  private scoreExerciseStructure(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    let score = 0;
    const criteria = testCase.expectedCriteria;
    const questions = exercise.questions || exercise.exercises || [];

    // Check if it has the right structure
    if (exercise.paragraph && questions.length > 0) {
      score += 0.3;
    } else if (questions.length > 0) {
      score += 0.3;
    }

    // Check question count
    if (questions.length >= criteria.minQuestions && questions.length <= criteria.maxQuestions) {
      score += 0.4;
    } else if (questions.length > 0) {
      score += 0.2; // Partial credit
    }

    // Check if questions have required fields
    let validQuestions = 0;
    questions.forEach((q) => {
      if (q && typeof q === 'object') {
        let questionScore = 0;
        if ('id' in q && q.id) questionScore += 0.25;
        if ('correctAnswer' in q && q.correctAnswer) questionScore += 0.25;
        if ('explanation' in q && q.explanation) questionScore += 0.25;
        if (('text' in q && q.text) || ('baseForm' in q && q.baseForm)) questionScore += 0.25;
        
        if (questionScore >= 0.75) validQuestions++;
      }
    });

    if (validQuestions === questions.length) {
      score += 0.3;
    } else if (validQuestions > questions.length / 2) {
      score += 0.2; // Partial credit
    }

    return Math.min(score, 1);
  }

  private getTargetExecutionTime(_testCase: GenerationTestCase): number {
    // Target execution times in milliseconds based on complexity
    const baseTime = 5000; // 5 seconds base
    
    // For now, use a default medium complexity since complexity property doesn't exist
    // This would be enhanced based on actual test case properties
    return baseTime;
  }

  private getTargetTokenCount(testCase: GenerationTestCase): number {
    // Estimate target token count based on exercise type and complexity
    const baseTokens = 1000;
    
    const exerciseType = testCase.request.exerciseType;
    const multipliers: Record<string, number> = {
      'verbTenses': 1.0,
      'nounDeclension': 1.2,
      'verbAspect': 0.8,
      'interrogativePronouns': 0.9
    };
    
    return baseTokens * (multipliers[exerciseType] || 1.0);
  }

  private getThemeKeywords(theme: string): string[] {
    const themeMap: Record<string, string[]> = {
      'food': ['hrana', 'jelo', 'kuhanje', 'restoran', 'kava', 'meso', 'povrće'],
      'cooking': ['kuhanje', 'recept', 'kuhati', 'pržiti', 'kuhinja'],
      'travel': ['putovanje', 'hotel', 'avion', 'vlak', 'auto', 'grad', 'more'],
      'transportation': ['prijevoz', 'avion', 'vlak', 'autobus', 'auto', 'bicikl'],
      'family': ['obitelj', 'mama', 'tata', 'sin', 'kći', 'brat', 'sestra'],
      'relationships': ['odnos', 'prijatelj', 'ljubav', 'brak', 'partner'],
      'work': ['posao', 'rad', 'raditi', 'ured', 'koleg', 'sastanak'],
      'career': ['karijera', 'posao', 'profesija', 'uspjeh', 'napredak'],
      'environmental': ['okoliš', 'priroda', 'zagađenje', 'recikliranje'],
      'science': ['znanost', 'istraživanje', 'eksperiment', 'studij'],
      'climate': ['klima', 'vrijeme', 'temperatura', 'kiša', 'sunce'],
    };

    let keywords: string[] = [];
    Object.keys(themeMap).forEach(key => {
      if (theme.includes(key)) {
        keywords = keywords.concat(themeMap[key]);
      }
    });

    return keywords.length > 0 ? keywords : ['tema', 'sadržaj']; // Fallback
  }

  /**
   * Calculate model performance from individual test results
   */
  async calculateModelPerformance(model: ModelConfig, results: GenerationResult[]): Promise<ModelPerformance> {
    const totalTests = results.length;
    const successfulGenerations = results.filter(r => r.exerciseGenerated).length;
    
    // Calculate average execution time
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = totalTests > 0 ? totalExecutionTime / totalTests : 0;
    
    // Calculate average scores for each criterion
    const successfulResults = results.filter(r => r.exerciseGenerated);
    const criteria = {
      answerCorrectness: 0,
      explanationQuality: 0,
      exerciseDesign: 0,
      speedReliability: 0,
      costEfficiency: undefined as number | undefined,
    };
    
    if (successfulResults.length > 0) {
      criteria.answerCorrectness = successfulResults.reduce((sum, r) => sum + r.answerCorrectness, 0) / successfulResults.length;
      criteria.explanationQuality = successfulResults.reduce((sum, r) => sum + r.explanationQuality, 0) / successfulResults.length;
      criteria.exerciseDesign = successfulResults.reduce((sum, r) => sum + r.exerciseDesign, 0) / successfulResults.length;
      criteria.speedReliability = successfulResults.reduce((sum, r) => sum + r.speedReliability, 0) / successfulResults.length;
      
      const costResults = successfulResults.filter(r => r.costEfficiency !== undefined);
      if (costResults.length > 0) {
        criteria.costEfficiency = costResults.reduce((sum, r) => sum + (r.costEfficiency || 0), 0) / costResults.length;
      }
    }
    
    // Calculate overall score using weighted averages
    const weights = {
      answerCorrectness: 0.45, // 45% - Most critical (deal breaker)
      explanationQuality: 0.15, // 15%
      exerciseDesign: 0.15, // 15%
      speedReliability: 0.15, // 15%
      costEfficiency: 0.10, // 10%
    };

    const overallScore = 
      criteria.answerCorrectness * weights.answerCorrectness +
      criteria.explanationQuality * weights.explanationQuality +
      criteria.exerciseDesign * weights.exerciseDesign +
      criteria.speedReliability * weights.speedReliability +
      (criteria.costEfficiency || 0) * weights.costEfficiency;

    return {
      modelName: model.name,
      provider: model.provider,
      overallScore,
      criteria,
      totalTests,
      successfulGenerations,
      averageExecutionTime,
      results,
    };
  }
}
