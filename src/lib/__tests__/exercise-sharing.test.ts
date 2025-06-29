import { describe, it, expect, beforeEach } from 'vitest';
import { cacheProvider } from '../cache-provider';
import type { CachedExercise } from '../cache-provider';
import type { ExerciseType, CefrLevel } from '@/types/exercise';

describe('Cache Provider - Exercise ID Retrieval', () => {
  beforeEach(async () => {
    // Clean up before each test
    if (cacheProvider.cleanup) {
      await cacheProvider.cleanup();
    }
  });

  it('should retrieve exercise by ID', async () => {
    const mockExercise: CachedExercise = {
      id: 'test-exercise-123',
      exerciseType: 'verbTenses' as ExerciseType,
      cefrLevel: 'A1' as CefrLevel,
      theme: 'test-theme',
      data: {
        id: 'data-id-456',
        paragraph: 'Test paragraph',
        questions: []
      },
      createdAt: Date.now()
    };

    // Cache the exercise
    await cacheProvider.setCachedExercise('test-key', mockExercise);

    // Retrieve by cache ID
    const retrievedByCacheId = await cacheProvider.getExerciseById('test-exercise-123');
    expect(retrievedByCacheId).toEqual(mockExercise);

    // Retrieve by data ID
    const retrievedByDataId = await cacheProvider.getExerciseById('data-id-456');
    expect(retrievedByDataId).toEqual(mockExercise);
  });

  it('should return null for non-existent exercise ID', async () => {
    const result = await cacheProvider.getExerciseById('non-existent-id');
    expect(result).toBeNull();
  });

  it('should search across multiple cache keys', async () => {
    const exercise1: CachedExercise = {
      id: 'ex1',
      exerciseType: 'verbTenses' as ExerciseType,
      cefrLevel: 'A1' as CefrLevel,
      theme: null,
      data: { id: 'data1', paragraph: 'Test 1', questions: [] },
      createdAt: Date.now()
    };

    const exercise2: CachedExercise = {
      id: 'ex2',
      exerciseType: 'nounDeclension' as ExerciseType,
      cefrLevel: 'A2.1' as CefrLevel,
      theme: 'family',
      data: { id: 'data2', paragraph: 'Test 2', questions: [] },
      createdAt: Date.now()
    };

    // Cache exercises under different keys
    await cacheProvider.setCachedExercise('key1', exercise1);
    await cacheProvider.setCachedExercise('key2', exercise2);

    // Should find exercises from different cache keys
    const found1 = await cacheProvider.getExerciseById('ex1');
    const found2 = await cacheProvider.getExerciseById('data2');
    
    expect(found1).toEqual(exercise1);
    expect(found2).toEqual(exercise2);
  });
});
