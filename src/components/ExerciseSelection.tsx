"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExerciseType } from "@/types/exercise";
import { BookOpen, MessageSquare, FileText, HelpCircle, History, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

const exerciseTypes: Array<{
  type: ExerciseType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isParagraph: boolean;
}> = [
  {
    type: "verbTenses",
    title: "Verb Tenses in Text",
    description: "Fill in verb blanks within a connected story to practice tense usage.",
    icon: <BookOpen className="h-5 w-5" />,
    isParagraph: true,
  },
  {
    type: "nounDeclension",
    title: "Noun & Adjective Declension",
    description: "Complete noun-adjective pairs with correct case endings.",
    icon: <FileText className="h-5 w-5" />,
    isParagraph: true,
  },
  {
    type: "verbAspect",
    title: "Verb Aspect",
    description: "Choose between perfective and imperfective verb forms.",
    icon: <MessageSquare className="h-5 w-5" />,
    isParagraph: false,
  },
  {
    type: "interrogativePronouns",
    title: "Interrogative Pronouns",
    description: "Fill in blanks with the correct form of koji, koja, koje in context.",
    icon: <HelpCircle className="h-5 w-5" />,
    isParagraph: false,
  },
];

export function ExerciseSelection() {
  const router = useRouter();

  const handleStartExercise = (exerciseType: ExerciseType) => {
    router.push(`/exercise/${exerciseType}`);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Choose an Exercise Type
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Select from our four exercise categories to practice different aspects of Croatian grammar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2" role="group" aria-labelledby="exercise-selection-heading">
        <h3 id="exercise-selection-heading" className="sr-only">
          Available Exercise Types
        </h3>
        {exerciseTypes.map((exercise) => (
          <Card key={exercise.type} className="relative focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span aria-hidden="true">{exercise.icon}</span>
                {exercise.title}
              </CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleStartExercise(exercise.type)} 
                className="w-full"
                aria-describedby={`exercise-description-${exercise.type}`}
              >
                Start {exercise.title}
              </Button>
              <div id={`exercise-description-${exercise.type}`} className="sr-only">
                {exercise.description}. This is a {exercise.isParagraph ? 'paragraph-based' : 'sentence-based'} exercise.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <nav aria-label="Additional actions" className="flex justify-center gap-4 mt-10">
        <Button 
          variant="outline" 
          onClick={() => router.push("/completed")} 
          className="flex items-center gap-2"
          aria-describedby="completed-exercises-description"
        >
          <History className="h-4 w-4" aria-hidden="true" />
          View Completed Exercises
        </Button>
        <div id="completed-exercises-description" className="sr-only">
          View your exercise history and performance statistics
        </div>
        
        {/* Only show Model Evaluations in development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Button 
              variant="outline" 
              onClick={() => router.push("/evals")} 
              className="flex items-center gap-2"
              aria-describedby="model-evaluations-description"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Model Evaluations
            </Button>
            <div id="model-evaluations-description" className="sr-only">
              Development tool for testing AI model performance
            </div>
          </>
        )}
      </nav>
    </div>
  );
}
