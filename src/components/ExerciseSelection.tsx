"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExerciseType } from "@/types/exercise";
import { BookOpen, MessageSquare, FileText, HelpCircle, History, BarChart3, Bot } from "lucide-react";
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
    type: "relativePronouns",
    title: "Relative Pronouns",
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
        
        {/* Conversational AI Card */}
        <Card className="relative bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-transparent bg-clip-padding">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-75 blur-sm"></div>
          <div className="absolute inset-[2px] rounded-xl bg-white"></div>
          <div className="relative z-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Conversational AI
              </CardTitle>
              <CardDescription className="mb-4">
                Practice Croatian through natural conversation with an AI partner. Improve your speaking and listening skills!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/conversation')} 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Start Conversation
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-10">
        <Button variant="outline" onClick={() => router.push("/completed")} className="flex items-center gap-2">
          <History className="h-4 w-4" />
          View Completed Exercises
        </Button>

        {/* Only show Model Evaluations in development */}
        {process.env.NODE_ENV === "development" && (
          <Button variant="outline" onClick={() => router.push("/evals")} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Model Evaluations
          </Button>
        )}
      </div>
    </div>
  );
}
