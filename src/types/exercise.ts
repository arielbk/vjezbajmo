// Data models for Croatian language exercises

export interface SentenceExercise {
  id: number | string; // number for static, string (UUID) for generated
  text: string;
  correctAnswer: string;
  explanation: string;
}

export interface ParagraphExerciseSet {
  id: string; // Unique ID (UUID) for the entire generated set
  paragraph: string; // The template with blanks
  questions: {
    id: string; // Unique ID (UUID) for each blank
    blankNumber: number;
    baseForm: string;
    correctAnswer: string;
    explanation: string;
  }[];
}

export type ExerciseType = "verbTenses" | "nounDeclension" | "verbAspect" | "interrogativePronouns";

export type CefrLevel = "A1" | "A2.1" | "A2.2" | "B1.1";

export interface GenerateExerciseRequest {
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  provider?: "openai" | "anthropic"; // Optional - falls back to site provider
  apiKey?: string; // Optional - falls back to site key
  theme?: string;
}

export interface CheckAnswerRequest {
  questionId: string;
  userAnswer: string;
}

export interface CheckAnswerResponse {
  correct: boolean;
  explanation: string;
  correctAnswer?: string;
}

// For result display
export interface ExerciseResult {
  questionId: string | number;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  correctAnswer?: string;
}

// For session management
export interface ExerciseSession {
  exerciseType: ExerciseType;
  results: ExerciseResult[];
  completed: boolean;
  mistakeQuestions: (string | number)[];
}
