import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAnswer } from "@/lib/exercise-utils";
import { cacheProvider } from "@/lib/cache-provider";
import { ParagraphExerciseSet, SentenceExerciseSet } from "@/types/exercise";
import { exerciseLogger } from "@/lib/logger";

// Cache answer validation for 1 hour since solutions don't change
export const revalidate = 3600;

const checkAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
});

async function findSolutionForQuestion(
  questionId: string
): Promise<{ correctAnswer: string | string[]; explanation: string } | null> {
  // We need to search through all cached exercises to find the question
  // Since we don't know which exercise type/level contains this question,
  // we'll need to search across different cache keys

  const exerciseTypes = ["verbTenses", "nounDeclension", "verbAspect", "interrogativePronouns"];
  const cefrLevels = ["A1", "A2.1", "A2.2", "B1.1"];

  for (const exerciseType of exerciseTypes) {
    for (const cefrLevel of cefrLevels) {
      const cacheKey = `${exerciseType}:${cefrLevel}:default`;
      const cachedExercises = await cacheProvider.getCachedExercises(cacheKey);

      for (const cachedExercise of cachedExercises) {
        const data = cachedExercise.data;

        // Check if it's a paragraph exercise set
        if ("questions" in data) {
          const paragraphData = data as ParagraphExerciseSet;
          const question = paragraphData.questions.find((q) => q.id === questionId);
          if (question) {
            return {
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            };
          }
        }

        // Check if it's a sentence exercise set
        if ("exercises" in data) {
          const sentenceData = data as SentenceExerciseSet;
          const exercise = sentenceData.exercises.find((ex) => ex.id === questionId);
          if (exercise) {
            return {
              correctAnswer: exercise.correctAnswer,
              explanation: exercise.explanation,
            };
          }
        }
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, userAnswer } = checkAnswerSchema.parse(body);

    exerciseLogger.api.request('POST', '/api/check-answer', { questionId });

    // Find the solution within cached exercises
    const solution = await findSolutionForQuestion(questionId);

    if (!solution) {
      exerciseLogger.warn('Question not found in cache', { questionId });
      return NextResponse.json({ error: "Question not found or expired" }, { status: 404 });
    }

    const { correct, diacriticWarning, matchedAnswer } = checkAnswer(userAnswer, solution.correctAnswer);

    exerciseLogger.debug('Answer checked', { 
      questionId, 
      correct, 
      diacriticWarning: !!diacriticWarning,
      userAnswerLength: userAnswer.length 
    });

    return NextResponse.json({
      correct,
      explanation: solution.explanation,
      correctAnswer: correct ? undefined : solution.correctAnswer,
      diacriticWarning,
      matchedAnswer,
    });
  } catch (error) {
    exerciseLogger.error("Answer checking error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to check answer" }, { status: 500 });
  }
}
