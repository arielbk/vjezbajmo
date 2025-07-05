"use client";

import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { getExerciseSourceInfo } from "@/lib/exercise-source-utils";
import { BookOpen, Sparkles } from "lucide-react";
import type { ExerciseType, CefrLevel } from "@/types/exercise";

interface ExerciseInfoButtonProps {
  exerciseId: string;
  exerciseType: ExerciseType;
  cefrLevel: CefrLevel;
  currentIndex?: number;
  totalCount?: number;
}

export function ExerciseInfoButton({ 
  exerciseId, 
  exerciseType, 
  cefrLevel,
  currentIndex,
  totalCount 
}: ExerciseInfoButtonProps) {
  const sourceInfo = getExerciseSourceInfo(exerciseId, exerciseType);

  return (
    <ExerciseInfoModal exerciseId={exerciseId} exerciseType={exerciseType} cefrLevel={cefrLevel}>
      <button className="flex items-center gap-2 px-3 py-2 text-sm sm:text-base text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border hover:border-primary/50 rounded-lg transition-all duration-200 cursor-pointer group">
        {sourceInfo.isStatic ? (
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
        ) : (
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
        )}
        <span className="font-medium">
          {currentIndex && totalCount ? `${currentIndex}/${totalCount}` : sourceInfo.indicator}
        </span>
      </button>
    </ExerciseInfoModal>
  );
}
