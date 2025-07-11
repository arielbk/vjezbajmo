"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ExerciseType,
  CefrLevel,
  ParagraphExerciseSet,
  SentenceExerciseSet,
  ExerciseSession,
  ExerciseResult,
  CheckAnswerResponse,
} from "@/types/exercise";
import { clerkUserProgressService } from "@/lib/clerk-user-progress";
import {
  getNextStaticWorksheet,
  hasRemainingStaticWorksheets,
  convertWorksheetToExerciseSet,
  getStaticWorksheets,
} from "@/lib/static-worksheets";

// Add debugging to verify static worksheets are loading
if (typeof window !== "undefined") {
  console.log("Static worksheets available:", {
    verbTenses: getStaticWorksheets("verbTenses").length,
    nounDeclension: getStaticWorksheets("nounDeclension").length,
    verbAspect: getStaticWorksheets("verbAspect").length,
    relativePronouns: getStaticWorksheets("relativePronouns").length,
  });
}

interface ExerciseState {
  currentExerciseType: ExerciseType | null;
  verbAspectExercises: SentenceExerciseSet;
  relativePronounsExercises: SentenceExerciseSet;
  verbTensesParagraph: ParagraphExerciseSet;
  nounAdjectiveParagraph: ParagraphExerciseSet;
  currentSession: ExerciseSession | null;
  apiKey: string | null;
  selectedProvider: "openai" | "anthropic";
  cefrLevel: CefrLevel;
  isGenerating: boolean;
  error: string | null;
  recentlyServedExercises: Record<ExerciseType, string[]>; // Track recently served exercise IDs per type
}

type ExerciseAction =
  | { type: "SET_EXERCISE_TYPE"; payload: ExerciseType }
  | { type: "SET_API_KEY"; payload: string }
  | { type: "CLEAR_API_KEY" }
  | { type: "SET_PROVIDER"; payload: "openai" | "anthropic" }
  | { type: "SET_CEFR_LEVEL"; payload: CefrLevel }
  | {
      type: "START_SESSION";
      payload: { exerciseType: ExerciseType; previousAnswers?: Record<string, string>; isReviewMode?: boolean };
    }
  | { type: "ADD_RESULT"; payload: ExerciseResult }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" }
  | {
      type: "SET_GENERATED_EXERCISES";
      payload: { exerciseType: ExerciseType; data: ParagraphExerciseSet | SentenceExerciseSet };
    }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "START_REVIEW_MISTAKES"; payload: { session: ExerciseSession; previousAnswers: Record<string, string> } }
  | { type: "MARK_EXERCISE_COMPLETED"; payload: { exerciseId: string; exerciseType: ExerciseType; theme?: string } }
  | { type: "STORE_SESSION_ANSWERS"; payload: Record<string, string> };

const initialState: ExerciseState = {
  currentExerciseType: null,
  verbAspectExercises: {
    id: "loading",
    exercises: [],
  },
  relativePronounsExercises: {
    id: "loading",
    exercises: [],
  },
  verbTensesParagraph: {
    id: "loading",
    paragraph: "",
    questions: [],
  },
  nounAdjectiveParagraph: {
    id: "loading",
    paragraph: "",
    questions: [],
  },
  currentSession: null,
  apiKey: null,
  selectedProvider: "openai",
  cefrLevel: "A2.2", // Default CEFR level as per spec
  isGenerating: false,
  error: null,
  recentlyServedExercises: {
    verbTenses: [],
    nounDeclension: [],
    verbAspect: [],
    relativePronouns: [],
  },
};

function exerciseReducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
  switch (action.type) {
    case "SET_EXERCISE_TYPE":
      return { ...state, currentExerciseType: action.payload, error: null };

    case "SET_API_KEY":
      return { ...state, apiKey: action.payload };

    case "CLEAR_API_KEY":
      return { ...state, apiKey: null };

    case "SET_PROVIDER":
      return { ...state, selectedProvider: action.payload };

    case "SET_CEFR_LEVEL":
      return { ...state, cefrLevel: action.payload };

    case "START_SESSION":
      // For new sessions (not review mode), try to load a static worksheet first
      let updatedState = {
        ...state,
        currentSession: {
          exerciseType: action.payload.exerciseType,
          results: [],
          completed: false,
          mistakeQuestions: [],
          previousAnswers: action.payload.previousAnswers,
          isReviewMode: action.payload.isReviewMode || false,
        },
        error: null,
      };

      // If not in review mode, try to load a static worksheet
      if (!action.payload.isReviewMode) {
        const nextWorksheet = getNextStaticWorksheet(action.payload.exerciseType, state.cefrLevel);
        if (nextWorksheet) {
          const exerciseSet = convertWorksheetToExerciseSet(nextWorksheet, action.payload.exerciseType);

          // Update the appropriate exercise data
          if (action.payload.exerciseType === "verbTenses") {
            updatedState = { ...updatedState, verbTensesParagraph: exerciseSet as ParagraphExerciseSet };
          } else if (action.payload.exerciseType === "nounDeclension") {
            updatedState = { ...updatedState, nounAdjectiveParagraph: exerciseSet as ParagraphExerciseSet };
          } else if (action.payload.exerciseType === "verbAspect") {
            updatedState = { ...updatedState, verbAspectExercises: exerciseSet as SentenceExerciseSet };
          } else if (action.payload.exerciseType === "relativePronouns") {
            updatedState = { ...updatedState, relativePronounsExercises: exerciseSet as SentenceExerciseSet };
          }
        } else {
          // No static worksheet available - get the first one regardless of completion status
          // This ensures we always have something to show, even if all exercises are completed
          const allWorksheets = getStaticWorksheets(action.payload.exerciseType);
          const levelWorksheets = allWorksheets.filter((w) => w.cefrLevel === state.cefrLevel);
          
          if (levelWorksheets.length > 0) {
            const firstWorksheet = levelWorksheets[0];
            const exerciseSet = convertWorksheetToExerciseSet(firstWorksheet, action.payload.exerciseType);
            
            // Update the appropriate exercise data
            if (action.payload.exerciseType === "verbTenses") {
              updatedState = { ...updatedState, verbTensesParagraph: exerciseSet as ParagraphExerciseSet };
            } else if (action.payload.exerciseType === "nounDeclension") {
              updatedState = { ...updatedState, nounAdjectiveParagraph: exerciseSet as ParagraphExerciseSet };
            } else if (action.payload.exerciseType === "verbAspect") {
              updatedState = { ...updatedState, verbAspectExercises: exerciseSet as SentenceExerciseSet };
            } else if (action.payload.exerciseType === "relativePronouns") {
              updatedState = { ...updatedState, relativePronounsExercises: exerciseSet as SentenceExerciseSet };
            }
          }
        }
      }

      return updatedState;

    case "ADD_RESULT":
      if (!state.currentSession) return state;

      const updatedResults = [...state.currentSession.results, action.payload];
      const mistakeQuestions = action.payload.correct
        ? state.currentSession.mistakeQuestions
        : [...state.currentSession.mistakeQuestions];

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          results: updatedResults,
          mistakeQuestions,
        },
      };

    case "COMPLETE_SESSION":
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          completed: true,
        },
      };

    case "RESET_SESSION":
      return { ...state, currentSession: null, error: null };

    case "SET_GENERATED_EXERCISES":
      const { exerciseType, data } = action.payload;

      if (exerciseType === "verbTenses") {
        return { ...state, verbTensesParagraph: data as ParagraphExerciseSet };
      } else if (exerciseType === "nounDeclension") {
        return { ...state, nounAdjectiveParagraph: data as ParagraphExerciseSet };
      } else if (exerciseType === "verbAspect") {
        const sentenceData = data as SentenceExerciseSet;
        return { ...state, verbAspectExercises: sentenceData };
      } else if (exerciseType === "relativePronouns") {
        const sentenceData = data as SentenceExerciseSet;
        return { ...state, relativePronounsExercises: sentenceData };
      }

      return state;

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "START_REVIEW_MISTAKES":
      return {
        ...state,
        currentSession: {
          exerciseType: action.payload.session.exerciseType,
          results: [],
          completed: false,
          mistakeQuestions: action.payload.session.mistakeQuestions,
          previousAnswers: action.payload.previousAnswers,
          isReviewMode: true,
        },
      };

    case "STORE_SESSION_ANSWERS":
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          previousAnswers: action.payload,
        },
      };

    case "MARK_EXERCISE_COMPLETED":
      // This is handled in the context provider function, not in the reducer
      return state;

    default:
      return state;
  }
}

const ExerciseContext = createContext<{
  state: ExerciseState;
  dispatch: React.Dispatch<ExerciseAction>;
  forceRegenerateExercise: (exerciseType: ExerciseType, theme?: string) => Promise<void>;
  loadNextStaticWorksheet: (exerciseType: ExerciseType, theme?: string) => boolean;
  loadSpecificStaticWorksheet: (exerciseId: string, exerciseType: ExerciseType) => boolean;
  hasRemainingStaticWorksheets: (exerciseType: ExerciseType, theme?: string) => boolean;
  regenerateAllExercises: (theme?: string) => Promise<void>;
  checkAnswer: (questionId: string, userAnswer: string) => Promise<CheckAnswerResponse>;
  markExerciseCompleted: (
    exerciseId: string,
    exerciseType: ExerciseType,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string
  ) => void;
  storeSessionAnswers: (answers: Record<string, string>) => void;
  startReviewMistakesSession: (previousAnswers: Record<string, string>) => void;
} | null>(null);

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);
  const { userId, isSignedIn } = useAuth();

  // Auto-migrate progress when user signs in
  useEffect(() => {
    if (isSignedIn && userId) {
      const migrateProgress = async () => {
        try {
          await clerkUserProgressService.migrateLocalProgressToUser(userId);
        } catch (error) {
          console.error('Failed to migrate user progress:', error);
        }
      };
      
      migrateProgress();
    }
  }, [isSignedIn, userId]);

  // Load API key, provider, and CEFR level from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("vjezbajmo-api-key");
    if (savedApiKey) {
      dispatch({ type: "SET_API_KEY", payload: savedApiKey });
    }

    const savedProvider = localStorage.getItem("vjezbajmo-provider");
    if (savedProvider === "openai" || savedProvider === "anthropic") {
      dispatch({ type: "SET_PROVIDER", payload: savedProvider });
    }

    const savedCefrLevel = localStorage.getItem("vjezbajmo-cefr-level");
    if (
      savedCefrLevel === "A1" ||
      savedCefrLevel === "A2.1" ||
      savedCefrLevel === "A2.2" ||
      savedCefrLevel === "B1.1"
    ) {
      dispatch({ type: "SET_CEFR_LEVEL", payload: savedCefrLevel });
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (state.apiKey) {
      localStorage.setItem("vjezbajmo-api-key", state.apiKey);
    } else {
      localStorage.removeItem("vjezbajmo-api-key");
    }
  }, [state.apiKey]);

  // Save provider and CEFR level to localStorage when they change
  useEffect(() => {
    localStorage.setItem("vjezbajmo-provider", state.selectedProvider);
  }, [state.selectedProvider]);

  useEffect(() => {
    localStorage.setItem("vjezbajmo-cefr-level", state.cefrLevel);
  }, [state.cefrLevel]);

  // Save CEFR level to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("vjezbajmo-cefr-level", state.cefrLevel);
  }, [state.cefrLevel]);

  const loadNextStaticWorksheet = (exerciseType: ExerciseType, theme?: string): boolean => {
    const nextWorksheet = getNextStaticWorksheet(exerciseType, state.cefrLevel, theme);

    if (!nextWorksheet) {
      return false; // No more static worksheets available
    }

    // Convert worksheet to the format expected by components
    const exerciseSet = convertWorksheetToExerciseSet(nextWorksheet, exerciseType);

    // Dispatch the loaded exercise data
    dispatch({
      type: "SET_GENERATED_EXERCISES",
      payload: { exerciseType, data: exerciseSet },
    });

    return true; // Successfully loaded static worksheet
  };

  const loadSpecificStaticWorksheet = (exerciseId: string, exerciseType: ExerciseType): boolean => {
    // Use existing utility to get all static worksheets
    const allWorksheets = getStaticWorksheets(exerciseType);

    const targetWorksheet = allWorksheets.find((w) => w.id === exerciseId && w.cefrLevel === state.cefrLevel);

    if (!targetWorksheet) {
      return false; // Worksheet not found
    }

    // Convert worksheet to the format expected by components
    const exerciseSet = convertWorksheetToExerciseSet(targetWorksheet, exerciseType);

    // Dispatch the loaded exercise data
    dispatch({
      type: "SET_GENERATED_EXERCISES",
      payload: { exerciseType, data: exerciseSet },
    });

    return true; // Successfully loaded specific worksheet
  };

  const forceRegenerateExercise = async (exerciseType: ExerciseType, theme?: string) => {
    dispatch({ type: "SET_GENERATING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      // Get user's completed exercises for this type/level/theme using Clerk service
      const completedExercises = await clerkUserProgressService.getCompletedExercises(
        exerciseType, 
        state.cefrLevel, 
        theme, 
        userId || undefined
      );

      const requestBody: {
        exerciseType: ExerciseType;
        cefrLevel: CefrLevel;
        theme?: string;
        provider?: "openai" | "anthropic";
        apiKey?: string;
        userCompletedExercises?: string[];
        forceRegenerate?: boolean;
      } = {
        exerciseType,
        cefrLevel: state.cefrLevel,
        theme,
        userCompletedExercises: completedExercises,
        forceRegenerate: true, // Force new generation, bypass cache
      };

      // Include user's API key and provider if available
      if (state.apiKey) {
        requestBody.apiKey = state.apiKey;
        requestBody.provider = state.selectedProvider;
      }

      const response = await fetch("/api/generate-exercise-set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate exercises");
      }

      const data = await response.json();
      dispatch({ type: "SET_GENERATED_EXERCISES", payload: { exerciseType, data } });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to generate exercises",
      });
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  };

  const regenerateAllExercises = async (theme?: string) => {
    const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "relativePronouns"];

    dispatch({ type: "SET_GENERATING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const promises = exerciseTypes.map(async (exerciseType) => {
        // Get user's completed exercises for this type/level/theme using Clerk service
        const completedExercises = await clerkUserProgressService.getCompletedExercises(
          exerciseType, 
          state.cefrLevel, 
          theme, 
          userId || undefined
        );

        const requestBody: {
          exerciseType: ExerciseType;
          cefrLevel: CefrLevel;
          theme?: string;
          provider?: "openai" | "anthropic";
          apiKey?: string;
          userCompletedExercises?: string[];
        } = {
          exerciseType,
          cefrLevel: state.cefrLevel,
          theme,
          userCompletedExercises: completedExercises,
        };

        // Include user's API key and provider if available
        if (state.apiKey) {
          requestBody.apiKey = state.apiKey;
          requestBody.provider = state.selectedProvider;
        }

        const response = await fetch("/api/generate-exercise-set", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate ${exerciseType}: ${errorData.error || "Unknown error"}`);
        }

        const data = await response.json();
        return { exerciseType, data };
      });

      const results = await Promise.all(promises);

      results.forEach(({ exerciseType, data }) => {
        dispatch({ type: "SET_GENERATED_EXERCISES", payload: { exerciseType, data } });
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to generate exercises",
      });
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  };

  const checkAnswer = async (questionId: string, userAnswer: string) => {
    // For static exercises (numeric IDs), check locally
    if (typeof questionId === "string" && !isNaN(Number(questionId))) {
      // This is a static exercise, handle locally
      // Implementation would depend on finding the correct answer from static data
      throw new Error("Static answer checking not implemented in context");
    }

    // For generated exercises (UUID strings), check with API
    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId, userAnswer }),
      });

      if (!response.ok) {
        throw new Error("Failed to check answer");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to check answer");
    }
  };

  const markExerciseCompleted = async (
    exerciseId: string,
    exerciseType: ExerciseType,
    theme?: string,
    scoreData?: { correct: number; total: number },
    title?: string
  ) => {
    await clerkUserProgressService.markExerciseCompleted(
      exerciseId, 
      exerciseType, 
      state.cefrLevel, 
      theme, 
      scoreData, 
      title, 
      userId || undefined
    );
  };

  const storeSessionAnswers = (answers: Record<string, string>) => {
    dispatch({ type: "STORE_SESSION_ANSWERS", payload: answers });
  };

  const startReviewMistakesSession = (previousAnswers: Record<string, string>) => {
    if (state.currentSession) {
      dispatch({
        type: "START_REVIEW_MISTAKES",
        payload: {
          session: state.currentSession,
          previousAnswers,
        },
      });
    }
  };

  const hasRemainingStaticWorksheetsFunc = (exerciseType: ExerciseType, theme?: string): boolean => {
    return hasRemainingStaticWorksheets(exerciseType, state.cefrLevel, theme);
  };

  return (
    <ExerciseContext.Provider
      value={{
        state,
        dispatch,
        forceRegenerateExercise,
        loadNextStaticWorksheet,
        loadSpecificStaticWorksheet,
        hasRemainingStaticWorksheets: hasRemainingStaticWorksheetsFunc,
        regenerateAllExercises,
        checkAnswer,
        markExerciseCompleted,
        storeSessionAnswers,
        startReviewMistakesSession,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error("useExercise must be used within ExerciseProvider");
  }
  return context;
}
