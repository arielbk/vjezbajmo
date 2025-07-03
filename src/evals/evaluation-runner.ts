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
  structureScore: number; // 0-1
  contentScore: number; // 0-1
  explanationScore: number; // 0-1
  themeScore: number; // 0-1 (only if theme specified)
  cefrScore: number; // 0-1
  overallScore: number; // 0-1
  errors: string[];
  generatedExercise?: GeneratedExercise;
  executionTime: number; // milliseconds
}

export interface ModelPerformance {
  modelName: string;
  overallScore: number;
  structureScore: number;
  contentScore: number;
  explanationScore: number;
  themeScore: number;
  cefrScore: number;
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

    // Calculate aggregate scores
    const successfulResults = results.filter(r => r.exerciseGenerated);
    const totalTests = results.length;
    const successfulGenerations = successfulResults.length;

    const overallScore = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.overallScore, 0) / successfulResults.length
      : 0;

    const structureScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.structureScore, 0) / successfulResults.length
      : 0;

    const contentScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.contentScore, 0) / successfulResults.length
      : 0;

    const explanationScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.explanationScore, 0) / successfulResults.length
      : 0;

    const themeScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.themeScore, 0) / successfulResults.length
      : 0;

    const cefrScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.cefrScore, 0) / successfulResults.length
      : 0;

    const averageExecutionTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
      : 0;

    return {
      modelName: model.name,
      overallScore,
      structureScore,
      contentScore,
      explanationScore,
      themeScore,
      cefrScore,
      totalTests,
      successfulGenerations,
      averageExecutionTime,
      results,
    };
  }

  private async runSingleTest(model: ModelConfig, testCase: GenerationTestCase): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      testCaseId: testCase.id,
      exerciseGenerated: false,
      structureScore: 0,
      contentScore: 0,
      explanationScore: 0,
      themeScore: 0,
      cefrScore: 0,
      overallScore: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      // Generate exercise using the actual API
      const exerciseResponse = await this.generateExercise(model, testCase);
      
      if (!exerciseResponse.ok) {
        result.errors.push(`API error: ${exerciseResponse.status} ${exerciseResponse.statusText}`);
        return result;
      }

      const generatedExercise = await exerciseResponse.json();
      result.generatedExercise = generatedExercise;
      result.exerciseGenerated = true;

      // Score the generated exercise against the test criteria
      result.structureScore = this.scoreStructure(generatedExercise, testCase);
      result.contentScore = this.scoreContent(generatedExercise, testCase);
      result.explanationScore = this.scoreExplanations(generatedExercise, testCase);
      result.themeScore = this.scoreTheme(generatedExercise, testCase);
      result.cefrScore = this.scoreCefrLevel(generatedExercise, testCase);

      // Calculate overall score (weighted average)
      const weights = {
        structure: 0.25,
        content: 0.25,
        explanation: 0.20,
        theme: testCase.request.theme ? 0.15 : 0,
        cefr: 0.15,
        // Redistribute theme weight if no theme specified
      };

      if (!testCase.request.theme) {
        weights.content += 0.075;
        weights.cefr += 0.075;
      }

      result.overallScore = 
        result.structureScore * weights.structure +
        result.contentScore * weights.content +
        result.explanationScore * weights.explanation +
        result.themeScore * weights.theme +
        result.cefrScore * weights.cefr;

    } catch (error) {
      result.errors.push(`Exception: ${error instanceof Error ? error.message : String(error)}`);
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

  private scoreStructure(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    let score = 0;
    const criteria = testCase.expectedCriteria;

    // Check if exercise has required structure
    if (!exercise || typeof exercise !== 'object') {
      return 0;
    }

    // Check for ID
    if (exercise.id) score += 0.2;

    // Check for questions/exercises array
    const questions = exercise.questions || exercise.exercises;
    if (Array.isArray(questions)) {
      score += 0.3;

      // Check question count
      if (questions.length >= criteria.minQuestions && questions.length <= criteria.maxQuestions) {
        score += 0.2;
      } else if (questions.length > 0) {
        score += 0.1; // Partial credit
      }

      // Check if questions have required fields
      let validQuestions = 0;
      questions.forEach((q) => {
        if (q && typeof q === 'object') {
          let questionScore = 0;
          if ('id' in q && q.id) questionScore += 0.25;
          if (('blankNumber' in q && q.blankNumber) || ('id' in q && q.id)) questionScore += 0.25;
          if (('text' in q && q.text) || ('baseForm' in q && q.baseForm)) questionScore += 0.25;
          if ('correctAnswer' in q && q.correctAnswer) questionScore += 0.25;
          if ('explanation' in q && q.explanation) questionScore += 0.25;
          
          if (questionScore >= 0.75) validQuestions++;
        }
      });

      if (validQuestions === questions.length) {
        score += 0.3;
      } else if (validQuestions > questions.length / 2) {
        score += 0.2; // Partial credit
      } else if (validQuestions > 0) {
        score += 0.1; // Minimal credit
      }
    }

    return Math.min(score, 1);
  }

  private scoreContent(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    let score = 0;
    const questions = exercise.questions || exercise.exercises || [];

    if (questions.length === 0) return 0;

    // Check grammar accuracy (simplified heuristic)
    const grammarScore = 0.8; // Default assumption, would need actual Croatian grammar validation
    
    // Check vocabulary appropriateness for CEFR level
    const vocabularyScore = 0.8; // Default assumption, would need CEFR vocabulary lists

    // Check exercise type specific criteria
    const typeSpecificScore = this.scoreExerciseTypeSpecific(exercise, testCase);

    score = (grammarScore + vocabularyScore + typeSpecificScore) / 3;

    return Math.min(score, 1);
  }

  private scoreExplanations(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    const questions = exercise.questions || exercise.exercises || [];
    if (questions.length === 0) return 0;

    let totalExplanationScore = 0;
    let questionsWithExplanations = 0;

    questions.forEach((q) => {
      if ('explanation' in q && q.explanation && typeof q.explanation === 'string') {
        questionsWithExplanations++;
        
        const explanation = q.explanation.trim();
        let explanationScore = 0;

        // Basic criteria
        if (explanation.length > 10) explanationScore += 0.3;
        if (explanation.length > 50) explanationScore += 0.2;
        
        // Quality criteria based on expected level
        const expectedQuality = testCase.expectedCriteria.explanationQuality;
        if (expectedQuality === 'basic' && explanation.length > 20) {
          explanationScore += 0.5;
        } else if (expectedQuality === 'good' && explanation.length > 40) {
          explanationScore += 0.4;
          if (explanation.includes('jer') || explanation.includes('zato što')) {
            explanationScore += 0.1; // Contains reasoning
          }
        } else if (expectedQuality === 'excellent' && explanation.length > 60) {
          explanationScore += 0.3;
          if (explanation.includes('jer') || explanation.includes('zato što')) {
            explanationScore += 0.1;
          }
          if (explanation.includes('primjer') || explanation.includes('slično')) {
            explanationScore += 0.1; // Contains examples
          }
        }

        totalExplanationScore += Math.min(explanationScore, 1);
      }
    });

    if (questionsWithExplanations === 0) return 0;

    return totalExplanationScore / questionsWithExplanations;
  }

  private scoreTheme(exercise: GeneratedExercise, testCase: GenerationTestCase): number {
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

  private scoreCefrLevel(_exercise: GeneratedExercise, _testCase: GenerationTestCase): number {
    // This would require sophisticated analysis of vocabulary and grammar complexity
    // For now, return a default score assuming the model followed instructions
    return 0.8;
  }

  private scoreExerciseTypeSpecific(_exercise: GeneratedExercise, testCase: GenerationTestCase): number {
    const typeSpecific = testCase.expectedCriteria.exerciseTypeSpecific;
    if (!typeSpecific) return 0.8;

    const score = 0.8; // Base score

    // This would need specific logic for each exercise type
    // For now, return the base score
    return score;
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
}
