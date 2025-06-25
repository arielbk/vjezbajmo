"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExercise } from "@/contexts/ExerciseContext";
import { ExerciseType } from "@/types/exercise";
import { BookOpen, MessageSquare, FileText, HelpCircle } from "lucide-react";

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
  const { dispatch } = useExercise();

  const handleStartExercise = (exerciseType: ExerciseType) => {
    dispatch({ type: "SET_EXERCISE_TYPE", payload: exerciseType });
    dispatch({ type: "START_SESSION", payload: { exerciseType } });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {exerciseTypes.map((exercise) => (
          <Card key={exercise.type} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {exercise.icon}
                {exercise.title}
              </CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => handleStartExercise(exercise.type)} className="w-full">
                Start Exercise
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
