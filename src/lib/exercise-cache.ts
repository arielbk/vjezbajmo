// Shared cache for exercise solutions
// In production, this would be replaced with Redis or similar

interface CachedSolution {
  correctAnswer: string | string[];
  explanation: string;
  timestamp: number;
}

class ExerciseCache {
  private cache = new Map<string, CachedSolution>();

  set(questionId: string, solution: Omit<CachedSolution, "timestamp">) {
    this.cache.set(questionId, {
      ...solution,
      timestamp: Date.now(),
    });
  }

  get(questionId: string): CachedSolution | undefined {
    return this.cache.get(questionId);
  }

  delete(questionId: string): boolean {
    return this.cache.delete(questionId);
  }

  // Clean up old entries (older than 1 hour)
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const exerciseCache = new ExerciseCache();

// Set up periodic cleanup
if (typeof window === "undefined") {
  // Only run cleanup on server
  setInterval(() => {
    exerciseCache.cleanup();
  }, 5 * 60 * 1000); // Check every 5 minutes
}
