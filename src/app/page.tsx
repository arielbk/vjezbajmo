import { VjezbajmoApp } from "@/components/VjezbajmoApp";
import { ExerciseProvider } from "@/contexts/ExerciseContext";

export default function Home() {
  return (
    <ExerciseProvider>
      <VjezbajmoApp />
    </ExerciseProvider>
  );
}
