import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAnswer } from "@/lib/exercise-utils";
import { exerciseCache } from "@/lib/exercise-cache";

// Cache answer validation for 1 hour since solutions don't change
export const revalidate = 3600;

const checkAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, userAnswer } = checkAnswerSchema.parse(body);

    // Get the cached solution
    const cachedSolution = await exerciseCache.get(questionId);

    if (!cachedSolution) {
      return NextResponse.json({ error: "Question not found or expired" }, { status: 404 });
    }

    const { correct, diacriticWarning, matchedAnswer } = checkAnswer(userAnswer, cachedSolution.correctAnswer);

    return NextResponse.json({
      correct,
      explanation: cachedSolution.explanation,
      correctAnswer: correct ? undefined : cachedSolution.correctAnswer,
      diacriticWarning,
      matchedAnswer,
    });
  } catch (error) {
    console.error("Answer checking error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to check answer" }, { status: 500 });
  }
}
