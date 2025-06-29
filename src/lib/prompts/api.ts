/**
 * Main API for the prompt system
 */

import { ExerciseType, CefrLevel, PromptTemplate, PromptContext } from './types';
import { createPromptBuilder } from './builders';

/**
 * Generate a complete prompt for exercise generation
 */
export function generatePrompt(
  exerciseType: ExerciseType,
  cefrLevel: CefrLevel,
  theme?: string
): PromptTemplate {
  const context: PromptContext = {
    exerciseType,
    cefrLevel,
    theme
  };

  const builder = createPromptBuilder(exerciseType);
  
  return {
    systemPrompt: builder.buildSystemPrompt(context),
    userPrompt: builder.buildUserPrompt(context)
  };
}

/**
 * Get the JSON schema information for an exercise type
 */
export function getExerciseJsonSchema(exerciseType: ExerciseType) {
  const builder = createPromptBuilder(exerciseType);
  return builder.getJsonSchema();
}

/**
 * Get the multiple answers instructions for an exercise type
 */
export function getMultipleAnswersInstructions(exerciseType: ExerciseType) {
  const builder = createPromptBuilder(exerciseType);
  return builder.getMultipleAnswersInstructions();
}
