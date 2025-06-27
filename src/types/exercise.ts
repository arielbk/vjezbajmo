// Data models for Croatian language exercises

export interface SentenceExercise {
  id: number | string; // number for static, string (UUID) for generated
  text: string;
  correctAnswer: string | string[]; // Support multiple correct answers
  explanation: string;
  isPlural?: boolean; // Indicates if the answer should be plural
}

// Specialized interface for verb aspect exercises with radio button options
export interface VerbAspectExercise extends SentenceExercise {
  exerciseSubType: 'verb-aspect';
  options: {
    imperfective: string;
    perfective: string;
  };
  correctAspect: 'imperfective' | 'perfective';
}

export interface ParagraphExerciseSet {
  id: string; // Unique ID (UUID) for the entire generated set
  paragraph: string; // The template with blanks
  questions: {
    id: string; // Unique ID (UUID) for each blank
    blankNumber: number;
    baseForm: string;
    correctAnswer: string | string[]; // Support multiple correct answers
    explanation: string;
    isPlural?: boolean; // Indicates if the answer should be plural
  }[];
}

export interface SentenceExerciseSet {
  id: string; // Unique ID (UUID) for the entire generated set
  exercises: SentenceExercise[];
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
  correctAnswer?: string | string[];
  diacriticWarning?: boolean; // True if correct except for diacritics
  matchedAnswer?: string; // The specific correct answer that was matched
}

// For result display
export interface ExerciseResult {
  questionId: string | number;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  correctAnswer?: string | string[];
  diacriticWarning?: boolean; // True if correct except for diacritics
  matchedAnswer?: string; // The specific correct answer that was matched
}

// For session management
export interface ExerciseSession {
  exerciseType: ExerciseType;
  results: ExerciseResult[];
  completed: boolean;
  mistakeQuestions: (string | number)[];
  previousAnswers?: Record<string, string>; // Store previous answers for review/retry
  isReviewMode?: boolean; // Track if session is in review mode
}

// For enhanced completion tracking
export interface CompletedExerciseRecord {
  exerciseId: string;
  exerciseType: ExerciseType;
  completedAt: number; // timestamp
  score: {
    correct: number;
    total: number;
    percentage: number;
  };
  cefrLevel: CefrLevel;
  theme?: string;
  attemptNumber: number; // Track multiple attempts at same exercise
  title?: string; // Optional title for better display
  bestScore?: number; // Track highest percentage achieved
}

// For exercise performance analytics
export interface ExercisePerformanceStats {
  totalCompleted: number;
  averageScore: number;
  exerciseTypeStats: Record<
    ExerciseType,
    {
      completed: number;
      averageScore: number;
      lastAttempted?: number;
    }
  >;
  recentActivity: CompletedExerciseRecord[];
}
