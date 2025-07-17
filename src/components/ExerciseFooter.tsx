"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useExercise } from "@/contexts/ExerciseContext";
import { RotateCcw, ArrowRight, RefreshCw } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { toast } from "sonner";
import type { ExerciseType } from "@/types/exercise";

interface ExerciseFooterProps {
  exerciseType: ExerciseType;
  correctAnswers: number;
  totalAnswers: number;
  isReviewMode?: boolean;
  onTryAgain: () => void;
  onComplete: () => void;
}

export function ExerciseFooter({
  exerciseType,
  correctAnswers,
  totalAnswers,
  isReviewMode = false,
  onTryAgain,
  onComplete,
}: ExerciseFooterProps) {
  const router = useRouter();
  const { dispatch, forceRegenerateExercise, loadNextStaticWorksheet, hasRemainingStaticWorksheets } = useExercise();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  const handleNextExercise = async () => {
    setIsGeneratingNext(true);
    try {
      // First, check if there are remaining static worksheets
      const hasMoreStatic = hasRemainingStaticWorksheets(exerciseType);

      if (hasMoreStatic) {
        // Load the next static worksheet
        const success = loadNextStaticWorksheet(exerciseType);
        if (success) {
          // Start new session and navigate to exercise
          dispatch({ type: "START_SESSION", payload: { exerciseType } });
          router.push(`/exercise/${exerciseType}`);
          return;
        }
      }

      // If no static worksheets remain, generate a new exercise
      await forceRegenerateExercise(exerciseType);
      dispatch({ type: "START_SESSION", payload: { exerciseType } });
      router.push(`/exercise/${exerciseType}`);
    } catch (error) {
      console.error("Failed to load next exercise:", error);
      toast.error("Failed to generate new exercise. Please try again.");
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const handleNextExerciseForSignedOut = async () => {
    // For signed out users, we only allow going to next static exercise
    const hasMoreStatic = hasRemainingStaticWorksheets(exerciseType);
    
    if (hasMoreStatic) {
      setIsGeneratingNext(true);
      try {
        const success = loadNextStaticWorksheet(exerciseType);
        if (success) {
          dispatch({ type: "START_SESSION", payload: { exerciseType } });
          router.push(`/exercise/${exerciseType}`);
        }
      } catch (error) {
        console.error("Failed to load next exercise:", error);
        toast.error("Failed to load next exercise. Please try again.");
      } finally {
        setIsGeneratingNext(false);
      }
    }
  };

  const percentageScore = Math.round((correctAnswers / totalAnswers) * 100);
  const hasMoreStatic = hasRemainingStaticWorksheets(exerciseType);

  if (isReviewMode) {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold">
          Review Complete! Final Score: {correctAnswers}/{totalAnswers} ({percentageScore}%)
        </div>
        <p className="text-sm text-muted-foreground">
          Review complete! You can practice again or go back to see your results.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={onTryAgain} variant="outline" size="lg">
            Try Again
          </Button>
          <Button onClick={onComplete} size="lg">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-lg font-semibold">
        Exercise Complete! Final Score: {correctAnswers}/{totalAnswers} ({percentageScore}%)
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onTryAgain} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>

        <SignedIn>
          <Button
            onClick={handleNextExercise}
            size="lg"
            disabled={isGeneratingNext}
          >
            {isGeneratingNext ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Next Exercise
              </>
            )}
          </Button>
        </SignedIn>

        <SignedOut>
          {hasMoreStatic ? (
            <Button
              onClick={handleNextExerciseForSignedOut}
              size="lg"
              disabled={isGeneratingNext}
            >
              {isGeneratingNext ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Next Exercise
                </>
              )}
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Sign In for More Exercises
              </Button>
            </SignInButton>
          )}
        </SignedOut>
      </div>
    </div>
  );
}
