import type { ExerciseType } from "@/types/exercise";
import ExerciseByIdClient from "./exercise-by-id-client";

export default async function ExerciseByIdPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const exerciseType = type as ExerciseType;

  return <ExerciseByIdClient exerciseType={exerciseType} exerciseId={id} />;
}
