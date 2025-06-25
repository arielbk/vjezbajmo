"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExercise } from "@/contexts/ExerciseContext";
import { Key, Eye, EyeOff } from "lucide-react";

export function ApiKeyManager() {
  const { state, dispatch } = useExercise();
  const [tempApiKey, setTempApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!state.apiKey);

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      dispatch({ type: "SET_API_KEY", payload: tempApiKey.trim() });
      setIsEditing(false);
      setTempApiKey("");
    }
  };

  const handleClearApiKey = () => {
    dispatch({ type: "CLEAR_API_KEY" });
    setTempApiKey("");
    setIsEditing(true);
  };

  if (!isEditing && state.apiKey) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4" />
            OpenAI API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
              {showApiKey ? state.apiKey : "•".repeat(20) + state.apiKey.slice(-4)}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearApiKey}>
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          Provide your OpenAI API key to generate new exercise sets. This key is stored locally and never sent to our
          servers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-..."
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
            />
            <Button onClick={handleSaveApiKey} disabled={!tempApiKey.trim()}>
              Save
            </Button>
            {state.apiKey && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>

          <Alert>
            <AlertDescription>
              <strong>Privacy:</strong> Your API key is stored only in your browser's local storage and is used
              exclusively to communicate directly with OpenAI's servers.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
