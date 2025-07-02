import { useEffect } from "react";
import { ExerciseResult } from "@/types/exercise";

/**
 * Custom hook to reset exercise component state when exercise set changes
 * @param exerciseSetId - ID of the current exercise set
 * @param setAnswers - Function to set answers state
 * @param setResults - Function to set results state
 * @param setHasChecked - Function to set hasChecked state
 * @param setTheme - Function to set theme state
 */
export function useResetExerciseState(
  exerciseSetId: string,
  setAnswers: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void,
  setResults: (results: Record<string, ExerciseResult> | ((prev: Record<string, ExerciseResult>) => Record<string, ExerciseResult>)) => void,
  setHasChecked: (hasChecked: boolean) => void,
  setTheme: (theme: string) => void
) {
  useEffect(() => {
    // Reset all local state when we get a new exercise set
    setAnswers({});
    setResults({});
    setHasChecked(false);
    setTheme("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseSetId]);
}
