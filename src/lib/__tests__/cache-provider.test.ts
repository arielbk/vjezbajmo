import { describe, it, expect, beforeEach } from "vitest";
import { CachedExercise, CacheProvider } from "../cache-provider";

// Simple in-memory cache implementation for testing
class TestCache implements CacheProvider {
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
    this.exercises.clear();
  }

  // Test helpers
  getExercisesCount(): number {
    return Array.from(this.exercises.values()).reduce((total, exercises) => total + exercises.length, 0);
  }
}

describe("CacheProvider", () => {
  let cache: TestCache;

  beforeEach(() => {
    cache = new TestCache();
  });

  describe("Exercise Caching", () => {
    it("should store and retrieve cached exercises", async () => {
      const exercise: CachedExercise = {
        id: "test-1",
        exerciseType: "verbTenses",
        cefrLevel: "A2.2",
        theme: "test-theme",
        data: {
          id: "test-set-1",
          paragraph: "This is a test ___.",
          questions: [
            {
              id: "q1",
              blankNumber: 1,
              baseForm: "exercise",
              correctAnswer: "exercise",
              explanation: "This is the correct word",
            },
          ],
        },
        createdAt: Date.now(),
      };

      const key = "verb-tenses-a2.2";

      // Initially empty
      const initial = await cache.getCachedExercises(key);
      expect(initial).toHaveLength(0);

      // Store exercise
      await cache.setCachedExercise(key, exercise);

      // Retrieve exercise
      const retrieved = await cache.getCachedExercises(key);
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toEqual(exercise);
    });

    it("should accumulate multiple exercises for the same key", async () => {
      const exercise1: CachedExercise = {
        id: "test-1",
        exerciseType: "verbAspect",
        cefrLevel: "A2.2",
        theme: null,
        data: { id: "set-1", exercises: [] },
        createdAt: Date.now(),
      };

      const exercise2: CachedExercise = {
        id: "test-2",
        exerciseType: "verbAspect",
        cefrLevel: "A2.2",
        theme: null,
        data: { id: "set-2", exercises: [] },
        createdAt: Date.now(),
      };

      const key = "verb-aspect-a2.2";

      await cache.setCachedExercise(key, exercise1);
      await cache.setCachedExercise(key, exercise2);

      const retrieved = await cache.getCachedExercises(key);
      expect(retrieved).toHaveLength(2);
      expect(retrieved.map((e: CachedExercise) => e.id)).toEqual(["test-1", "test-2"]);
    });
  });

  describe("Exercise Invalidation", () => {
    it("should invalidate specific exercises", async () => {
      const exercise1: CachedExercise = {
        id: "test-1",
        exerciseType: "verbTenses",
        cefrLevel: "A2.2",
        theme: "test-theme",
        data: {
          id: "test-set-1",
          paragraph: "This is a test ___.",
          questions: [
            {
              id: "q1",
              blankNumber: 1,
              baseForm: "exercise",
              correctAnswer: "exercise",
              explanation: "This is the correct word",
            },
          ],
        },
        createdAt: Date.now(),
      };

      const exercise2: CachedExercise = {
        id: "test-2",
        exerciseType: "verbTenses",
        cefrLevel: "A2.2",
        theme: "test-theme",
        data: {
          id: "test-set-2",
          paragraph: "Another test ___.",
          questions: [
            {
              id: "q2",
              blankNumber: 1,
              baseForm: "example",
              correctAnswer: "example",
              explanation: "This is another example",
            },
          ],
        },
        createdAt: Date.now(),
      };

      const key = "verb-tenses-a2.2";

      // Add exercises
      await cache.setCachedExercise(key, exercise1);
      await cache.setCachedExercise(key, exercise2);

      let exercises = await cache.getCachedExercises(key);
      expect(exercises).toHaveLength(2);

      // Invalidate one exercise
      await cache.invalidateExercise(key, "test-1");

      exercises = await cache.getCachedExercises(key);
      expect(exercises).toHaveLength(1);
      expect(exercises[0].id).toBe("test-2");
    });

    it("should invalidate all exercises for a key", async () => {
      const exercise: CachedExercise = {
        id: "test-1",
        exerciseType: "verbTenses",
        cefrLevel: "A2.2",
        theme: "test-theme",
        data: {
          id: "test-set-1",
          paragraph: "This is a test ___.",
          questions: [
            {
              id: "q1",
              blankNumber: 1,
              baseForm: "exercise",
              correctAnswer: "exercise",
              explanation: "This is the correct word",
            },
          ],
        },
        createdAt: Date.now(),
      };

      const key = "verb-tenses-a2.2";

      // Add exercise
      await cache.setCachedExercise(key, exercise);

      let exercises = await cache.getCachedExercises(key);
      expect(exercises).toHaveLength(1);

      // Invalidate all exercises
      await cache.invalidateAllExercises(key);

      exercises = await cache.getCachedExercises(key);
      expect(exercises).toHaveLength(0);
    });

    it("should clean up all cached data", async () => {
      const exercise: CachedExercise = {
        id: "test-1",
        exerciseType: "verbTenses",
        cefrLevel: "A2.2",
        theme: "test-theme",
        data: {
          id: "test-set-1",
          paragraph: "This is a test ___.",
          questions: [
            {
              id: "q1",
              blankNumber: 1,
              baseForm: "exercise",
              correctAnswer: "exercise",
              explanation: "This is the correct word",
            },
          ],
        },
        createdAt: Date.now(),
      };

      await cache.setCachedExercise("key1", exercise);
      await cache.setCachedExercise("key2", exercise);

      expect(cache.getExercisesCount()).toBe(2);

      await cache.cleanup();

      expect(cache.getExercisesCount()).toBe(0);
    });
  });
});
