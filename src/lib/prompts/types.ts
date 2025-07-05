/**
 * Type definitions for the prompt system
 */

export type ExerciseType = "verbTenses" | "nounDeclension" | "verbAspect" | "relativePronouns";
export type CefrLevel = "A1" | "A2.1" | "A2.2" | "B1.1";
export type AIProvider = "openai" | "anthropic";

export interface PromptContext {
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  theme?: string;
}

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
}

export interface PromptVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface ExerciseJsonSchema {
  format: string;
  example?: string;
  requirements: string[];
}

export interface MultipleAnswersInstructions {
  description: string;
  requirements: string[];
}

export interface PromptBuilder {
  buildSystemPrompt(context: PromptContext): string;
  buildUserPrompt(context: PromptContext): string;
  getJsonSchema(): ExerciseJsonSchema;
  getMultipleAnswersInstructions(): MultipleAnswersInstructions;
}
