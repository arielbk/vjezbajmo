import { describe, it, expect, beforeEach } from 'vitest';
import { CachedExercise, CacheProvider } from '../cache-provider';

// Simple in-memory cache implementation for testing
class TestCache implements CacheProvider {
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

  async getCachedSolution(questionId: string): Promise<{ correctAnswer: string | string[]; explanation: string } | null> {
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

  async setCachedSolution(questionId: string, solution: { correctAnswer: string | string[]; explanation: string }): Promise<void> {
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

  // Test helpers
  getSolutionsCount(): number {
    return this.solutions.size;
  }

  setExpiredSolution(questionId: string): void {
    this.solutions.set(questionId, {
      correctAnswer: 'test',
      explanation: 'test',
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    });
  }
}

describe('CacheProvider', () => {
  let cache: TestCache;

  beforeEach(() => {
    cache = new TestCache();
  });

  describe('Exercise Caching', () => {
    it('should store and retrieve cached exercises', async () => {    const exercise: CachedExercise = {
      id: 'test-1',
      exerciseType: 'verbTenses',
      cefrLevel: 'A2.2',
      theme: 'test-theme',
      data: {
        id: 'test-set-1',
        paragraph: 'This is a test ___.',
        questions: [{
          id: 'q1',
          blankNumber: 1,
          baseForm: 'exercise',
          correctAnswer: 'exercise',
          explanation: 'This is the correct word'
        }]
      },
      createdAt: Date.now()
    };

      const key = 'verb-tenses-a2.2';
      
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

    it('should accumulate multiple exercises for the same key', async () => {    const exercise1: CachedExercise = {
      id: 'test-1',
      exerciseType: 'verbAspect',
      cefrLevel: 'A2.2',
      theme: null,
      data: { exercises: [] },
      createdAt: Date.now()
    };

    const exercise2: CachedExercise = {
      id: 'test-2',
      exerciseType: 'verbAspect',
      cefrLevel: 'A2.2',
      theme: null,
      data: { exercises: [] },
      createdAt: Date.now()
    };

      const key = 'verb-aspect-a2.2';
      
      await cache.setCachedExercise(key, exercise1);
      await cache.setCachedExercise(key, exercise2);

      const retrieved = await cache.getCachedExercises(key);
      expect(retrieved).toHaveLength(2);
      expect(retrieved.map((e: CachedExercise) => e.id)).toEqual(['test-1', 'test-2']);
    });
  });

  describe('Solution Caching', () => {
    it('should store and retrieve solutions', async () => {
      const solution = {
        correctAnswer: 'test answer',
        explanation: 'This is why this answer is correct'
      };

      // Initially null
      const initial = await cache.getCachedSolution('q1');
      expect(initial).toBeNull();

      // Store solution
      await cache.setCachedSolution('q1', solution);

      // Retrieve solution
      const retrieved = await cache.getCachedSolution('q1');
      expect(retrieved).toEqual(solution);
    });

    it('should handle multiple correct answers', async () => {
      const solution = {
        correctAnswer: ['answer1', 'answer2', 'answer3'],
        explanation: 'Multiple forms are acceptable'
      };

      await cache.setCachedSolution('q1', solution);
      const retrieved = await cache.getCachedSolution('q1');
      expect(retrieved?.correctAnswer).toEqual(['answer1', 'answer2', 'answer3']);
    });

    it('should expire old solutions', async () => {
      // Set an expired solution
      cache.setExpiredSolution('q1');

      // Should return null for expired solution
      const retrieved = await cache.getCachedSolution('q1');
      expect(retrieved).toBeNull();
    });

    it('should clean up expired solutions', async () => {
      // Add some solutions
      await cache.setCachedSolution('q1', { correctAnswer: 'recent', explanation: 'recent' });
      cache.setExpiredSolution('q2');

      expect(cache.getSolutionsCount()).toBe(2);

      await cache.cleanup();

      expect(cache.getSolutionsCount()).toBe(1);
      
      // Recent solution should still be there
      const recent = await cache.getCachedSolution('q1');
      expect(recent?.correctAnswer).toBe('recent');
      
      // Expired solution should be gone
      const expired = await cache.getCachedSolution('q2');
      expect(expired).toBeNull();
    });
  });
});
