import { ExerciseResult } from "@/types/exercise";

/**
 * Normalizes user input for answer comparison
 * Maintains diacritics as they are required for Croatian
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

/**
 * Checks if a user's answer is correct
 * Used for static exercises (client-side validation)
 */
export function checkStaticAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * Generates an exercise result object
 */
export function createExerciseResult(
  questionId: string | number,
  userAnswer: string,
  correctAnswer: string,
  explanation: string
): ExerciseResult {
  const correct = checkStaticAnswer(userAnswer, correctAnswer);

  return {
    questionId,
    userAnswer,
    correct,
    explanation,
    correctAnswer: correct ? undefined : correctAnswer,
  };
}

/**
 * Calculates completion percentage
 */
export function calculateScore(results: ExerciseResult[]): {
  correct: number;
  total: number;
  percentage: number;
} {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, total, percentage };
}

/**
 * Determines if an exercise ID is static (number) or generated (string UUID)
 */
export function isStaticExercise(id: string | number): boolean {
  return typeof id === "number";
}
