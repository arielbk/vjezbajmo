/**
 * Prompt builders for different exercise types
 */

import { 
  PromptBuilder, 
  PromptContext, 
  ExerciseJsonSchema, 
  MultipleAnswersInstructions 
} from './types';
import { 
  createSystemPrompt, 
  formatThemeText
} from './base';
import { 
  MULTIPLE_ANSWERS_INSTRUCTIONS, 
  formatMultipleAnswersInstructions 
} from './templates';

// Import static exercise examples
import verbTensesData from "@/data/verb-tenses-worksheets.json";
import nounDeclinationData from "@/data/noun-declension-worksheets.json";
import verbAspectData from "@/data/verb-aspect-worksheets.json";
import interrogativePronounsData from "@/data/interrogative-pronouns-worksheets.json";

export class VerbTensesPromptBuilder implements PromptBuilder {
  buildSystemPrompt(context: PromptContext): string {
    return createSystemPrompt(context.cefrLevel);
  }

  buildUserPrompt(context: PromptContext): string {
    const themeText = formatThemeText(context.theme);
    const exampleExercise = JSON.stringify(verbTensesData[0], null, 2);
    
    return `Create a Croatian verb tenses paragraph exercise. Generate a connected story with 6 blanks where students fill in correct verb forms.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of verb tenses (present, past, future, conditional)
- Include both perfective and imperfective verbs where appropriate
- Provide clear, educational explanations for each answer
- Maintain appropriate ${context.cefrLevel} difficulty level
- Set "isPlural" to true when the correct answer requires a plural form

CRITICAL: Avoid reflexive pronoun duplication!
- If a reflexive pronoun (se/si) appears in the visible text, do NOT include it in the expected answer
- For reflexive verbs, either put the reflexive pronoun in the blank OR in the visible text, never both
- Example: "Ana _____ (pripremiti se)" expects "se priprema" OR "Ana se _____ (pripremiti)" expects "priprema"
- Never create: "Ana se _____ (pripremiti se)" expecting "se priprema" - this duplicates "se"

Return JSON in this exact format:
{
  "id": "generated-uuid",
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "infinitive",
      "correctAnswer": ["primary correct form", "alternative acceptable form"],
      "explanation": "explanation of why these forms are correct, including any grammatical variations",
      "isPlural": false
    }
  ]
}${formatMultipleAnswersInstructions("VERB_TENSES")}`;
  }

  getJsonSchema(): ExerciseJsonSchema {
    return {
      format: "paragraph exercise with questions array",
      requirements: [
        "Include paragraph text with numbered blanks",
        "Provide questions array with blank details",
        "Each question must have correctAnswer as array of strings"
      ]
    };
  }

  getMultipleAnswersInstructions(): MultipleAnswersInstructions {
    return MULTIPLE_ANSWERS_INSTRUCTIONS.VERB_TENSES;
  }
}

export class NounDeclensionPromptBuilder implements PromptBuilder {
  buildSystemPrompt(context: PromptContext): string {
    return createSystemPrompt(context.cefrLevel);
  }

  buildUserPrompt(context: PromptContext): string {
    const themeText = formatThemeText(context.theme);
    const exampleExercise = JSON.stringify(nounDeclinationData[0], null, 2);
    
    return `Create a Croatian noun-adjective declension paragraph exercise. Generate a connected story with 6 blanks where students fill in correctly declined noun-adjective pairs.${themeText}

Here's an example of the quality and style expected:

${exampleExercise}

Key requirements:
- Create a coherent, engaging story that flows naturally
- Use a variety of cases (nominative, accusative, genitive, dative, locative, instrumental)
- Include masculine, feminine, and neuter declensions
- Provide clear explanations mentioning the case and reasoning
- Maintain appropriate ${context.cefrLevel} difficulty level

Return JSON in this exact format:
{
  "id": "generated-uuid", 
  "paragraph": "Story text with ___1___ (baseForm) blanks...",
  "questions": [
    {
      "id": "question-uuid",
      "blankNumber": 1,
      "baseForm": "nominative form",
      "correctAnswer": ["primary declined form", "alternative acceptable form"],
      "explanation": "explanation of case and acceptable variations",
      "isPlural": false
    }
  ]
}${formatMultipleAnswersInstructions("NOUN_DECLENSION")}`;
  }

  getJsonSchema(): ExerciseJsonSchema {
    return {
      format: "paragraph exercise with questions array",
      requirements: [
        "Include paragraph text with numbered blanks",
        "Provide questions array with blank details",
        "Each question must have correctAnswer as array of strings"
      ]
    };
  }

  getMultipleAnswersInstructions(): MultipleAnswersInstructions {
    return MULTIPLE_ANSWERS_INSTRUCTIONS.NOUN_DECLENSION;
  }
}

export class VerbAspectPromptBuilder implements PromptBuilder {
  buildSystemPrompt(context: PromptContext): string {
    return createSystemPrompt(context.cefrLevel);
  }

  buildUserPrompt(context: PromptContext): string {
    const themeText = formatThemeText(context.theme);
    const exampleExercises = JSON.stringify({ exercises: verbAspectData[0].exercises.slice(0, 3) }, null, 2);
    
    return `Create 5 Croatian verb aspect exercises. Each should be a sentence with one blank where students choose between perfective/imperfective verb forms.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus on proper verb tense and aspect usage
- Include a variety of contexts (daily activities, past events, future plans)
- Provide clear explanations about tense and person
- Maintain appropriate ${context.cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "Sentence with _____ blank",
      "exerciseSubType": "verb-aspect",
      "options": {
        "imperfective": "imperfective verb form",
        "perfective": "perfective verb form"
      },
      "correctAspect": "imperfective or perfective",
      "correctAnswer": "correct verb form",
      "explanation": "explanation of aspect choice and reasoning",
      "isPlural": false
    }
  ]
}${formatMultipleAnswersInstructions("VERB_ASPECT")}`;
  }

  getJsonSchema(): ExerciseJsonSchema {
    return {
      format: "exercises array with sentence exercises",
      requirements: [
        "Provide exercises array",
        "Each exercise has text with single blank",
        "Include verb aspect specific properties"
      ]
    };
  }

  getMultipleAnswersInstructions(): MultipleAnswersInstructions {
    return MULTIPLE_ANSWERS_INSTRUCTIONS.VERB_ASPECT;
  }
}

export class InterrogativePronounsPromptBuilder implements PromptBuilder {
  buildSystemPrompt(context: PromptContext): string {
    return createSystemPrompt(context.cefrLevel);
  }

  buildUserPrompt(context: PromptContext): string {
    const themeText = formatThemeText(context.theme);
    const exampleExercises = JSON.stringify({ exercises: interrogativePronounsData[0].exercises.slice(0, 3) }, null, 2);
    
    return `Create 5 Croatian interrogative pronoun exercises. Each should be a sentence with one blank where students fill in the correct form of koji/koja/koje ONLY.${themeText}

Here are examples of the quality and style expected:

${exampleExercises}

IMPORTANT: Use ONLY forms of "koji" (which). Do NOT use other interrogative pronouns like "tko", "što", "čiji", etc.

Declension table for "koji" (which):
SINGULAR:
- Masculine: koji (N), kojeg(a) (G), kojem(u) (D), koji/kojeg(a) (A), kojem(u) (L), kojim (I)
- Feminine: koja (N), koje (G), kojoj (D), koju (A), kojoj (L), kojom (I)
- Neuter: koje (N), kojeg(a) (G), kojem(u) (D), koje (A), kojem(u) (L), kojim (I)

PLURAL:
- Masculine: koji (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Feminine: koje (N), kojih (G), kojima (D), koje (A), kojima (L), kojima (I)
- Neuter: koja (N), kojih (G), kojima (D), koja (A), kojima (L), kojima (I)

Key requirements:
- Create natural, realistic sentences that Croatian speakers would actually use
- Focus EXCLUSIVELY on the declension of "koji/koja/koje" forms shown above
- Include a variety of cases (nominative, genitive, dative, accusative, locative, instrumental)
- Include masculine, feminine, and neuter forms
- Include both singular and plural forms
- Provide clear explanations mentioning case, gender, number, and reasoning
- Maintain appropriate ${context.cefrLevel} difficulty level

Return JSON in this exact format:
{
  "exercises": [
    {
      "id": "question-uuid",
      "text": "_____ question sentence?",
      "correctAnswer": ["primary correct pronoun", "alternative acceptable form"],
      "explanation": "explanation of why these pronouns are correct and their variations",
      "isPlural": false
    }
  ]
}${formatMultipleAnswersInstructions("INTERROGATIVE_PRONOUNS")}`;
  }

  getJsonSchema(): ExerciseJsonSchema {
    return {
      format: "exercises array with sentence exercises",
      requirements: [
        "Provide exercises array",
        "Each exercise has text with single blank",
        "Focus on interrogative pronoun declensions"
      ]
    };
  }

  getMultipleAnswersInstructions(): MultipleAnswersInstructions {
    return MULTIPLE_ANSWERS_INSTRUCTIONS.INTERROGATIVE_PRONOUNS;
  }
}

/**
 * Factory function to create appropriate prompt builder for exercise type
 */
export function createPromptBuilder(exerciseType: string): PromptBuilder {
  switch (exerciseType) {
    case "verbTenses":
      return new VerbTensesPromptBuilder();
    case "nounDeclension":
      return new NounDeclensionPromptBuilder();
    case "verbAspect":
      return new VerbAspectPromptBuilder();
    case "interrogativePronouns":
      return new InterrogativePronounsPromptBuilder();
    default:
      throw new Error(`Unknown exercise type: ${exerciseType}`);
  }
}
