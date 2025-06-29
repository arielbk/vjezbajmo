/**
 * Base prompt components and utilities
 */

import { CefrLevel, PromptVariables } from './types';

/**
 * Base system prompt for Croatian language exercise generation
 */
export function createSystemPrompt(cefrLevel: CefrLevel): string {
  return `You are a Croatian language teacher creating exercises for ${cefrLevel} CEFR level students. Always respond with valid JSON only, no additional text.`;
}

/**
 * Template string replacement utility
 */
export function fillTemplate(template: string, variables: PromptVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Common JSON response requirements
 */
export const JSON_RESPONSE_REQUIREMENTS = [
  "Always respond with valid JSON only, no additional text",
  "Use double quotes for all strings in JSON",
  "Ensure all required fields are present",
  "Generate unique IDs for each item"
];

/**
 * Common exercise quality requirements
 */
export const EXERCISE_QUALITY_REQUIREMENTS = [
  "Create natural, realistic sentences that Croatian speakers would actually use",
  "Maintain appropriate difficulty level for the specified CEFR level",
  "Provide clear, educational explanations for each answer",
  "Ensure coherent and engaging content"
];

/**
 * Formats theme text for inclusion in prompts
 */
export function formatThemeText(theme?: string): string {
  return theme ? ` The theme should be: ${theme}.` : "";
}

/**
 * Creates a requirements list as formatted text
 */
export function formatRequirements(requirements: string[]): string {
  return requirements.map(req => `- ${req}`).join('\n');
}
