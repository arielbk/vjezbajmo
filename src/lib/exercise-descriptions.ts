import { ExerciseType } from "@/types/exercise";

export function getExerciseDescription(exerciseType: ExerciseType): string {
  switch (exerciseType) {
    case "verbTenses":
      return "Fill in verb blanks within a connected story to practice tense usage.";
    case "nounDeclension":
      return "Complete noun-adjective pairs with correct case endings.";
    case "verbAspect":
      return "Choose between perfective and imperfective verb forms.";
    case "interrogativePronouns":
      return "Fill in blanks with the correct form of koji, koja, koje in context.";
    default:
      return "";
  }
}
