"use client";

import { ParagraphExercise } from "@/components/ParagraphExercise";
import { SentenceExercise as SentenceExerciseComponent } from "@/components/SentenceExercise";
import { VerbAspectExerciseComponent } from "@/components/VerbAspectExercise";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import type { ParagraphExerciseSet, SentenceExerciseSet, ExerciseType, VerbAspectExercise } from "@/types/exercise";
import { AlertTriangle, Share, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ExerciseData {
  exercise: ParagraphExerciseSet | SentenceExerciseSet;
  exerciseType: ExerciseType;
  cefrLevel: string;
  theme: string | null;
  createdAt: number;
}

export default function ExerciseByIdClient({ 
  exerciseType, 
  exerciseId 
}: { 
  exerciseType: ExerciseType; 
  exerciseId: string;
}) {
  const { dispatch } = useExercise();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseData, setExerciseData] = useState<ExerciseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch the specific exercise by ID
    async function fetchExercise() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/exercise/${exerciseId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Exercise not found. It may have expired or been removed.");
          } else {
            setError("Failed to load exercise");
          }
          return;
        }
        
        const data: ExerciseData = await response.json();
        setExerciseData(data);
        
        // Load the exercise data into the context using the correct action
        dispatch({
          type: "SET_GENERATED_EXERCISES",
          payload: {
            exerciseType: data.exerciseType,
            data: data.exercise,
          },
        });
        
        // Set exercise type and CEFR level
        dispatch({ type: "SET_EXERCISE_TYPE", payload: data.exerciseType });
        dispatch({ type: "SET_CEFR_LEVEL", payload: data.cefrLevel as "A1" | "A2.1" | "A2.2" | "B1.1" });
        
        // Check if this is a review session
        const isReview = searchParams.get("review") === "true";
        const previousAnswersParam = searchParams.get("answers");
        let previousAnswers: Record<string, string> | undefined;

        if (isReview && previousAnswersParam) {
          try {
            previousAnswers = JSON.parse(decodeURIComponent(previousAnswersParam));
          } catch (error) {
            console.error("Failed to parse previous answers:", error);
          }
        }

        dispatch({
          type: "START_SESSION",
          payload: {
            exerciseType: data.exerciseType,
            previousAnswers,
            isReviewMode: isReview,
          },
        });
        
      } catch (err) {
        console.error("Failed to fetch exercise:", err);
        setError("Failed to load exercise");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExercise();
  }, [exerciseId, dispatch, searchParams]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Croatian Exercise - ${exerciseType}`,
          text: `Check out this Croatian language exercise!`,
          url: url,
        });
        return;
      } catch {
        // Fall back to clipboard if sharing fails
      }
    }
    
    // Copy to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exercise...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="mt-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return null;
  }

  const renderExerciseComponent = () => {
    const currentData = exerciseData.exercise;

    if (exerciseType === "verbTenses" || exerciseType === "nounDeclension") {
      return (
        <ParagraphExercise
          exerciseSet={currentData as ParagraphExerciseSet}
          exerciseType={exerciseType}
          onComplete={() => {}}
          title={`${exerciseType.replace(/([A-Z])/g, ' $1')} Exercise`}
        />
      );
    } else {
      const sentenceData = currentData as SentenceExerciseSet;
      
      // Check if this is a verb aspect exercise
      if (exerciseType === "verbAspect" && sentenceData.exercises.length > 0) {
        const firstExercise = sentenceData.exercises[0];
        if ('exerciseSubType' in firstExercise && firstExercise.exerciseSubType === 'verb-aspect') {
          return (
            <VerbAspectExerciseComponent
              exerciseSet={sentenceData as SentenceExerciseSet & { exercises: VerbAspectExercise[] }}
              exerciseType={exerciseType}
              onComplete={() => {}}
              title={`${exerciseType.replace(/([A-Z])/g, ' $1')} Exercise`}
            />
          );
        }
      }
      
      return (
        <SentenceExerciseComponent
          exerciseSet={sentenceData}
          exerciseType={exerciseType}
          onComplete={() => {}}
          title={`${exerciseType.replace(/([A-Z])/g, ' $1')} Exercise`}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with sharing */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {exerciseType.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </h1>
            <p className="text-sm text-gray-600">
              {exerciseData.cefrLevel} {exerciseData.theme && `• ${exerciseData.theme}`}
            </p>
          </div>
          <Button onClick={handleShare} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share className="w-4 h-4 mr-2" />
                Share
              </>
            )}
          </Button>
        </div>

        {/* Exercise component */}
        {renderExerciseComponent()}
      </div>
    </div>
  );
}
