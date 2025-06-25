"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExercise } from "@/contexts/ExerciseContext";
import { ExerciseType } from "@/types/exercise";
import { BookOpen, MessageSquare, FileText, HelpCircle, Loader2, RefreshCw } from "lucide-react";

const exerciseTypes: Array<{
  type: ExerciseType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isParagraph: boolean;
}> = [
  {
    type: "verb-tenses",
    title: "Verb Tenses in Text",
    description: "Fill in verb blanks within a connected story to practice tense usage.",
    icon: <BookOpen className="h-5 w-5" />,
    isParagraph: true,
  },
  {
    type: "noun-adjective-declension",
    title: "Noun & Adjective Declension",
    description: "Complete noun-adjective pairs with correct case endings.",
    icon: <FileText className="h-5 w-5" />,
    isParagraph: true,
  },
  {
    type: "verb-aspect",
    title: "Verb Aspect",
    description: "Choose between perfective and imperfective verb forms.",
    icon: <MessageSquare className="h-5 w-5" />,
    isParagraph: false,
  },
  {
    type: "interrogative-pronouns",
    title: "Interrogative Pronouns",
    description: "Fill in blanks with the correct form of koji, koja, koje, tko, što.",
    icon: <HelpCircle className="h-5 w-5" />,
    isParagraph: false,
  },
];

export function ExerciseSelection() {
  const { state, dispatch, generateExercises } = useExercise();

  const handleStartExercise = (exerciseType: ExerciseType) => {
    dispatch({ type: "SET_EXERCISE_TYPE", payload: exerciseType });
    dispatch({ type: "START_SESSION", payload: { exerciseType } });
  };

  const handleRegenerateExercise = async (exerciseType: ExerciseType) => {
    await generateExercises(exerciseType);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Vježbajmo Hrvatski</h1>
        <p className="text-muted-foreground">Practice Croatian grammar with dynamic exercises at A2.2 CEFR level</p>
      </div>

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
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleStartExercise(exercise.type)} className="w-full">
                  Start Exercise
                </Button>

                {state.apiKey && (
                  <Button
                    variant="outline"
                    onClick={() => handleRegenerateExercise(exercise.type)}
                    disabled={state.isGenerating}
                    className="w-full"
                  >
                    {state.isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate New Set
                      </>
                    )}
                  </Button>
                )}

                {!state.apiKey && (
                  <Button variant="outline" disabled className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Set (API Key Required)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
