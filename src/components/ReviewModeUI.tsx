"use client";

import { Button } from "@/components/ui/button";

interface ReviewModeUIProps {
  onClearAnswers: () => void;
}

export function ReviewModeUI({ onClearAnswers }: ReviewModeUIProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        You&apos;re reviewing your previous answers. You can modify them and check again.
      </p>
      <Button
        variant="outline"
        onClick={onClearAnswers}
        size="sm"
        className="mt-2"
      >
        Clear All Answers
      </Button>
    </div>
  );
}
