// Abstract cache provider interface for flexibility
// Allows switching between different cache backends (Vercel KV, Redis, etc.)

import { ParagraphExerciseSet, SentenceExerciseSet, ExerciseType, CefrLevel } from "@/types/exercise";
import { exerciseLogger } from "@/lib/logger";

export interface CachedExercise {
  id: string;
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  theme: string | null;
  data: ParagraphExerciseSet | SentenceExerciseSet;
  createdAt: number;
}

export interface CacheProvider {
  // Exercise caching
  getCachedExercises(key: string): Promise<CachedExercise[]>;
  setCachedExercise(key: string, exercise: CachedExercise): Promise<void>;

  // Enhanced cache invalidation
  invalidateExercise(key: string, exerciseId: string): Promise<void>;
  invalidateAllExercises(key: string): Promise<void>;

  // Cleanup old entries
  cleanup?(): Promise<void>;
}

// In-memory fallback cache (for development/fallback)
class InMemoryCache implements CacheProvider {
  private exercises = new Map<string, CachedExercise[]>();

  async getCachedExercises(key: string): Promise<CachedExercise[]> {
    return this.exercises.get(key) || [];
  }

  async setCachedExercise(key: string, exercise: CachedExercise): Promise<void> {
    const existing = this.exercises.get(key) || [];
    existing.push(exercise);
    this.exercises.set(key, existing);
  }

  async invalidateExercise(key: string, exerciseId: string): Promise<void> {
    const existing = this.exercises.get(key) || [];
    const filtered = existing.filter((ex) => ex.id !== exerciseId);
    this.exercises.set(key, filtered);
  }

  async invalidateAllExercises(key: string): Promise<void> {
    this.exercises.delete(key);
  }

  async cleanup(): Promise<void> {
    // Clean up any old data if needed
    this.exercises.clear();
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
      exerciseLogger.warn("Vercel KV not available, falling back to in-memory cache");
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
      exerciseLogger.error("Failed to get cached exercises", error);
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
      exerciseLogger.error("Failed to cache exercise", error);
    }
  }

  async invalidateExercise(key: string, exerciseId: string): Promise<void> {
    const kv = await this.getKV();
    if (!kv) return;

    try {
      const existing = await this.getCachedExercises(key);
      const filtered = existing.filter((ex) => ex.id !== exerciseId);

      if (filtered.length === 0) {
        await kv.del(`exercises:${key}`);
      } else {
        await kv.set(`exercises:${key}`, filtered, { ex: 7 * 24 * 60 * 60 });
      }
    } catch (error) {
      exerciseLogger.error("Failed to invalidate exercise", error);
    }
  }

  async invalidateAllExercises(key: string): Promise<void> {
    const kv = await this.getKV();
    if (!kv) return;

    try {
      await kv.del(`exercises:${key}`);
    } catch (error) {
      exerciseLogger.error("Failed to invalidate all exercises", error);
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
