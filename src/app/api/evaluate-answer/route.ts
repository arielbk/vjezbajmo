import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const evaluateAnswerSchema = z.object({
  exerciseType: z.enum(['verbTenses', 'nounDeclension', 'verbAspect', 'interrogativePronouns']),
  question: z.string(),
  userAnswer: z.string(),
  provider: z.enum(['openai', 'anthropic']).optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  alternativeAnswers: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      exerciseType, 
      question, 
      userAnswer, 
      provider, 
      model, 
      temperature, 
      maxTokens,
      alternativeAnswers,
      difficultyLevel 
    } = evaluateAnswerSchema.parse(body);

    // Determine which provider and model to use
    const effectiveProvider = provider || (process.env.SITE_API_PROVIDER as "openai" | "anthropic") || "openai";
    const effectiveModel = model || getDefaultModel(effectiveProvider);
    const effectiveTemperature = temperature ?? 0.1;
    const effectiveMaxTokens = maxTokens ?? 500;

    // Get API key
    const apiKey = getApiKey(effectiveProvider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not found for provider: ${effectiveProvider}` },
        { status: 400 }
      );
    }

    // Generate the evaluation prompt
    const prompt = generateEvaluationPrompt(
      exerciseType, 
      question, 
      userAnswer, 
      alternativeAnswers,
      difficultyLevel
    );

    let response: { isCorrect: boolean; explanation: string };

    if (effectiveProvider === "openai") {
      response = await evaluateWithOpenAI(apiKey, effectiveModel, prompt, effectiveTemperature, effectiveMaxTokens);
    } else {
      response = await evaluateWithAnthropic(apiKey, effectiveModel, prompt, effectiveTemperature, effectiveMaxTokens);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Answer evaluation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}

function getApiKey(provider: "openai" | "anthropic"): string | undefined {
  if (provider === "openai") {
    return process.env.OPENAI_API_KEY || process.env.SITE_API_KEY;
  } else {
    return process.env.ANTHROPIC_API_KEY || process.env.SITE_API_KEY;
  }
}

function getDefaultModel(provider: "openai" | "anthropic"): string {
  if (provider === "openai") {
    return "gpt-4o-mini";
  } else {
    return "claude-3-haiku-20240307";
  }
}

function generateEvaluationPrompt(
  exerciseType: string, 
  question: string, 
  userAnswer: string,
  alternativeAnswers?: string[],
  difficultyLevel?: string
): string {
  let additionalContext = '';
  
  if (alternativeAnswers && alternativeAnswers.length > 0) {
    additionalContext += `\nNote: Multiple correct answers may be acceptable: ${alternativeAnswers.join(', ')}`;
  }
  
  if (difficultyLevel) {
    additionalContext += `\nDifficulty level: ${difficultyLevel}`;
  }

  const basePrompt = `You are an expert Croatian grammar teacher. Evaluate the student's answer to this Croatian grammar exercise.

Exercise Type: ${exerciseType}
Question: ${question}
Student's Answer: ${userAnswer}${additionalContext}

Please provide:
1. Whether the answer is correct (true/false)
2. A detailed explanation of why it's correct or incorrect, including the specific grammar rule

Focus on:
- Proper case declensions for nouns and adjectives
- Correct verb tenses and aspects
- Agreement between words
- Croatian grammar rules and exceptions
- Consider that multiple forms might be acceptable (e.g., Croatian vs Serbian variants)

Respond in JSON format:
{
  "isCorrect": boolean,
  "explanation": "detailed explanation in English"
}`;

  return basePrompt;
}

async function evaluateWithOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ isCorrect: boolean; explanation: string }> {
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const result = JSON.parse(content);
    return {
      isCorrect: Boolean(result.isCorrect),
      explanation: String(result.explanation || "No explanation provided"),
    };
  } catch {
    throw new Error("Invalid JSON response from OpenAI");
  }
}

async function evaluateWithAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ isCorrect: boolean; explanation: string }> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }    try {
      const result = JSON.parse(content.text);
      return {
        isCorrect: Boolean(result.isCorrect),
        explanation: String(result.explanation || "No explanation provided"),
      };
    } catch {
      throw new Error("Invalid JSON response from Anthropic");
    }
}
