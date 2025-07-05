import { z } from "zod";

// Base schema for individual question in paragraph exercises
export const ParagraphQuestionSchema = z.object({
  blankNumber: z.number().min(1).max(50),
  baseForm: z.string().min(1).max(100),
  correctAnswer: z.union([z.string().min(1).max(100), z.array(z.string().min(1).max(100)).min(1).max(10)]),
  explanation: z.string().min(10).max(500),
  isPlural: z.boolean().optional(),
});

// Schema for paragraph exercise responses (verb tenses, noun declension)
export const ParagraphExerciseResponseSchema = z.object({
  paragraph: z.string().min(50).max(2000),
  questions: z.array(ParagraphQuestionSchema).min(3).max(15),
});

// Base schema for sentence exercises
export const BaseSentenceExerciseSchema = z.object({
  text: z.string().min(10).max(300),
  correctAnswer: z.union([z.string().min(1).max(100), z.array(z.string().min(1).max(100)).min(1).max(10)]),
  explanation: z.string().min(10).max(500),
  isPlural: z.boolean().optional(),
});

// Schema for verb aspect exercises (extends base with aspect-specific fields)
export const VerbAspectExerciseSchema = BaseSentenceExerciseSchema.extend({
  exerciseSubType: z.literal("verb-aspect"),
  options: z.object({
    imperfective: z.string().min(1).max(100),
    perfective: z.string().min(1).max(100),
  }),
  correctAspect: z.enum(["imperfective", "perfective"]),
});

// Schema for regular sentence exercises (relative pronouns, etc.)
export const RegularSentenceExerciseSchema = BaseSentenceExerciseSchema;

// Union schema for any sentence exercise
export const SentenceExerciseSchema = z.union([VerbAspectExerciseSchema, RegularSentenceExerciseSchema]);

// Schema for sentence exercise set responses
export const SentenceExerciseResponseSchema = z.object({
  exercises: z.array(SentenceExerciseSchema).min(3).max(15),
});

// Union schema for all exercise responses
export const ExerciseResponseSchema = z.union([ParagraphExerciseResponseSchema, SentenceExerciseResponseSchema]);

// Type exports for TypeScript
export type ParagraphQuestion = z.infer<typeof ParagraphQuestionSchema>;
export type ParagraphExerciseResponse = z.infer<typeof ParagraphExerciseResponseSchema>;
export type BaseSentenceExercise = z.infer<typeof BaseSentenceExerciseSchema>;
export type VerbAspectExercise = z.infer<typeof VerbAspectExerciseSchema>;
export type RegularSentenceExercise = z.infer<typeof RegularSentenceExerciseSchema>;
export type SentenceExercise = z.infer<typeof SentenceExerciseSchema>;
export type SentenceExerciseResponse = z.infer<typeof SentenceExerciseResponseSchema>;
export type ExerciseResponse = z.infer<typeof ExerciseResponseSchema>;

// Helper function to validate and transform exercise responses
export function validateExerciseResponse(
  data: unknown,
  exerciseType: "verbTenses" | "nounDeclension" | "verbAspect" | "relativePronouns"
): ParagraphExerciseResponse | SentenceExerciseResponse {
  try {
    if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
      return ParagraphExerciseResponseSchema.parse(data);
    } else {
      return SentenceExerciseResponseSchema.parse(data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; ");
      throw new Error(`Exercise validation failed: ${errorMessage}`);
    }
    throw error;
  }
}

// Helper to determine if an exercise is verb aspect type
export function isVerbAspectExercise(exercise: SentenceExercise): exercise is VerbAspectExercise {
  return "exerciseSubType" in exercise && exercise.exerciseSubType === "verb-aspect";
}
