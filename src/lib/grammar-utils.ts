/**
 * Utility functions for detecting grammatical requirements from Croatian exercise content
 */

/**
 * Detects if a question requires a plural answer based on explanation and correct answer
 * @param explanation - The explanation text from the exercise
 * @param correctAnswer - The correct answer(s) for the exercise
 * @returns boolean indicating if plural form is required
 */
export function detectPluralRequirement(
  explanation: string, 
  correctAnswer: string | string[]
): boolean {
  const explanationLower = explanation.toLowerCase();
  
  // Check for explicit plural indicators in explanation
  const pluralIndicators = [
    'plural',
    'množina',
    'mn.',
    'accusative plural',
    'genitive plural',
    'dative plural',
    'locative plural',
    'instrumental plural',
    'nominative plural',
    'vocative plural'
  ];
  
  for (const indicator of pluralIndicators) {
    if (explanationLower.includes(indicator.toLowerCase())) {
      return true;
    }
  }
  
  // Check Croatian plural endings in correct answers
  const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  
  for (const answer of answers) {
    if (hasCroatianPluralEndings(answer.trim())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if a Croatian word/phrase likely contains plural forms based on common endings
 * @param text - The text to analyze
 * @returns boolean indicating if plural endings are detected
 */
function hasCroatianPluralEndings(text: string): boolean {
  const words = text.split(/\s+/);
  
  // Croatian plural endings for different cases and genders
  const pluralPatterns = [
    // Nominative plural
    /i$/, /e$/, /a$/, /ovi$/, /evi$/, /ci$/, /zi$/, /si$/, /ti$/, /di$/, /ni$/, /li$/, /ri$/, /ji$/,
    // Accusative plural  
    /e$/, /a$/, /ove$/, /eve$/, /ce$/, /ze$/, /se$/, /te$/, /de$/, /ne$/, /le$/, /re$/, /je$/,
    // Genitive plural
    /a$/, /ā$/, /ova$/, /eva$/, /aca$/, /eza$/, /asa$/, /ata$/, /ada$/, /ana$/, /ala$/, /ara$/, /aja$/,
    // Dative/Locative plural
    /ima$/, /ovima$/, /evima$/, /cima$/, /zima$/, /sima$/, /tima$/, /dima$/, /nima$/, /lima$/, /rima$/, /jima$/,
    // Instrumental plural
    /ima$/, /ovima$/, /evima$/, /cima$/, /zima$/, /sima$/, /tima$/, /dima$/, /nima$/, /lima$/, /rima$/, /jima$/
  ];
  
  for (const word of words) {
    // Skip very short words and common prepositions/particles
    if (word.length < 3 || ['i', 'u', 'na', 'za', 'od', 'do', 'po', 's', 'sa'].includes(word.toLowerCase())) {
      continue;
    }
    
    for (const pattern of pluralPatterns) {
      if (pattern.test(word.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Generates a visual indicator for plural requirements
 * @param isPlural - Whether the answer requires plural form
 * @returns string representing the visual indicator
 */
export function getPluralIndicator(isPlural: boolean): string {
  return isPlural ? ' (mn.)' : '';
}

/**
 * Generates accessible label for plural requirements
 * @param isPlural - Whether the answer requires plural form
 * @returns string for aria-label
 */
export function getPluralAriaLabel(isPlural: boolean): string {
  return isPlural ? 'Odgovor treba biti u množini (plural form required)' : '';
}
