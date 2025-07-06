import { ExerciseSelection } from "@/components/ExerciseSelection";
import { ProgressMigrationStatus } from "@/components/ProgressMigrationStatus";

export default function Home() {
  return (
    <div className="space-y-4">
      <ProgressMigrationStatus />
      <ExerciseSelection />
    </div>
  );
}
