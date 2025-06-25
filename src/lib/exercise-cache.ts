// Legacy export for backward compatibility
// Now uses the new cache provider system

import { cacheProvider } from "./cache-provider";

interface CachedSolution {
  correctAnswer: string | string[];
  explanation: string;
  timestamp: number;
}

class ExerciseCache {
  async set(questionId: string, solution: Omit<CachedSolution, "timestamp">) {
    await cacheProvider.setCachedSolution(questionId, solution);
  }

  async get(questionId: string): Promise<CachedSolution | undefined> {
    const solution = await cacheProvider.getCachedSolution(questionId);
    if (!solution) return undefined;

    return {
      ...solution,
      timestamp: Date.now(), // Mock timestamp for backward compatibility
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(_questionId: string): boolean {
    // Note: The new cache provider doesn't expose delete method
    // Solutions expire automatically
    console.warn("Delete operation not supported in new cache provider");
    return false;
  }

  // Clean up old entries (now handled by cache provider)
  cleanup() {
    console.warn("Cleanup is now handled automatically by the cache provider");
  }
}

// Singleton instance for backward compatibility
export const exerciseCache = new ExerciseCache();
