import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { ParagraphExerciseSet, SentenceExercise, ExerciseType, CefrLevel } from "@/types/exercise";
import { cacheProvider, generateCacheKey, CachedExercise } from "@/lib/cache-provider";
import { generatePrompt } from "@/lib/prompts";
import { validateExerciseResponse } from "@/lib/exercise-schemas";
import { exerciseLogger } from "@/lib/logger";

// Cache static exercise generation for 1 hour
export const revalidate = 3600;

// Validation schema - now includes userCompletedExercises and forceRegenerate
const generateExerciseSchema = z.object({
  exerciseType: z.enum(["verbTenses", "nounDeclension", "verbAspect", "relativePronouns"]),
  cefrLevel: z.enum(["A1", "A2.1", "A2.2", "B1.1"]),
  provider: z.enum(["openai", "anthropic"]).optional(),
  apiKey: z.string().optional(),
  theme: z.string().optional(),
  userCompletedExercises: z.array(z.string()).optional(),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let exerciseType: ExerciseType = "verbTenses";
  let cefrLevel: CefrLevel = "A1";
  let effectiveProvider: string = "unknown";

  try {
    const body = await request.json();
    const parsed = generateExerciseSchema.parse(body);
    exerciseType = parsed.exerciseType;
    cefrLevel = parsed.cefrLevel;
    const { provider, apiKey, theme, userCompletedExercises, forceRegenerate } = parsed;

    // Check authentication - require sign-in if no API key is provided
    if (!apiKey) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required. Please sign in or provide your own API key to generate exercises." },
          { status: 401 }
        );
      }
    }

    // Determine which API key and provider to use
    effectiveProvider = provider || (process.env.SITE_API_PROVIDER as "openai" | "anthropic") || "openai";
    let effectiveApiKey = apiKey;
    if (!effectiveApiKey) {
      // Fall back to environment variables based on provider
      if (effectiveProvider === "openai") {
        effectiveApiKey = process.env.OPENAI_API_KEY || process.env.SITE_API_KEY;
      } else {
        effectiveApiKey = process.env.ANTHROPIC_API_KEY || process.env.SITE_API_KEY;
      }
    }

    exerciseLogger.api.request("POST", "/api/generate-exercise-set", {
      hasApiKey: !!effectiveApiKey,
      provider: effectiveProvider,
      exerciseType,
      cefrLevel,
      theme,
      userCompletedCount: userCompletedExercises?.length || 0,
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
      exerciseLogger.debug("Generated cache key", { cacheKey });

      const cachedExercises = await cacheProvider.getCachedExercises(cacheKey);
      exerciseLogger.debug("Retrieved cached exercises", { count: cachedExercises.length, cacheKey });

      // Filter out exercises the user has already completed
      // Check against the actual exercise data ID, not the cache wrapper ID
      const completedSet = new Set(userCompletedExercises || []);
      const availableExercises = cachedExercises.filter((exercise) => {
        // Get the actual exercise set ID from the data - this should always be the data.id
        const exerciseDataId = exercise.data.id;
        const isCompleted = completedSet.has(exerciseDataId);

        exerciseLogger.debug("Filtering cached exercise", {
          cacheId: exercise.id,
          dataId: exerciseDataId,
          isCompleted,
        });

        return !isCompleted;
      });

      exerciseLogger.debug("Cache filtering results", {
        totalCached: cachedExercises.length,
        completedCount: completedSet.size,
        availableAfterFilter: availableExercises.length,
      });

      if (availableExercises.length > 0) {
        // Serve from cache
        const selectedExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];

        exerciseLogger.cache.hit(cacheKey, availableExercises.length);
        exerciseLogger.debug("Selected cached exercise", {
          cacheId: selectedExercise.id,
          dataId: selectedExercise.data.id,
          exerciseType: selectedExercise.exerciseType,
        });

        return NextResponse.json(selectedExercise.data);
      }
    }

    // No suitable cached exercises or force regeneration requested, generate new ones
    const reason = forceRegenerate ? "force_regeneration" : "no_suitable_cache";
    exerciseLogger.cache.miss(cacheKey, reason);
    exerciseLogger.exerciseGeneration.start(exerciseType, cefrLevel, effectiveProvider, theme);

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

    exerciseLogger.debug("Caching new exercise", {
      cacheId: cachedExercise.id,
      dataId: responseData.id,
      cacheKey,
      exerciseType,
      cefrLevel,
      theme: theme || "default",
    });

    await cacheProvider.setCachedExercise(cacheKey, cachedExercise);
    exerciseLogger.cache.store(cacheKey, responseData.id);
    exerciseLogger.exerciseGeneration.success(exerciseType, cefrLevel, effectiveProvider, responseData.id);

    return NextResponse.json(responseData);
  } catch (error) {
    exerciseLogger.exerciseGeneration.error(exerciseType, cefrLevel, effectiveProvider, error as Error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to generate exercises" }, { status: 500 });
  }
}

async function generateWithOpenAI(exerciseType: string, cefrLevel: string, apiKey: string, theme?: string) {
  const openai = new OpenAI({ apiKey });

  const prompts = generatePrompt(
    exerciseType as "verbTenses" | "nounDeclension" | "verbAspect" | "relativePronouns",
    cefrLevel as "A1" | "A2.1" | "A2.2" | "B1.1",
    theme
  );

  // Determine the appropriate response schema based on exercise type
  const responseFormat = getOpenAIResponseFormat(exerciseType);

  exerciseLogger.debug("Using OpenAI structured output", { exerciseType });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompts.systemPrompt },
      { role: "user", content: prompts.userPrompt },
    ],
    temperature: 0.8, // Reduced from 2 for more consistent structured output
    max_tokens: 1500,
    response_format: responseFormat,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return processAIResponseWithValidation(content, exerciseType);
}

async function generateWithAnthropic(exerciseType: string, cefrLevel: string, apiKey: string, theme?: string) {
  exerciseLogger.debug("Anthropic generation started", { exerciseType, cefrLevel, theme });

  const anthropic = new Anthropic({ apiKey });

  const prompts = generatePrompt(
    exerciseType as "verbTenses" | "nounDeclension" | "verbAspect" | "relativePronouns",
    cefrLevel as "A1" | "A2.1" | "A2.2" | "B1.1",
    theme
  );

  exerciseLogger.debug("Sending request to Anthropic");

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

    exerciseLogger.debug("Received response from Anthropic");
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("No text response from Anthropic");
    }

    return processAIResponseWithValidation(content.text, exerciseType);
  } catch (error) {
    exerciseLogger.error("Anthropic API error", error);
    throw error;
  }
}

function getOpenAIResponseFormat(exerciseType: string) {
  if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
    return {
      type: "json_schema" as const,
      json_schema: {
        name: "paragraph_exercise_response",
        description: "A Croatian language paragraph exercise with fill-in-the-blank questions",
        schema: {
          type: "object",
          properties: {
            paragraph: {
              type: "string",
              description: "Croatian text with numbered blanks like {{1}}, {{2}}, etc.",
            },
            questions: {
              type: "array",
              description: "Array of questions for each blank in the paragraph",
              items: {
                type: "object",
                properties: {
                  blankNumber: {
                    type: "number",
                    description: "The number of the blank this question corresponds to",
                  },
                  baseForm: {
                    type: "string",
                    description: "The Croatian base form of the word (infinitive for verbs, nominative for nouns)",
                  },
                  correctAnswer: {
                    oneOf: [
                      { type: "string" },
                      {
                        type: "array",
                        items: { type: "string" },
                      },
                    ],
                    description:
                      "The correct Croatian answer(s) - string for single answer, array for multiple acceptable answers",
                  },
                  explanation: {
                    type: "string",
                    description: "Explanation in English of why this answer is correct",
                  },
                  isPlural: {
                    type: "boolean",
                    description: "Whether the answer should be in plural form",
                  },
                },
                required: ["blankNumber", "baseForm", "correctAnswer", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["paragraph", "questions"],
          additionalProperties: false,
        },
      },
    };
  } else {
    return {
      type: "json_schema" as const,
      json_schema: {
        name: "sentence_exercise_response",
        description: "A set of Croatian language sentence exercises",
        schema: {
          type: "object",
          properties: {
            exercises: {
              type: "array",
              description: "Array of sentence exercises",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "Croatian sentence with a blank marked as ___",
                  },
                  correctAnswer: {
                    oneOf: [
                      { type: "string" },
                      {
                        type: "array",
                        items: { type: "string" },
                      },
                    ],
                    description: "The correct Croatian answer(s)",
                  },
                  explanation: {
                    type: "string",
                    description: "Explanation in English of why this answer is correct",
                  },
                  isPlural: {
                    type: "boolean",
                    description: "Whether the answer should be in plural form",
                  },
                  ...(exerciseType === "verbAspect"
                    ? {
                        exerciseSubType: {
                          type: "string",
                          enum: ["verb-aspect"],
                          description: "Type identifier for verb aspect exercises",
                        },
                        options: {
                          type: "object",
                          properties: {
                            imperfective: { type: "string" },
                            perfective: { type: "string" },
                          },
                          required: ["imperfective", "perfective"],
                          description: "The two verb aspect options to choose from",
                        },
                        correctAspect: {
                          type: "string",
                          enum: ["imperfective", "perfective"],
                          description: "Which aspect is correct",
                        },
                      }
                    : {}),
                },
                required:
                  exerciseType === "verbAspect"
                    ? ["text", "correctAnswer", "explanation", "exerciseSubType", "options", "correctAspect"]
                    : ["text", "correctAnswer", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["exercises"],
          additionalProperties: false,
        },
      },
    };
  }
}

function processAIResponseWithValidation(content: string, exerciseType: string) {
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(content);
  } catch {
    exerciseLogger.error("Failed to parse AI response", { content: content.substring(0, 200) });
    throw new Error("Invalid JSON response from AI");
  }

  // Validate the response using Zod schemas
  const validatedData = validateExerciseResponse(
    parsedData,
    exerciseType as "verbTenses" | "nounDeclension" | "verbAspect" | "relativePronouns"
  );

  // Generate UUIDs and transform to final format
  if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
    // Type narrowing: we know this is a paragraph exercise response
    if ("paragraph" in validatedData) {
      const exerciseSet: ParagraphExerciseSet = {
        id: uuidv4(),
        paragraph: validatedData.paragraph,
        questions: validatedData.questions.map((q) => ({
          id: uuidv4(),
          blankNumber: q.blankNumber,
          baseForm: q.baseForm,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isPlural: q.isPlural,
        })),
      };

      return NextResponse.json(exerciseSet);
    }
  } else {
    // Type narrowing: we know this is a sentence exercise response
    if ("exercises" in validatedData) {
      const exercises: SentenceExercise[] = validatedData.exercises.map((ex) => {
        // Check if this is a verb aspect exercise and preserve the verb aspect properties
        if ("exerciseSubType" in ex && ex.exerciseSubType === "verb-aspect") {
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

  throw new Error("Invalid exercise response format");
}
