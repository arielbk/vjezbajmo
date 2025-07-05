import { ExerciseResult } from "@/types/exercise";

/**
 * Croatian diacritic mapping for normalization
 */
const DIACRITIC_MAP: Record<string, string> = {
  č: "c",
  ć: "c",
  đ: "d",
  š: "s",
  ž: "z",
  Č: "C",
  Ć: "C",
  Đ: "D",
  Š: "S",
  Ž: "Z",
};

/**
 * Removes Croatian diacritics from text
 */
export function removeDiacritics(text: string): string {
  return text.replace(/[čćđšžČĆĐŠŽ]/g, (char) => DIACRITIC_MAP[char] || char);
}

/**
 * Normalizes user input for answer comparison
 * Maintains diacritics as they are required for Croatian
 */
export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

/**
 * Normalizes user input without diacritics for lenient comparison
 */
export function normalizeAnswerWithoutDiacritics(answer: string): string {
  return removeDiacritics(answer.trim().toLowerCase());
}

/**
 * Comprehensive answer checking with diacritic tolerance and multiple answer support
 */
export function checkAnswer(
  userAnswer: string,
  correctAnswers: string | string[]
): {
  correct: boolean;
  diacriticWarning: boolean;
  matchedAnswer?: string;
} {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedUserAnswerNoDiacritics = normalizeAnswerWithoutDiacritics(userAnswer);

  // Ensure correctAnswers is always an array for consistent processing
  const answersArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  // First pass: Check for exact matches (with diacritics)
  for (const correctAnswer of answersArray) {
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      return {
        correct: true,
        diacriticWarning: false,
        matchedAnswer: correctAnswer,
      };
    }
  }

  // Second pass: Check for matches without diacritics
  for (const correctAnswer of answersArray) {
    const normalizedCorrectAnswerNoDiacritics = normalizeAnswerWithoutDiacritics(correctAnswer);
    if (normalizedUserAnswerNoDiacritics === normalizedCorrectAnswerNoDiacritics) {
      return {
        correct: true,
        diacriticWarning: true,
        matchedAnswer: correctAnswer,
      };
    }
  }

  return {
    correct: false,
    diacriticWarning: false,
  };
}

/**
 * Checks if a user's answer is correct
 * Used for static exercises (client-side validation)
 * @deprecated Use checkAnswer instead for enhanced functionality
 */
export function checkStaticAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * Generates an exercise result object with enhanced answer checking
 */
export function createExerciseResult(
  questionId: string | number,
  userAnswer: string,
  correctAnswer: string | string[],
  explanation: string
): ExerciseResult {
  const { correct, diacriticWarning, matchedAnswer } = checkAnswer(userAnswer, correctAnswer);

  return {
    questionId,
    userAnswer,
    correct,
    explanation,
    correctAnswer: correct ? undefined : correctAnswer,
    diacriticWarning,
    matchedAnswer,
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
 * Determines if an exercise ID is static or generated
 * Static exercises have predictable patterns, generated exercises are UUIDs
 */
export function isStaticExercise(id: string | number): boolean {
  // Legacy static exercises were numbers
  if (typeof id === "number") return true;
  
  // New static worksheet exercises have predictable patterns
  const staticPatterns = [
    /^verb-tenses-\d+$/,
    /^noun-declension-\d+$/,
    /^verb-aspect-\d+$/,
    /^relative-pronouns-\d+$/,
    // Legacy patterns (if any exist)
    /^static-/,
    /^verb-tenses-static-/,
    /^noun-adjective-static-/
  ];
  
  return staticPatterns.some(pattern => pattern.test(id.toString()));
}
