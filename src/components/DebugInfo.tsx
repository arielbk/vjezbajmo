"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaticWorksheets } from "@/lib/static-worksheets";
import { useExercise } from "@/contexts/ExerciseContext";
import { ExerciseType } from "@/types/exercise";

export function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const { state } = useExercise();

  if (process.env.NODE_ENV === "production") {
    return null; // Don't show in production
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Info
      </Button>
    );
  }

  const exerciseTypes: ExerciseType[] = ["verbTenses", "nounDeclension", "verbAspect", "relativePronouns"];

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Information</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>CEFR Level:</strong> {state.cefrLevel}
        </div>
        <div>
          <strong>Current Exercise Type:</strong> {state.currentExerciseType || "None"}
        </div>
        <div>
          <strong>API Key:</strong> {state.apiKey ? "Present" : "None"}
        </div>
        <div>
          <strong>Provider:</strong> {state.selectedProvider}
        </div>
        <div>
          <strong>Is Generating:</strong> {state.isGenerating ? "Yes" : "No"}
        </div>
        
        <div className="mt-4">
          <strong>Static Worksheets Available:</strong>
          {exerciseTypes.map((type) => {
            const worksheets = getStaticWorksheets(type);
            const levelWorksheets = worksheets.filter((w) => w.cefrLevel === state.cefrLevel);
            return (
              <div key={type} className="ml-2">
                {type}: {levelWorksheets.length} worksheets for {state.cefrLevel}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <strong>Current Exercise Data:</strong>
          <div className="ml-2">
            VT: {state.verbTensesParagraph.id}
          </div>
          <div className="ml-2">
            ND: {state.nounAdjectiveParagraph.id}
          </div>
          <div className="ml-2">
            VA: {state.verbAspectExercises.id}
          </div>
          <div className="ml-2">
            RP: {state.relativePronounsExercises.id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
