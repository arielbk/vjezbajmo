// Abstract cache provider interface for flexibility
// Allows switching between different cache backends (Vercel KV, Redis, etc.)

import { ParagraphExerciseSet, SentenceExercise, ExerciseType, CefrLevel } from "@/types/exercise";

export interface CachedExercise {
  id: string;
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  theme: string | null;
  data: ParagraphExerciseSet | { exercises: SentenceExercise[] };
  createdAt: number;
}

export interface CacheProvider {
  // Exercise caching
  getCachedExercises(key: string): Promise<CachedExercise[]>;
  setCachedExercise(key: string, exercise: CachedExercise): Promise<void>;

  // Solution caching (for answer validation)
  getCachedSolution(questionId: string): Promise<{ correctAnswer: string | string[]; explanation: string } | null>;
  setCachedSolution(
    questionId: string,
    solution: { correctAnswer: string | string[]; explanation: string }
  ): Promise<void>;

  // Cleanup old entries
  cleanup?(): Promise<void>;
}

// In-memory fallback cache (for development/fallback)
class InMemoryCache implements CacheProvider {
  private exercises = new Map<string, CachedExercise[]>();
  private solutions = new Map<string, { correctAnswer: string | string[]; explanation: string; timestamp: number }>();

  async getCachedExercises(key: string): Promise<CachedExercise[]> {
    return this.exercises.get(key) || [];
  }

  async setCachedExercise(key: string, exercise: CachedExercise): Promise<void> {
    const existing = this.exercises.get(key) || [];
    existing.push(exercise);
    this.exercises.set(key, existing);
  }

  async getCachedSolution(
    questionId: string
  ): Promise<{ correctAnswer: string | string[]; explanation: string } | null> {
    const solution = this.solutions.get(questionId);
    if (!solution) return null;

    // Check if solution is older than 1 hour
    if (Date.now() - solution.timestamp > 60 * 60 * 1000) {
      this.solutions.delete(questionId);
      return null;
    }

    return {
      correctAnswer: solution.correctAnswer,
      explanation: solution.explanation,
    };
  }

  async setCachedSolution(
    questionId: string,
    solution: { correctAnswer: string | string[]; explanation: string }
  ): Promise<void> {
    this.solutions.set(questionId, {
      ...solution,
      timestamp: Date.now(),
    });
  }

  async cleanup(): Promise<void> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, value] of this.solutions.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.solutions.delete(key);
      }
    }
  }
}

// Vercel KV cache implementation
class VercelKVCache implements CacheProvider {
  private kv: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private kvPromise: Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor() {
    // Lazy load Vercel KV to avoid issues in development
    this.kvPromise = this.initializeKV();
  }

  private async initializeKV() {
    try {
      const { kv } = await import("@vercel/kv");
      return kv;
    } catch {
      console.warn("Vercel KV not available, falling back to in-memory cache");
      return null;
    }
  }

  private async getKV() {
    if (!this.kv) {
      this.kv = await this.kvPromise;
    }
    return this.kv;
  }

  async getCachedExercises(key: string): Promise<CachedExercise[]> {
    const kv = await this.getKV();
    if (!kv) return [];

    try {
      const exercises = await kv.get(`exercises:${key}`);
      return exercises || [];
    } catch (error) {
      console.error("Failed to get cached exercises:", error);
      return [];
    }
  }

  async setCachedExercise(key: string, exercise: CachedExercise): Promise<void> {
    const kv = await this.getKV();
    if (!kv) return;

    try {
      const existing = await this.getCachedExercises(key);
      existing.push(exercise);

      // Store with 7-day expiration
      await kv.set(`exercises:${key}`, existing, { ex: 7 * 24 * 60 * 60 });
    } catch (error) {
      console.error("Failed to cache exercise:", error);
    }
  }

  async getCachedSolution(
    questionId: string
  ): Promise<{ correctAnswer: string | string[]; explanation: string } | null> {
    const kv = await this.getKV();
    if (!kv) return null;

    try {
      const solution = await kv.get(`solution:${questionId}`);
      return solution;
    } catch (error) {
      console.error("Failed to get cached solution:", error);
      return null;
    }
  }

  async setCachedSolution(
    questionId: string,
    solution: { correctAnswer: string | string[]; explanation: string }
  ): Promise<void> {
    const kv = await this.getKV();
    if (!kv) return;

    try {
      // Store with 1-hour expiration
      await kv.set(`solution:${questionId}`, solution, { ex: 60 * 60 });
    } catch (error) {
      console.error("Failed to cache solution:", error);
    }
  }
}

// Factory to create cache provider based on environment
export function createCacheProvider(): CacheProvider {
  // In production with Vercel KV environment variables, use Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new VercelKVCache();
  }

  // Fallback to in-memory cache
  return new InMemoryCache();
}

// Singleton instance
export const cacheProvider = createCacheProvider();

// Utility function to generate cache key
export function generateCacheKey(exerciseType: ExerciseType, cefrLevel: CefrLevel, theme?: string): string {
  return `${exerciseType}:${cefrLevel}:${theme || "default"}`;
}
