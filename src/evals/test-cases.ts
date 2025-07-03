// Test cases for evaluating AI model performance on Croatian grammar exercises

export interface TestCase {
  id: string;
  exerciseType: "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns";
  question: string;
  userAnswer: string;
  expectedCorrect: boolean;
  expectedExplanation?: string;
  notes?: string;
  // Support for multiple acceptable answers
  alternativeCorrectAnswers?: string[];
  difficultyLevel?: "easy" | "medium" | "hard";
}

export const VERB_TENSES_TEST_CASES: TestCase[] = [
  {
    id: "vt_01",
    exerciseType: "verbTenses",
    question: "Marko _____ (ići) u školu svaki dan.",
    userAnswer: "ide",
    expectedCorrect: true,
    expectedExplanation: 'Present tense, third person singular of "ići" (to go). "Ide" is correct for habitual action.',
    difficultyLevel: "easy",
  },
  {
    id: "vt_02",
    exerciseType: "verbTenses",
    question: "Jučer je _____ (učiti) tri sata.",
    userAnswer: "učio",
    expectedCorrect: true,
    expectedExplanation: 'Past tense, masculine singular of "učiti" (to study/learn).',
    difficultyLevel: "easy",
  },
  {
    id: "vt_03",
    exerciseType: "verbTenses",
    question: "Sutra će _____ (doći) kasno.",
    userAnswer: "doći",
    expectedCorrect: true,
    expectedExplanation: 'Future tense construction with "će" + infinitive.',
    difficultyLevel: "easy",
  },
  {
    id: "vt_04",
    exerciseType: "verbTenses",
    question: "Marko _____ (ići) u školu svaki dan.",
    userAnswer: "išao",
    expectedCorrect: false,
    expectedExplanation:
      'Incorrect tense. "Išao" is past tense, but the sentence indicates habitual present action ("svaki dan"). Should be "ide".',
    difficultyLevel: "medium",
  },
  {
    id: "vt_05",
    exerciseType: "verbTenses",
    question: "Ona _____ (pjevati) u zboru od malena.",
    userAnswer: "pjeva",
    expectedCorrect: true,
    expectedExplanation:
      'Present tense for ongoing activity. Both "pjeva" (Croatian) and "peva" (Serbian) are acceptable.',
    difficultyLevel: "medium",
  },
  {
    id: "vt_06",
    exerciseType: "verbTenses",
    question: "Kad _____ (završiti) posao, idem kući.",
    userAnswer: "završim",
    expectedCorrect: true,
    expectedExplanation:
      'Present tense in temporal clause expressing future completion. "Završim" is perfective present.',
    difficultyLevel: "hard",
  },
];

export const NOUN_DECLENSION_TEST_CASES: TestCase[] = [
  {
    id: "nd_01",
    exerciseType: "nounDeclension",
    question: "U _____ (veliki grad) živi moja prijateljica.",
    userAnswer: "velikom gradu",
    expectedCorrect: true,
    expectedExplanation:
      'Locative case (where?) - masculine singular: "veliki" becomes "velikom", "grad" becomes "gradu".',
    difficultyLevel: "medium",
  },
  {
    id: "nd_02",
    exerciseType: "nounDeclension",
    question: "Vidim _____ (nova knjiga) na stolu.",
    userAnswer: "novu knjigu",
    expectedCorrect: true,
    expectedExplanation:
      'Accusative case (what?) - feminine singular: "nova" becomes "novu", "knjiga" becomes "knjigu".',
    difficultyLevel: "easy",
  },
  {
    id: "nd_03",
    exerciseType: "nounDeclension",
    question: "Šetam s _____ (mali pas).",
    userAnswer: "malim psom",
    expectedCorrect: true,
    expectedExplanation:
      'Instrumental case (with what?) - masculine singular: "mali" becomes "malim", "pas" becomes "psom".',
    difficultyLevel: "medium",
  },
  {
    id: "nd_04",
    exerciseType: "nounDeclension",
    question: "U _____ (veliki grad) živi moja prijateljica.",
    userAnswer: "veliki grad",
    expectedCorrect: false,
    expectedExplanation:
      'Incorrect case. Nominative form used instead of locative. Should be "velikom gradu" for locative case (where?).',
    difficultyLevel: "easy",
  },
  {
    id: "nd_05",
    exerciseType: "nounDeclension",
    question: "Uživaju u _____ (bistar zrak).",
    userAnswer: "bistar zrak",
    expectedCorrect: false,
    expectedExplanation:
      'Incorrect case. Should be locative "bistrom zraku" (masculine singular locative), not nominative "bistar zrak".',
    difficultyLevel: "hard",
  },
  {
    id: "nd_06",
    exerciseType: "nounDeclension",
    question: "Govori o _____ (važan problem).",
    userAnswer: "važnom problemu",
    expectedCorrect: true,
    expectedExplanation:
      'Locative case after "o" (about). Masculine singular: "važan" → "važnom", "problem" → "problemu".',
    difficultyLevel: "medium",
  },
  {
    id: "nd_07",
    exerciseType: "nounDeclension",
    question: "Djeca se igraju s _____ (nova igračka).",
    userAnswer: "novom igračkom",
    expectedCorrect: true,
    expectedExplanation:
      'Instrumental case with "s" (with). Feminine singular: "nova" → "novom", "igračka" → "igračkom".',
    difficultyLevel: "medium",
  },
  {
    id: "nd_08",
    exerciseType: "nounDeclension",
    question: "Poklonila je cvijeće _____ (draga majka).",
    userAnswer: "dragoj majci",
    expectedCorrect: true,
    expectedExplanation: 'Dative case (to whom?). Feminine singular: "draga" → "dragoj", "majka" → "majci".',
    difficultyLevel: "medium",
  },
];

export const VERB_ASPECT_TEST_CASES: TestCase[] = [
  {
    id: "va_01",
    exerciseType: "verbAspect",
    question: "Marko _____ u školu svaki dan. (ide/pođe)",
    userAnswer: "ide",
    expectedCorrect: true,
    expectedExplanation: 'Imperfective "ide" is correct for habitual, repeated action ("svaki dan").',
    difficultyLevel: "easy",
  },
  {
    id: "va_02",
    exerciseType: "verbAspect",
    question: "Sutra ću _____ zadaću. (raditi/uraditi)",
    userAnswer: "uraditi",
    expectedCorrect: true,
    expectedExplanation: 'Perfective "uraditi" indicates completion of the task in the future.',
    difficultyLevel: "medium",
  },
  {
    id: "va_03",
    exerciseType: "verbAspect",
    question: "Cijeli dan je _____ na kiši. (čekao/počekao)",
    userAnswer: "čekao",
    expectedCorrect: true,
    expectedExplanation:
      'Imperfective "čekao" for duration ("cijeli dan"). Perfective "počekao" would be for a short wait.',
    difficultyLevel: "medium",
  },
  {
    id: "va_04",
    exerciseType: "verbAspect",
    question: "Marko _____ u školu svaki dan. (ide/pođe)",
    userAnswer: "pođe",
    expectedCorrect: false,
    expectedExplanation:
      'Incorrect aspect. Perfective "pođe" suggests one-time action, but "svaki dan" requires imperfective "ide" for habitual action.',
    difficultyLevel: "medium",
  },
  {
    id: "va_05",
    exerciseType: "verbAspect",
    question: "Kad _____ film, ići ću spavati. (gledam/pogledam)",
    userAnswer: "pogledam",
    expectedCorrect: true,
    expectedExplanation: 'Perfective "pogledam" in temporal clause indicates completion before the main action.',
    difficultyLevel: "hard",
  },
  {
    id: "va_06",
    exerciseType: "verbAspect",
    question: "Svake večeri _____ knjige. (čita/pročita)",
    userAnswer: "čita",
    expectedCorrect: true,
    expectedExplanation:
      'Imperfective "čita" for habitual activity ("svake večeri"). Process-focused, not completion-focused.',
    difficultyLevel: "easy",
  },
];

export const INTERROGATIVE_PRONOUNS_TEST_CASES: TestCase[] = [
  {
    id: "ip_01",
    exerciseType: "interrogativePronouns",
    question: "_____ knjiga ti se najviše sviđa?",
    userAnswer: "Koja",
    expectedCorrect: true,
    expectedExplanation: 'Feminine nominative singular "koja" agrees with "knjiga" (feminine noun) as subject.',
    difficultyLevel: "easy",
  },
  {
    id: "ip_02",
    exerciseType: "interrogativePronouns",
    question: "S _____ osobom ideš u kino?",
    userAnswer: "kojom",
    expectedCorrect: true,
    expectedExplanation:
      'Instrumental case "kojom" (feminine singular) after preposition "s" (with), agreeing with "osobom".',
    difficultyLevel: "medium",
  },
  {
    id: "ip_03",
    exerciseType: "interrogativePronouns",
    question: "O _____ filmovima govorite?",
    userAnswer: "kojim",
    expectedCorrect: true,
    alternativeCorrectAnswers: ["kakvim"],
    expectedExplanation:
      'Locative plural masculine "kojim" after "o" (about). "Kakvim" (what kind of) is also acceptable.',
    difficultyLevel: "hard",
  },
  {
    id: "ip_04",
    exerciseType: "interrogativePronouns",
    question: "_____ knjiga ti se najviše sviđa?",
    userAnswer: "Koju",
    expectedCorrect: false,
    expectedExplanation:
      'Incorrect case. "Koju" is accusative, but here we need nominative "koja" because "knjiga" is the subject.',
    difficultyLevel: "medium",
  },
  {
    id: "ip_05",
    exerciseType: "interrogativePronouns",
    question: "_____ djecu vidite u parku?",
    userAnswer: "Koju",
    expectedCorrect: true,
    expectedExplanation:
      "“Djeca” is a plural noun with irregular accusative form “djecu” (like feminine singular). “Koju” agrees in form here due to accusative case, though it may look like feminine singular.",
    difficultyLevel: "hard",
  },
  {
    id: "ip_06",
    exerciseType: "interrogativePronouns",
    question: "U _____ gradu živite?",
    userAnswer: "kojem",
    expectedCorrect: true,
    expectedExplanation: 'Locative masculine singular "kojem" after "u" (in), agreeing with "gradu".',
    difficultyLevel: "medium",
  },
];

// Combined test cases
export const ALL_TEST_CASES: TestCase[] = [
  ...VERB_TENSES_TEST_CASES,
  ...NOUN_DECLENSION_TEST_CASES,
  ...VERB_ASPECT_TEST_CASES,
  ...INTERROGATIVE_PRONOUNS_TEST_CASES,
];

// Export by exercise type for easy filtering
export const TEST_CASES_BY_TYPE = {
  verbTenses: VERB_TENSES_TEST_CASES,
  nounDeclension: NOUN_DECLENSION_TEST_CASES,
  verbAspect: VERB_ASPECT_TEST_CASES,
  interrogativePronouns: INTERROGATIVE_PRONOUNS_TEST_CASES,
} as const;

// Utility functions
export function getTestCasesByType(exerciseType: keyof typeof TEST_CASES_BY_TYPE): TestCase[] {
  return TEST_CASES_BY_TYPE[exerciseType];
}

export function getTestCasesByDifficulty(difficulty: "easy" | "medium" | "hard"): TestCase[] {
  return ALL_TEST_CASES.filter((tc) => tc.difficultyLevel === difficulty);
}

export function isAnswerAcceptable(testCase: TestCase, userAnswer: string): boolean {
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  const normalizedExpectedAnswer = testCase.userAnswer.toLowerCase().trim();

  if (normalizedUserAnswer === normalizedExpectedAnswer) {
    return true;
  }

  if (testCase.alternativeCorrectAnswers) {
    return testCase.alternativeCorrectAnswers.some((alt) => alt.toLowerCase().trim() === normalizedUserAnswer);
  }

  return false;
}
