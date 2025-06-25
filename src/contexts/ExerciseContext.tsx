"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  ExerciseType,
  CefrLevel,
  SentenceExercise,
  ParagraphExerciseSet,
  ExerciseSession,
  ExerciseResult,
  CheckAnswerResponse,
} from "@/types/exercise";

// Static exercise imports
import verbAspectData from "@/data/verb-aspect-exercises.json";
import interrogativePronounsData from "@/data/interrogative-pronouns-exercises.json";
import verbTensesData from "@/data/verb-tenses-paragraph.json";
import nounAdjectiveData from "@/data/noun-adjective-paragraph.json";

interface ExerciseState {
  currentExerciseType: ExerciseType | null;
  verbAspectExercises: SentenceExercise[];
  interrogativePronounsExercises: SentenceExercise[];
  verbTensesParagraph: ParagraphExerciseSet;
  nounAdjectiveParagraph: ParagraphExerciseSet;
  currentSession: ExerciseSession | null;
  apiKey: string | null;
  selectedProvider: "openai" | "anthropic";
  cefrLevel: CefrLevel;
  isGenerating: boolean;
  error: string | null;
}

type ExerciseAction =
  | { type: "SET_EXERCISE_TYPE"; payload: ExerciseType }
  | { type: "SET_API_KEY"; payload: string }
  | { type: "CLEAR_API_KEY" }
  | { type: "SET_PROVIDER"; payload: "openai" | "anthropic" }
  | { type: "SET_CEFR_LEVEL"; payload: CefrLevel }
  | { type: "START_SESSION"; payload: { exerciseType: ExerciseType } }
  | { type: "ADD_RESULT"; payload: ExerciseResult }
  | { type: "COMPLETE_SESSION" }
  | { type: "RESET_SESSION" }
  | {
      type: "SET_GENERATED_EXERCISES";
      payload: { exerciseType: ExerciseType; data: ParagraphExerciseSet | { exercises: SentenceExercise[] } };
    }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "START_REVIEW_MISTAKES"; payload: ExerciseSession };

const initialState: ExerciseState = {
  currentExerciseType: null,
  verbAspectExercises: verbAspectData.exercises,
  interrogativePronounsExercises: interrogativePronounsData.exercises,
  verbTensesParagraph: verbTensesData as ParagraphExerciseSet,
  nounAdjectiveParagraph: nounAdjectiveData as ParagraphExerciseSet,
  currentSession: null,
  apiKey: null,
  selectedProvider: "openai",
  cefrLevel: "A2.2", // Default CEFR level as per spec
  isGenerating: false,
  error: null,
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
      return {
        ...state,
        currentSession: {
          exerciseType: action.payload.exerciseType,
          results: [],
          completed: false,
          mistakeQuestions: [],
        },
        error: null,
      };

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
        const sentenceData = data as { exercises: SentenceExercise[] };
        return { ...state, verbAspectExercises: sentenceData.exercises };
      } else if (exerciseType === "interrogativePronouns") {
        const sentenceData = data as { exercises: SentenceExercise[] };
        return { ...state, interrogativePronounsExercises: sentenceData.exercises };
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
          exerciseType: action.payload.exerciseType,
          results: [],
          completed: false,
          mistakeQuestions: action.payload.mistakeQuestions,
        },
      };

    default:
      return state;
  }
}

const ExerciseContext = createContext<{
  state: ExerciseState;
  dispatch: React.Dispatch<ExerciseAction>;
  generateExercises: (exerciseType: ExerciseType, theme?: string) => Promise<void>;
  regenerateAllExercises: (theme?: string) => Promise<void>;
  checkAnswer: (questionId: string, userAnswer: string) => Promise<CheckAnswerResponse>;
} | null>(null);

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);

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

  const generateExercises = async (exerciseType: ExerciseType, theme?: string) => {
    dispatch({ type: "SET_GENERATING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const requestBody: {
        exerciseType: ExerciseType;
        cefrLevel: CefrLevel;
        theme?: string;
        provider?: "openai" | "anthropic";
        apiKey?: string;
      } = {
        exerciseType,
        cefrLevel: state.cefrLevel,
        theme,
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
    const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "interrogativePronouns"];

    dispatch({ type: "SET_GENERATING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const promises = exerciseTypes.map(async (exerciseType) => {
        const requestBody: {
          exerciseType: ExerciseType;
          cefrLevel: CefrLevel;
          theme?: string;
          provider?: "openai" | "anthropic";
          apiKey?: string;
        } = {
          exerciseType,
          cefrLevel: state.cefrLevel,
          theme,
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

  return (
    <ExerciseContext.Provider value={{ state, dispatch, generateExercises, regenerateAllExercises, checkAnswer }}>
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
