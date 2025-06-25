import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { ParagraphExerciseSet, SentenceExercise } from "@/types/exercise";
import { exerciseCache } from "@/lib/exercise-cache";

// Validation schema
const generateExerciseSchema = z.object({
  exerciseType: z.enum(["verb-tenses", "noun-adjective-declension", "verb-aspect", "interrogative-pronouns"]),
  theme: z.string().optional(),
});

// Interfaces for AI responses
interface AIQuestion {
  id?: string;
  blankNumber: number;
  baseForm: string;
  correctAnswer: string;
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
  correctAnswer: string;
  explanation: string;
}

interface AISentenceResponse {
  exercises: AIExercise[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseType, theme } = generateExerciseSchema.parse(body);

    // Check for API key
    const apiKey = request.headers.get("x-openai-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key required" }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey });

    let prompt: string;
    const systemPrompt =
      "You are a Croatian language teacher creating exercises for A2.2 CEFR level students. Always respond with valid JSON only, no additional text.";

    if (exerciseType === "verb-tenses" || exerciseType === "noun-adjective-declension") {
      // Paragraph exercise
      const themeText = theme ? ` The theme should be: ${theme}.` : "";

      if (exerciseType === "verb-tenses") {
        prompt = `Create a Croatian verb tenses paragraph exercise. Generate a connected story with 6 blanks where students fill in correct verb forms.${themeText}

Return JSON in this exact format:
{
  "id": "generated-uuid",
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "infinitive",
      "correctAnswer": "correct form",
      "explanation": "explanation of why this form is correct"
    }
  ]
}`;
      } else {
        prompt = `Create a Croatian noun-adjective declension paragraph exercise. Generate a connected story with 6 blanks where students fill in correctly declined noun-adjective pairs.${themeText}

Return JSON in this exact format:
{
  "id": "generated-uuid", 
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "nominative form",
      "correctAnswer": "declined form",
      "explanation": "explanation of case and why"
    }
  ]
}`;
      }
    } else {
      // Sentence exercises
      const themeText = theme ? ` The theme should be: ${theme}.` : "";

      if (exerciseType === "verb-aspect") {
        prompt = `Create 5 Croatian verb aspect exercises. Each should be a sentence with one blank where students choose between perfective/imperfective verb forms.${themeText}

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "Sentence with _____ blank",
      "correctAnswer": "correct verb form",
      "explanation": "explanation of aspect choice"
    }
  ]
}`;
      } else {
        prompt = `Create 5 Croatian interrogative pronoun exercises. Each should be a sentence with one blank where students fill in the correct form of koji/koja/koje/tko/što etc.${themeText}

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "_____ question sentence?",
      "correctAnswer": "correct pronoun",
      "explanation": "explanation of why this pronoun"
    }
  ]
}`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let exerciseData: AIParagraphResponse | AISentenceResponse;
    try {
      exerciseData = JSON.parse(content);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    // Generate UUIDs and cache solutions
    if (exerciseType === "verb-tenses" || exerciseType === "noun-adjective-declension") {
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

      // Cache solutions
      exerciseSet.questions.forEach((q) => {
        exerciseCache.set(q.id, {
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      });

      return NextResponse.json(exerciseSet);
    } else {
      const aiData = exerciseData as AISentenceResponse;
      const exercises: SentenceExercise[] = aiData.exercises.map((ex) => ({
        id: uuidv4(),
        text: ex.text,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation,
      }));

      // Cache solutions
      exercises.forEach((ex) => {
        exerciseCache.set(ex.id as string, {
          correctAnswer: ex.correctAnswer,
          explanation: ex.explanation,
        });
      });

      return NextResponse.json({ exercises });
    }
  } catch (error) {
    console.error("Exercise generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to generate exercise. Please try again." }, { status: 500 });
  }
}
