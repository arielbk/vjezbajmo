import { ExerciseSelection } from "@/components/ExerciseSelection";
import { ExerciseProvider } from "@/contexts/ExerciseContext";
import { SettingsModal } from "@/components/SettingsModal";

export default function Home() {
  return (
    <ExerciseProvider>
      <div className="min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header with app title and settings */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-full bg-white inline-grid place-items-center w-10 h-10 sm:w-12 sm:h-12 text-2xl sm:text-4xl">
                🇭🇷
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vježbajmo</h1>
                <p className="text-sm sm:text-base text-gray-500">Croatian Language Practice</p>
              </div>
            </div>
            <SettingsModal />
          </div>

          <ExerciseSelection />
        </div>
      </div>
    </ExerciseProvider>
  );
}
