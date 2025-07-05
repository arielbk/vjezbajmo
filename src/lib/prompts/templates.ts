/**
 * Multiple answers instructions for flexible answer validation
 */

import { MultipleAnswersInstructions } from './types';

export const MULTIPLE_ANSWERS_INSTRUCTIONS: Record<string, MultipleAnswersInstructions> = {
  VERB_TENSES: {
    description: "Provide multiple acceptable variations for verb tenses",
    requirements: [
      "Provide \"correctAnswer\" as an array of strings containing ALL grammatically acceptable variations",
      "Include different verb forms when multiple aspects/tenses are contextually appropriate",
      "Include alternative word orders when Croatian grammar allows flexibility",
      "Include gender variations (masculine/feminine) when both are possible",
      "Include regional or stylistic variations that are grammatically correct",
      "Set \"isPlural\" to true when the correct answer requires a plural form",
      "Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct"
    ]
  },

  NOUN_DECLENSION: {
    description: "Provide multiple acceptable variations for noun declension",
    requirements: [
      "Provide \"correctAnswer\" as an array of strings containing ALL grammatically acceptable variations",
      "Include different case forms when context allows multiple interpretations",
      "Include alternative adjective declensions that agree with the noun",
      "Include word order variations when Croatian grammar permits flexibility",
      "Include regional variations that are grammatically correct",
      "Set \"isPlural\" to true when the correct answer requires a plural form",
      "Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct"
    ]
  },

  VERB_ASPECT: {
    description: "Provide multiple acceptable variations for verb aspect",
    requirements: [
      "Provide \"correctAnswer\" as an array of strings containing ALL grammatically acceptable variations",
      "Include both perfective and imperfective forms when context allows either",
      "Include different gender/person forms when applicable",
      "Include alternative verb forms that express the same meaning",
      "Include regional or stylistic variations that are grammatically correct",
      "Set \"isPlural\" to true when the correct answer requires a plural form",
      "Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct"
    ]
  },

  RELATIVE_PRONOUNS: {
    description: "Provide multiple acceptable variations for relative pronouns",
    requirements: [
      "Provide \"correctAnswer\" as an array of strings containing ALL grammatically acceptable variations",
      "Include alternative case forms when context permits multiple interpretations",
      "Include both long and short forms where applicable (e.g., kojeg vs kojega)",
      "Include regional variations that are grammatically correct",
      "Include different word orders when Croatian grammar allows flexibility",
      "Set \"isPlural\" to true when the correct answer requires a plural form",
      "Provide at least 2-3 acceptable variations where possible, but include ALL that are truly correct"
    ]
  }
};

/**
 * Formats multiple answers instructions for inclusion in prompts
 */
export function formatMultipleAnswersInstructions(exerciseType: string): string {
  const instructions = MULTIPLE_ANSWERS_INSTRUCTIONS[exerciseType.toUpperCase()];
  if (!instructions) {
    return "";
  }

  return `\n\nIMPORTANT: ${instructions.description}:\n${instructions.requirements.map(req => `- ${req}`).join('\n')}`;
}
