import { ExerciseType } from "@/types/exercise";

export interface ExerciseSourceInfo {
  isStatic: boolean;
  indicator: string;
  description: string;
}

/**
 * Determines if an exercise is static or generated and provides appropriate UI messaging
 * as per MVP spec section 3: "Static Content is Primary"
 */
export function getExerciseSourceInfo(exerciseId: string, exerciseType: ExerciseType): ExerciseSourceInfo {
  // Static exercise ID patterns (actual patterns from our static worksheets)
  const staticPatterns = {
    verbAspect: /^verb-aspect-\d+$/,
    relativePronouns: /^relative-pronouns-\d+$/, 
    verbTenses: /^verb-tenses-\d+$/,
    nounDeclension: /^noun-declension-\d+$/
  };

  // Check if the exercise ID matches static patterns
  let isStatic = false;
  let staticIndex = 0;
  
  switch (exerciseType) {
    case "verbAspect":
      isStatic = staticPatterns.verbAspect.test(exerciseId);
      if (isStatic) {
        const match = exerciseId.match(/verb-aspect-(\d+)$/);
        staticIndex = match ? parseInt(match[1]) : 1;
      }
      break;
    case "relativePronouns":
      isStatic = staticPatterns.relativePronouns.test(exerciseId);
      if (isStatic) {
        const match = exerciseId.match(/relative-pronouns-(\d+)$/);
        staticIndex = match ? parseInt(match[1]) : 1;
      }
      break;
    case "verbTenses":
      isStatic = staticPatterns.verbTenses.test(exerciseId);
      if (isStatic) {
        const match = exerciseId.match(/verb-tenses-(\d+)$/);
        staticIndex = match ? parseInt(match[1]) : 1;
      }
      break;
    case "nounDeclension":
      isStatic = staticPatterns.nounDeclension.test(exerciseId);
      if (isStatic) {
        const match = exerciseId.match(/noun-declension-(\d+)$/);
        staticIndex = match ? parseInt(match[1]) : 1;
      }
      break;
  }

  if (isStatic) {
    // Static exercise indicators (MVP spec section 3.4)
    return {
      isStatic: true,
      indicator: staticIndex > 0 ? `Static Exercise ${staticIndex}/10` : "Static Exercise",
      description: ""
    };
  } else {
    // Generated exercise indicators
    return {
      isStatic: false,
      indicator: "Generated Exercise",
      description: ""
    };
  }
}

/**
 * Provides loading messages for exercise generation (MVP spec section 3.4)
 */
export function getGenerationMessage(exerciseType: ExerciseType): string {
  const typeNames = {
    verbTenses: "verb tense",
    nounDeclension: "noun declension", 
    verbAspect: "verb aspect",
    relativePronouns: "relative pronoun"
  };

  return `Generating a new ${typeNames[exerciseType]} exercise for you...`;
}
