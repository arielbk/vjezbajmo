import type { ExerciseType } from "@/types/exercise";
import ResultsClient from "./results-client";

export default async function ResultsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const exerciseType = type as ExerciseType;

  return <ResultsClient exerciseType={exerciseType} />;
}
