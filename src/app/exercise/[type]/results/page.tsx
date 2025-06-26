import { ExerciseProvider } from "@/contexts/ExerciseContext";
import type { ExerciseType } from "@/types/exercise";
import ResultsClient from "./results-client";

export default async function ResultsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const exerciseType = type as ExerciseType;

  return (
    <ExerciseProvider>
      <ResultsClient exerciseType={exerciseType} />
    </ExerciseProvider>
  );
}
