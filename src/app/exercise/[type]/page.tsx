import { ExerciseProvider } from "@/contexts/ExerciseContext";
import type { ExerciseType } from "@/types/exercise";
import ExerciseClient from "./exercise-client";

export default async function ExercisePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const exerciseType = type as ExerciseType;

  return (
    <ExerciseProvider>
      <ExerciseClient exerciseType={exerciseType} />
    </ExerciseProvider>
  );
}
