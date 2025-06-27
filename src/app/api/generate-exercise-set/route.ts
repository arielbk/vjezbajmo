import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { ParagraphExerciseSet, SentenceExercise } from "@/types/exercise";
import { cacheProvider, generateCacheKey, CachedExercise } from "@/lib/cache-provider";

// Static exercise imports for examples
import verbTensesData from "@/data/verb-tenses-paragraph.json";
import nounAdjectiveData from "@/data/noun-adjective-paragraph.json";
import verbAspectData from "@/data/verb-aspect-exercises.json";
import interrogativePronounsData from "@/data/interrogative-pronouns-exercises.json";

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

  let prompt: string;
  const systemPrompt = `You are a Croatian language teacher creating exercises for ${cefrLevel} CEFR level students. Always respond with valid JSON only, no additional text.`;

  if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
    // Paragraph exercise
    const themeText = theme ? ` The theme should be: ${theme}.` : "";

    if (exerciseType === "verbTenses") {
      const exampleExercise = JSON.stringify(verbTensesData, null, 2);
      prompt = `Create a Croatian verb tenses paragraph exercise. Generate a connected story with 6 blanks where students fill in correct verb forms.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of verb tenses (present, past, future, conditional)
- Include both perfective and imperfective verbs where appropriate
- Provide clear, educational explanations for each answer
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "id": "generated-uuid",
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "infinitive",
      "correctAnswer": ["primary correct form", "alternative acceptable form"],
      "explanation": "explanation of why these forms are correct, including any grammatical variations"
    }
  ]
}

IMPORTANT: For each question, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Different verb forms when multiple aspects/tenses are contextually appropriate
- Alternative word orders when Croatian grammar allows flexibility
- Gender variations (masculine/feminine) when both are possible
- Regional or stylistic variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    } else {
      const exampleExercise = JSON.stringify(nounAdjectiveData, null, 2);
      prompt = `Create a Croatian noun-adjective declension paragraph exercise. Generate a connected story with 6 blanks where students fill in correctly declined noun-adjective pairs.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of cases (nominative, accusative, genitive, dative, locative, instrumental)
- Include masculine, feminine, and neuter declensions
- Provide clear explanations mentioning the case and reasoning
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "id": "generated-uuid", 
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "nominative form",
      "correctAnswer": ["primary declined form", "alternative acceptable form"],
      "explanation": "explanation of case and acceptable variations"
    }
  ]
}

IMPORTANT: For each question, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Different case forms when context allows multiple interpretations
- Alternative adjective declensions that agree with the noun
- Word order variations when Croatian grammar permits flexibility
- Regional variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    }
  } else {
    // Sentence exercises
    const themeText = theme ? ` The theme should be: ${theme}.` : "";

    if (exerciseType === "verbAspect") {
      const exampleExercises = JSON.stringify({ exercises: verbAspectData.exercises.slice(0, 3) }, null, 2);
      prompt = `Create 5 Croatian verb aspect exercises. Each should be a sentence with one blank where students choose between perfective/imperfective verb forms.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus on proper verb tense and aspect usage
- Include a variety of contexts (daily activities, past events, future plans)
- Provide clear explanations about tense and person
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "Sentence with _____ blank",
      "correctAnswer": ["primary correct form", "alternative acceptable form"],
      "explanation": "explanation of aspect choice and acceptable variations"
    }
  ]
}

IMPORTANT: For each exercise, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Both perfective and imperfective forms when context allows either
- Different gender/person forms when applicable
- Alternative verb forms that express the same meaning
- Regional or stylistic variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    } else {
      const exampleExercises = JSON.stringify({ exercises: interrogativePronounsData.exercises.slice(0, 3) }, null, 2);
      prompt = `Create 5 Croatian interrogative pronoun exercises. Each should be a sentence with one blank where students fill in the correct form of koji/koja/koje ONLY.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

IMPORTANT: Use ONLY forms of "koji" (which). Do NOT use other interrogative pronouns like "tko", "što", "čiji", etc.

Declension table for "koji" (which):
SINGULAR:
- Masculine: koji (N), kojeg(a) (G), kojem(u) (D), koji/kojeg(a) (A), kojem(u) (L), kojim (I)
- Feminine: koja (N), koje (G), kojoj (D), koju (A), kojoj (L), kojom (I)
- Neuter: koje (N), kojeg(a) (G), kojem(u) (D), koje (A), kojem(u) (L), kojim (I)

PLURAL:
- Masculine: koji (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Feminine: koje (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Neuter: koja (N), kojih (G), kojima (D), koja (A), kojima (L), kojima (I)

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus EXCLUSIVELY on the declension of "koji/koja/koje" forms shown above
- Include a variety of cases (nominative, genitive, dative, accusative, locative, instrumental)
- Include masculine, feminine, and neuter forms
- Include both singular and plural forms
- Provide clear explanations mentioning case, gender, number, and reasoning
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "_____ question sentence?",
      "correctAnswer": ["primary correct pronoun", "alternative acceptable form"],
      "explanation": "explanation of why these pronouns are correct and their variations"
    }
  ]
}

IMPORTANT: For each exercise, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Alternative case forms when context permits multiple interpretations
- Both long and short forms where applicable (e.g., kojeg vs kojega)
- Regional variations that are grammatically correct
- Different word orders when Croatian grammar allows flexibility

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
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

  let prompt: string;
  const systemPrompt = `You are a Croatian language teacher creating exercises for ${cefrLevel} CEFR level students. Always respond with valid JSON only, no additional text.`;

  if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
    // Paragraph exercise
    const themeText = theme ? ` The theme should be: ${theme}.` : "";

    if (exerciseType === "verbTenses") {
      const exampleExercise = JSON.stringify(verbTensesData, null, 2);
      prompt = `Create a Croatian verb tenses paragraph exercise. Generate a connected story with 6 blanks where students fill in correct verb forms.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of verb tenses (present, past, future, conditional)
- Include both perfective and imperfective verbs where appropriate
- Provide clear, educational explanations for each answer
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "id": "generated-uuid",
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "infinitive",
      "correctAnswer": ["primary correct form", "alternative acceptable form"],
      "explanation": "explanation of why these forms are correct, including any grammatical variations"
    }
  ]
}

IMPORTANT: For each question, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Different verb forms when multiple aspects/tenses are contextually appropriate
- Alternative word orders when Croatian grammar allows flexibility
- Gender variations (masculine/feminine) when both are possible
- Regional or stylistic variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    } else {
      const exampleExercise = JSON.stringify(nounAdjectiveData, null, 2);
      prompt = `Create a Croatian noun-adjective declension paragraph exercise. Generate a connected story with 6 blanks where students fill in correctly declined noun-adjective pairs.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of cases (nominative, accusative, genitive, dative, locative, instrumental)
- Include masculine, feminine, and neuter declensions
- Provide clear explanations mentioning the case and reasoning
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "id": "generated-uuid", 
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "nominative form",
      "correctAnswer": ["primary declined form", "alternative acceptable form"],
      "explanation": "explanation of case and acceptable variations"
    }
  ]
}

IMPORTANT: For each question, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Different case forms when context allows multiple interpretations
- Alternative adjective declensions that agree with the noun
- Word order variations when Croatian grammar permits flexibility
- Regional variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    }
  } else {
    // Sentence exercises
    const themeText = theme ? ` The theme should be: ${theme}.` : "";

    if (exerciseType === "verbAspect") {
      const exampleExercises = JSON.stringify({ exercises: verbAspectData.exercises.slice(0, 3) }, null, 2);
      prompt = `Create 5 Croatian verb aspect exercises. Each should be a sentence with one blank where students choose between perfective/imperfective verb forms.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus on proper verb tense and aspect usage
- Include a variety of contexts (daily activities, past events, future plans)
- Provide clear explanations about tense and person
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "Sentence with _____ blank",
      "correctAnswer": ["primary correct form", "alternative acceptable form"],
      "explanation": "explanation of aspect choice and acceptable variations"
    }
  ]
}

IMPORTANT: For each exercise, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Both perfective and imperfective forms when context allows either
- Different gender/person forms when applicable
- Alternative verb forms that express the same meaning
- Regional or stylistic variations that are grammatically correct

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    } else {
      const exampleExercises = JSON.stringify({ exercises: interrogativePronounsData.exercises.slice(0, 3) }, null, 2);
      prompt = `Create 5 Croatian interrogative pronoun exercises. Each should be a sentence with one blank where students fill in the correct form of koji/koja/koje ONLY.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

IMPORTANT: Use ONLY forms of "koji" (which). Do NOT use other interrogative pronouns like "tko", "što", "čiji", etc.

Declension table for "koji" (which):
SINGULAR:
- Masculine: koji (N), kojeg(a) (G), kojem(u) (D), koji/kojeg(a) (A), kojem(u) (L), kojim (I)
- Feminine: koja (N), koje (G), kojoj (D), koju (A), kojoj (L), kojom (I)
- Neuter: koje (N), kojeg(a) (G), kojem(u) (D), koje (A), kojem(u) (L), kojim (I)

PLURAL:
- Masculine: koji (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Feminine: koje (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Neuter: koja (N), kojih (G), kojima (D), koja (A), kojima (L), kojima (I)

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus EXCLUSIVELY on the declension of "koji/koja/koje" forms shown above
- Include a variety of cases (nominative, genitive, dative, accusative, locative, instrumental)
- Include masculine, feminine, and neuter forms
- Include both singular and plural forms
- Provide clear explanations mentioning case, gender, number, and reasoning
- Maintain appropriate ${cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "_____ question sentence?",
      "correctAnswer": ["primary correct pronoun", "alternative acceptable form"],
      "explanation": "explanation of why these pronouns are correct and their variations"
    }
  ]
}

IMPORTANT: For each exercise, provide "correctAnswer" as an array of strings containing ALL grammatically acceptable variations, including:
- Alternative case forms when context permits multiple interpretations
- Both long and short forms where applicable (e.g., kojeg vs kojega)
- Regional variations that are grammatically correct
- Different word orders when Croatian grammar allows flexibility

Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct.`;
    }
  }

  console.log("Sending request to Anthropic...");

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1500,
      temperature: 1,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
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
      })),
    };

    return NextResponse.json(exerciseSet);
  } else {
    const aiData = exerciseData as AISentenceResponse;
    const exercises: SentenceExercise[] = aiData.exercises.map((ex) => ({
      id: uuidv4(),
      text: ex.text,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation,
    }));

    // Add a set ID for consistent tracking
    const exerciseSetWithId = {
      id: uuidv4(),
      exercises,
    };

    return NextResponse.json(exerciseSetWithId);
  }
}
