import { NextRequest, NextResponse } from "next/server";
import { cacheProvider, generateCacheKey } from "@/lib/cache-provider";
import { ExerciseType, CefrLevel } from "@/types/exercise";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "overview";

    if (action === "overview") {
      // Get cache overview
      const cacheStats = await getCacheOverview();
      return NextResponse.json(cacheStats);
    }

    if (action === "details") {
      // Get detailed cache contents
      const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "interrogativePronouns"];
      const cefrLevels: CefrLevel[] = ["A1", "A2.1", "A2.2", "B1.1"];

      const cacheDetails = await getCacheDetails(exerciseTypes, cefrLevels);
      return NextResponse.json(cacheDetails);
    }

    if (action === "test") {
      // Test cache operations
      const testResults = await testCacheOperations();
      return NextResponse.json(testResults);
    }

    return NextResponse.json({ error: "Invalid action parameter. Use: overview, details, or test" }, { status: 400 });
  } catch (error) {
    console.error("Cache diagnostics error:", error);
    return NextResponse.json(
      { error: "Failed to get cache diagnostics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function getCacheOverview() {
  const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "interrogativePronouns"];
  const cefrLevels: CefrLevel[] = ["A1", "A2.1", "A2.2", "B1.1"];
  const themes = [undefined, "sports", "food", "travel", "family"];

  let totalCachedExercises = 0;
  const cacheByType: Record<string, number> = {};

  for (const exerciseType of exerciseTypes) {
    let typeTotal = 0;
    for (const cefrLevel of cefrLevels) {
      for (const theme of themes) {
        const cacheKey = generateCacheKey(exerciseType, cefrLevel, theme);
        try {
          const cachedExercises = await cacheProvider.getCachedExercises(cacheKey);
          const count = cachedExercises.length;
          typeTotal += count;
          totalCachedExercises += count;
        } catch (error) {
          console.error(`Error getting cache for ${cacheKey}:`, error);
        }
      }
    }
    cacheByType[exerciseType] = typeTotal;
  }

  return {
    timestamp: new Date().toISOString(),
    totalCachedExercises,
    cacheByType,
    environment: {
      hasKvUrl: !!process.env.KV_REST_API_URL,
      hasKvToken: !!process.env.KV_REST_API_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    },
  };
}

async function getCacheDetails(exerciseTypes: ExerciseType[], cefrLevels: CefrLevel[]) {
  const details: Record<string, Record<string, Record<string, unknown>>> = {};

  for (const exerciseType of exerciseTypes) {
    details[exerciseType] = {};

    for (const cefrLevel of cefrLevels) {
      const themes = [undefined, "sports", "food"];

      for (const theme of themes) {
        const cacheKey = generateCacheKey(exerciseType, cefrLevel, theme);
        try {
          const cachedExercises = await cacheProvider.getCachedExercises(cacheKey);
          const cacheInfo = {
            key: cacheKey,
            count: cachedExercises.length,
            exercises: cachedExercises.map((ex) => ({
              id: ex.id,
              dataId: ex.data.id,
              createdAt: new Date(ex.createdAt).toISOString(),
              theme: ex.theme,
              exerciseType: ex.exerciseType,
              cefrLevel: ex.cefrLevel,
            })),
          };

          const themeKey = theme || "default";
          if (!details[exerciseType][cefrLevel]) {
            details[exerciseType][cefrLevel] = {};
          }
          details[exerciseType][cefrLevel][themeKey] = cacheInfo;
        } catch (error) {
          const themeKey = theme || "default";
          if (!details[exerciseType][cefrLevel]) {
            details[exerciseType][cefrLevel] = {};
          }
          details[exerciseType][cefrLevel][themeKey] = {
            key: cacheKey,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    }
  }

  return details;
}

async function testCacheOperations() {
  const testExercise = {
    id: `test-${Date.now()}`,
    exerciseType: "verbTenses" as ExerciseType,
    cefrLevel: "A2.2" as CefrLevel,
    theme: "test-theme",
    data: {
      id: `test-data-${Date.now()}`,
      paragraph: "This is a test exercise for ___1___ (testing) cache functionality.",
      questions: [
        {
          id: "test-q1",
          blankNumber: 1,
          baseForm: "testing",
          correctAnswer: "testing",
          explanation: "This is a test explanation",
        },
      ],
    },
    createdAt: Date.now(),
  };

  const testKey = generateCacheKey(testExercise.exerciseType, testExercise.cefrLevel, testExercise.theme);

  try {
    // Test 1: Get initial cache state
    const initialCache = await cacheProvider.getCachedExercises(testKey);

    // Test 2: Add exercise to cache
    await cacheProvider.setCachedExercise(testKey, testExercise);

    // Test 3: Retrieve exercise from cache
    const cacheAfterSet = await cacheProvider.getCachedExercises(testKey);

    // Test 4: Invalidate exercise
    await cacheProvider.invalidateExercise(testKey, testExercise.id);

    // Test 5: Check cache after invalidation
    const cacheAfterInvalidation = await cacheProvider.getCachedExercises(testKey);

    return {
      testKey,
      results: {
        initialCacheCount: initialCache.length,
        cacheAfterSetCount: cacheAfterSet.length,
        cacheAfterInvalidationCount: cacheAfterInvalidation.length,
        testExerciseWasCached: cacheAfterSet.some((ex) => ex.id === testExercise.id),
        testExerciseWasRemoved: !cacheAfterInvalidation.some((ex) => ex.id === testExercise.id),
      },
      success: true,
    };
  } catch (error) {
    return {
      testKey,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    };
  }
}
