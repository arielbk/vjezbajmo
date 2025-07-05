// Static worksheet loading and progression logic
// Manages the loading of static worksheets and determines which one to serve next

import { ExerciseType, CefrLevel, ParagraphExerciseSet, SentenceExerciseSet } from "@/types/exercise";
import { userProgressManager } from "@/lib/user-progress";

// Import static worksheet data
import verbTensesWorksheets from "@/data/verb-tenses-worksheets.json";
import nounDeclensionWorksheets from "@/data/noun-declension-worksheets.json";
import verbAspectWorksheets from "@/data/verb-aspect-worksheets.json";
import relativePronounsWorksheets from "@/data/relative-pronouns-worksheets.json";

interface StaticWorksheet {
  id: string;
  source: "static";
  exerciseType: string;
  cefrLevel: string;
  title?: string;
  paragraph?: string; // For paragraph exercises (verb tenses, noun declension)
  exercises?: Array<{
    id: string;
    text: string;
    correctAnswer: string | string[];
    explanation: string;
    exerciseSubType?: string;
    options?: {
      imperfective: string;
      perfective: string;
    };
    correctAspect?: "imperfective" | "perfective";
  }>; // For sentence exercises (relative pronouns, verb aspect)
  questions?: Array<{
    id: string;
    blankNumber: number;
    correctAnswer: string | string[];
    explanation: string;
    baseForm?: string;
  }>; // For paragraph exercises
}

/**
 * Get static worksheets for a specific exercise type
 */
export function getStaticWorksheets(exerciseType: ExerciseType): StaticWorksheet[] {
  switch (exerciseType) {
    case "verbTenses":
      return verbTensesWorksheets as StaticWorksheet[];
    case "nounDeclension":
      return nounDeclensionWorksheets as StaticWorksheet[];
    case "verbAspect":
      return verbAspectWorksheets as StaticWorksheet[];
    case "relativePronouns":
      return relativePronounsWorksheets as StaticWorksheet[];
    default:
      return [];
  }
}

/**
 * Get the next unfinished static worksheet for a user
 * Returns null if all static worksheets are completed
 */
export function getNextStaticWorksheet(
  exerciseType: ExerciseType,
  cefrLevel: CefrLevel,
  theme?: string
): StaticWorksheet | null {
  const allWorksheets = getStaticWorksheets(exerciseType);

  // Filter worksheets by CEFR level
  const levelWorksheets = allWorksheets.filter((w) => w.cefrLevel === cefrLevel);

  if (levelWorksheets.length === 0) {
    return null;
  }

  // Get completed worksheet IDs for this user
  const completedIds = userProgressManager.getCompletedExercises(exerciseType, cefrLevel, theme);

  // Find the first worksheet that hasn't been completed
  const nextWorksheet = levelWorksheets.find((w) => !completedIds.includes(w.id));

  return nextWorksheet || null;
}

/**
 * Check if there are any remaining static worksheets for a user
 */
export function hasRemainingStaticWorksheets(
  exerciseType: ExerciseType,
  cefrLevel: CefrLevel,
  theme?: string
): boolean {
  return getNextStaticWorksheet(exerciseType, cefrLevel, theme) !== null;
}

/**
 * Get progress through static worksheets (e.g., "3/10")
 */
export function getStaticWorksheetProgress(
  exerciseType: ExerciseType,
  cefrLevel: CefrLevel,
  theme?: string
): { completed: number; total: number; progressText: string } {
  const allWorksheets = getStaticWorksheets(exerciseType);
  const levelWorksheets = allWorksheets.filter((w) => w.cefrLevel === cefrLevel);
  const completedIds = userProgressManager.getCompletedExercises(exerciseType, cefrLevel, theme);

  const completed = completedIds.filter((id) => levelWorksheets.some((w) => w.id === id)).length;

  const total = levelWorksheets.length;

  return {
    completed,
    total,
    progressText: `${completed}/${total}`,
  };
}

/**
 * Convert a static worksheet to the format expected by exercise components
 */
export function convertWorksheetToExerciseSet(
  worksheet: StaticWorksheet,
  exerciseType: ExerciseType
): ParagraphExerciseSet | SentenceExerciseSet {
  switch (exerciseType) {
    case "verbTenses":
    case "nounDeclension": {
      // Paragraph exercises - return ParagraphExerciseSet
      const paragraph = worksheet.paragraph || "";
      const questions = worksheet.questions || [];

      const result: ParagraphExerciseSet = {
        id: worksheet.id,
        paragraph: paragraph,
        questions: questions.map((q) => ({
          id: q.id,
          blankNumber: q.blankNumber,
          baseForm: q.baseForm || "",
          correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer],
          explanation: q.explanation,
        })),
      };
      return result;
    }

    case "relativePronouns": {
      // Sentence exercises - return SentenceExerciseSet
      const exercises = worksheet.exercises || [];

      const result: SentenceExerciseSet = {
        id: worksheet.id,
        exercises: exercises.map((ex) => ({
          id: ex.id,
          text: ex.text,
          correctAnswer: Array.isArray(ex.correctAnswer) ? ex.correctAnswer : [ex.correctAnswer],
          explanation: ex.explanation,
        })),
      };
      return result;
    }

    case "verbAspect": {
      // Verb aspect exercises - return SentenceExerciseSet with VerbAspectExercise format
      const exercises = worksheet.exercises || [];

      const result: SentenceExerciseSet = {
        id: worksheet.id,
        exercises: exercises.map((ex) => ({
          id: ex.id,
          text: ex.text,
          exerciseSubType: "verb-aspect" as const,
          options: ex.options || { imperfective: "", perfective: "" },
          correctAspect: ex.correctAspect || "imperfective",
          correctAnswer: Array.isArray(ex.correctAnswer) ? ex.correctAnswer : [ex.correctAnswer],
          explanation: ex.explanation,
        })),
      };
      return result;
    }

    default:
      throw new Error(`Unsupported exercise type: ${exerciseType}`);
  }
}
