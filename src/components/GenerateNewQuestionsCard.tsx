"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface GenerateNewQuestionsCardProps {
  onRegenerate: (theme?: string) => Promise<void>;
  isGenerating: boolean;
  className?: string;
}

export function GenerateNewQuestionsCard({
  onRegenerate,
  isGenerating,
  className = "",
}: GenerateNewQuestionsCardProps) {
  const [theme, setTheme] = useState("");

  const handleRegenerate = async () => {
    await onRegenerate(theme || undefined);
    setTheme("");
  };

  return (
    <Card className={className}>
      <CardContent>
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Want different questions?</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2">
            <Input
              type="text"
              placeholder="Optional theme..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full sm:w-40"
              disabled={isGenerating}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              Generate New Questions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
