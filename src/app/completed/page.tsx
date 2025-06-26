"use client";

import { CompletedExercisesView } from "@/components/CompletedExercisesView";
import { useRouter } from "next/navigation";

export default function CompletedPage() {
  const router = useRouter();

  const handleBackToSelection = () => {
    router.push("/");
  };

  return <CompletedExercisesView onBack={handleBackToSelection} />;
}
