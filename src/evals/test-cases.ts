// Test cases for evaluating AI-generated Croatian grammar exercise sets

export interface GenerationTestCase {
  id: string;
  description: string;
  request: {
    exerciseType: "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns";
    cefrLevel: "A1" | "A2.1" | "A2.2" | "B1.1";
    theme?: string;
  };
  expectedCriteria: {
    // Structure requirements
    minQuestions: number;
    maxQuestions: number;
    hasExplanations: boolean;
    hasCorrectAnswers: boolean;
    
    // Content quality expectations
    cefrLevelMatch: boolean; // Should match requested CEFR level
    themeAdherence?: boolean; // Should follow theme if provided
    grammarAccuracy: boolean; // Croatian grammar should be correct
    explanationQuality: "basic" | "good" | "excellent"; // Expected explanation quality
    vocabularyAppropriate: boolean; // Vocabulary should match CEFR level
    
    // Exercise type specific
    exerciseTypeSpecific?: {
      verbTenses?: {
        coversDifferentTenses: boolean;
        includesPersonalEndings: boolean;
      };
      nounDeclension?: {
        coversDifferentCases: boolean;
        includesDifferentGenders: boolean;
      };
      verbAspect?: {
        includesBothAspects: boolean;
        hasAspectOptions: boolean;
      };
      interrogativePronouns?: {
        coversDifferentPronouns: boolean;
        includesContextualUsage: boolean;
      };
    };
  };
}

export const ALL_TEST_CASES: GenerationTestCase[] = [
  // Verb Tenses Tests
  {
    id: "vt-a1-basic",
    description: "Basic A1 verb tenses exercise generation",
    request: {
      exerciseType: "verbTenses",
      cefrLevel: "A1",
    },
    expectedCriteria: {
      minQuestions: 5,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "basic",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        verbTenses: {
          coversDifferentTenses: true,
          includesPersonalEndings: true,
        },
      },
    },
  },
  {
    id: "vt-a2-themed",
    description: "A2.1 verb tenses with food theme",
    request: {
      exerciseType: "verbTenses",
      cefrLevel: "A2.1",
      theme: "food and cooking",
    },
    expectedCriteria: {
      minQuestions: 6,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      themeAdherence: true,
      grammarAccuracy: true,
      explanationQuality: "good",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        verbTenses: {
          coversDifferentTenses: true,
          includesPersonalEndings: true,
        },
      },
    },
  },
  {
    id: "vt-b1-advanced",
    description: "B1.1 verb tenses for advanced learners",
    request: {
      exerciseType: "verbTenses",
      cefrLevel: "B1.1",
    },
    expectedCriteria: {
      minQuestions: 8,
      maxQuestions: 15,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "excellent",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        verbTenses: {
          coversDifferentTenses: true,
          includesPersonalEndings: true,
        },
      },
    },
  },

  // Noun Declension Tests
  {
    id: "nd-a1-basic",
    description: "Basic A1 noun declension exercise generation",
    request: {
      exerciseType: "nounDeclension",
      cefrLevel: "A1",
    },
    expectedCriteria: {
      minQuestions: 5,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "basic",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        nounDeclension: {
          coversDifferentCases: true,
          includesDifferentGenders: true,
        },
      },
    },
  },
  {
    id: "nd-a2-travel",
    description: "A2.2 noun declension with travel theme",
    request: {
      exerciseType: "nounDeclension",
      cefrLevel: "A2.2",
      theme: "travel and transportation",
    },
    expectedCriteria: {
      minQuestions: 6,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      themeAdherence: true,
      grammarAccuracy: true,
      explanationQuality: "good",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        nounDeclension: {
          coversDifferentCases: true,
          includesDifferentGenders: true,
        },
      },
    },
  },

  // Verb Aspect Tests
  {
    id: "va-a1-basic",
    description: "Basic A1 verb aspect exercise generation",
    request: {
      exerciseType: "verbAspect",
      cefrLevel: "A1",
    },
    expectedCriteria: {
      minQuestions: 5,
      maxQuestions: 10,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "basic",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        verbAspect: {
          includesBothAspects: true,
          hasAspectOptions: true,
        },
      },
    },
  },
  {
    id: "va-b1-complex",
    description: "B1.1 verb aspect with complex scenarios",
    request: {
      exerciseType: "verbAspect",
      cefrLevel: "B1.1",
      theme: "work and career",
    },
    expectedCriteria: {
      minQuestions: 8,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      themeAdherence: true,
      grammarAccuracy: true,
      explanationQuality: "excellent",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        verbAspect: {
          includesBothAspects: true,
          hasAspectOptions: true,
        },
      },
    },
  },

  // Interrogative Pronouns Tests
  {
    id: "ip-a1-basic",
    description: "Basic A1 interrogative pronouns exercise generation",
    request: {
      exerciseType: "interrogativePronouns",
      cefrLevel: "A1",
    },
    expectedCriteria: {
      minQuestions: 5,
      maxQuestions: 10,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "basic",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        interrogativePronouns: {
          coversDifferentPronouns: true,
          includesContextualUsage: true,
        },
      },
    },
  },
  {
    id: "ip-a2-family",
    description: "A2.1 interrogative pronouns with family theme",
    request: {
      exerciseType: "interrogativePronouns",
      cefrLevel: "A2.1",
      theme: "family and relationships",
    },
    expectedCriteria: {
      minQuestions: 6,
      maxQuestions: 10,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      themeAdherence: true,
      grammarAccuracy: true,
      explanationQuality: "good",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        interrogativePronouns: {
          coversDifferentPronouns: true,
          includesContextualUsage: true,
        },
      },
    },
  },

  // Edge Cases and Stress Tests
  {
    id: "edge-no-theme",
    description: "Exercise generation without theme specification",
    request: {
      exerciseType: "verbTenses",
      cefrLevel: "A2.1",
    },
    expectedCriteria: {
      minQuestions: 5,
      maxQuestions: 12,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      grammarAccuracy: true,
      explanationQuality: "good",
      vocabularyAppropriate: true,
    },
  },
  {
    id: "edge-complex-theme",
    description: "Exercise generation with complex theme",
    request: {
      exerciseType: "nounDeclension",
      cefrLevel: "B1.1",
      theme: "environmental science and climate change",
    },
    expectedCriteria: {
      minQuestions: 8,
      maxQuestions: 15,
      hasExplanations: true,
      hasCorrectAnswers: true,
      cefrLevelMatch: true,
      themeAdherence: true,
      grammarAccuracy: true,
      explanationQuality: "excellent",
      vocabularyAppropriate: true,
      exerciseTypeSpecific: {
        nounDeclension: {
          coversDifferentCases: true,
          includesDifferentGenders: true,
        },
      },
    },
  },
];
