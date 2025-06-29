import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { ParagraphExerciseSet, SentenceExercise } from "@/types/exercise";
import { cacheProvider, generateCacheKey, CachedExercise } from "@/lib/cache-provider";
import { generatePrompt } from "@/lib/prompts";

// Cache static exercise generation for 1 hour
export const revalidate = 3600;

// Validation schema - now includes userCompletedExercises and forceRegenerate
const generateExerciseSchema = z.object({
  exerciseType: z.enum(["verbTenses", "nounDeclension", "verbAspect", "interrogativePronouns"]),
  cefrLevel: z.enum(["A1", "A2.1", "A2.2", "B1.1"]),
  provider: z.enum(["openai", "anthropic"]).optional(),
  apiKey: z.string().optional(),
  theme: z.string().optional(),
  userCompletedExercises: z.array(z.string()).optional(),
  forceRegenerate: z.boolean().optional(),
});

// Interfaces for AI responses
interface AIQuestion {
  id?: string;
  blankNumber: number;
  baseForm: string;
  correctAnswer: string | string[]; // Support multiple answers
  explanation: string;
  isPlural?: boolean; // Indicates if plural form is required
}

interface AIParagraphResponse {
  id?: string;
  paragraph: string;
  questions: AIQuestion[];
}

interface AIExercise {
  id?: string;
  text: string;
  correctAnswer: string | string[]; // Support multiple answers
  explanation: string;
  isPlural?: boolean; // Indicates if plural form is required
  // Verb aspect specific properties
  exerciseSubType?: string;
  options?: {
    imperfective: string;
    perfective: string;
  };
  correctAspect?: "imperfective" | "perfective";
}

interface AISentenceResponse {
  exercises: AIExercise[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseType, cefrLevel, provider, apiKey, theme, userCompletedExercises, forceRegenerate } =
      generateExerciseSchema.parse(body);

    // Determine which API key and provider to use
    const effectiveApiKey = apiKey || process.env.SITE_API_KEY;
    const effectiveProvider = provider || (process.env.SITE_API_PROVIDER as "openai" | "anthropic") || "openai";

    console.log("API Debug:", {
      hasApiKey: !!effectiveApiKey,
      provider: effectiveProvider,
      apiKeyPrefix: effectiveApiKey?.substring(0, 10) + "...",
      exerciseType,
      cefrLevel,
      theme,
      userCompletedCount: userCompletedExercises?.length || 0,
      userCompletedIds: userCompletedExercises,
      forceRegenerate,
    });

    if (!effectiveApiKey) {
      return NextResponse.json({ error: "No API key available" }, { status: 400 });
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey(exerciseType, cefrLevel, theme);

    // Skip cache if forceRegenerate is true
    if (!forceRegenerate) {
      // Try to serve from cache first
      console.log("Generated cache key:", cacheKey);

      const cachedExercises = await cacheProvider.getCachedExercises(cacheKey);
      console.log("Raw cached exercises:", cachedExercises.length);

      // Filter out exercises the user has already completed
      // Check against the actual exercise data ID, not the cache wrapper ID
      const completedSet = new Set(userCompletedExercises || []);
      const availableExercises = cachedExercises.filter((exercise) => {
        // Get the actual exercise set ID from the data - this should always be the data.id
        const exerciseDataId = exercise.data.id;
        const isCompleted = completedSet.has(exerciseDataId);

        console.log("Filtering exercise:", {
          cacheId: exercise.id,
          dataId: exerciseDataId,
          isCompleted,
          completedSet: Array.from(completedSet),
        });

        return !isCompleted;
      });

      console.log("Cache filtering debug:", {
        totalCached: cachedExercises.length,
        completedCount: completedSet.size,
        availableAfterFilter: availableExercises.length,
        completedIds: Array.from(completedSet),
        cachedIds: cachedExercises.map((ex) => ({
          cacheId: ex.id,
          dataId: ex.data.id,
        })),
      });

      if (availableExercises.length > 0) {
        // Serve from cache
        console.log(`Serving from cache: ${availableExercises.length} available exercises`);
        const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];

        console.log("Selected cached exercise:", {
          cacheId: selectedExercise.id,
          dataId: selectedExercise.data.id,
          exerciseType: selectedExercise.exerciseType,
        });

        return NextResponse.json(selectedExercise.data);
      }
    }

    // No suitable cached exercises or force regeneration requested, generate new ones
    console.log(
      forceRegenerate ? "Force regeneration requested..." : "No suitable cached exercises found, generating new ones..."
    );

    // Route to appropriate provider
    let response;
    if (effectiveProvider === "openai") {
      response = await generateWithOpenAI(exerciseType, cefrLevel, effectiveApiKey, theme);
    } else if (effectiveProvider === "anthropic") {
      response = await generateWithAnthropic(exerciseType, cefrLevel, effectiveApiKey, theme);
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Cache the newly generated exercise
    const responseData = await response.json();
    const cachedExercise: CachedExercise = {
      id: uuidv4(),
      exerciseType,
      cefrLevel,
      theme: theme || null,
      data: responseData,
      createdAt: Date.now(),
    };

    console.log("Caching new exercise:", {
      cacheId: cachedExercise.id,
      dataId: responseData.id,
      cacheKey,
      exerciseType,
      cefrLevel,
      theme: theme || "default",
    });

    await cacheProvider.setCachedExercise(cacheKey, cachedExercise);
    console.log("Exercise cached successfully");

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Exercise generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to generate exercises" }, { status: 500 });
  }
}

async function generateWithOpenAI(exerciseType: string, cefrLevel: string, apiKey: string, theme?: string) {
  // OpenAI-specific exercise generation - Updated to support multiple correct answers
  const openai = new OpenAI({ apiKey });

  const prompts = generatePrompt(
    exerciseType as "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns", 
    cefrLevel as "A1" | "A2.1" | "A2.2" | "B1.1", 
    theme
  );

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: prompts.userPrompt },
    ],
    temperature: 2,
    max_tokens: 1500,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return processAIResponse(content, exerciseType);
}

async function generateWithAnthropic(exerciseType: string, cefrLevel: string, apiKey: string, theme?: string) {
  console.log("Anthropic generation started:", { exerciseType, cefrLevel, theme });

  const anthropic = new Anthropic({ apiKey });

  const prompts = generatePrompt(
    exerciseType as "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns", 
    cefrLevel as "A1" | "A2.1" | "A2.2" | "B1.1", 
    theme
  );

  console.log("Sending request to Anthropic...");

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1500,
      temperature: 1,
      system: prompts.systemPrompt,
      messages: [
        {
          role: "user",
          content: prompts.userPrompt,
        },
      ],
    });

    console.log("Received response from Anthropic");
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("No text response from Anthropic");
    }

    return processAIResponse(content.text, exerciseType);
  } catch (error) {
    console.error("Anthropic API error:", error);
    throw error;
  }
}

function processAIResponse(content: string, exerciseType: string) {
  let exerciseData: AIParagraphResponse | AISentenceResponse;
  try {
    exerciseData = JSON.parse(content);
  } catch {
    console.error("Failed to parse AI response:", content);
    throw new Error("Invalid JSON response from AI");
  }

  // Generate UUIDs for questions/exercises
  if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
    const aiData = exerciseData as AIParagraphResponse;
    const exerciseSet: ParagraphExerciseSet = {
      id: uuidv4(),
      paragraph: aiData.paragraph,
      questions: aiData.questions.map((q) => ({
        id: uuidv4(),
        blankNumber: q.blankNumber,
        baseForm: q.baseForm,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isPlural: q.isPlural,
      })),
    };

    return NextResponse.json(exerciseSet);
  } else {
    const aiData = exerciseData as AISentenceResponse;
    const exercises: SentenceExercise[] = aiData.exercises.map((ex: AIExercise) => {
      // Check if this is a verb aspect exercise and preserve the verb aspect properties
      if (exerciseType === "verbAspect" && ex.exerciseSubType === "verb-aspect") {
        return {
          id: uuidv4(),
          text: ex.text,
          exerciseSubType: ex.exerciseSubType,
          options: ex.options,
          correctAspect: ex.correctAspect,
          correctAnswer: ex.correctAnswer,
          explanation: ex.explanation,
          isPlural: ex.isPlural,
        };
      }
      
      // Default sentence exercise format
      return {
        id: uuidv4(),
        text: ex.text,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation,
        isPlural: ex.isPlural,
      };
    });

    // Add a set ID for consistent tracking
    const exerciseSetWithId = {
      id: uuidv4(),
      exercises,
    };

    return NextResponse.json(exerciseSetWithId);
  }
}
