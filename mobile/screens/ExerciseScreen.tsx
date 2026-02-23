import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ChunkSpeakingScreen from "../screens/ChunkSpeakingScreen";
import IntonationTrainingScreen from "../screens/IntonationTrainingScreen";
import LinkingPracticeScreen from "../screens/LinkingPracticeScreen";
import ShadowingModeScreen from "../screens/ShadowingModeScreen";
import StressDrillScreen from "../screens/StressDrillScreen";

export type ExerciseType = "stress" | "linking" | "chunk" | "shadow" | "intonation";

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  instruction: string;
  targetText: string;
  stressPattern?: boolean[] | null;
  chunks?: string[] | null;
  audioUrl?: string | null;
  tips: string[];
}

export type HomeStackParamList = {
  HomeMain: undefined;
  ExerciseScreen: {
    exercise: Exercise;
    onComplete: (
      exerciseId: string,
      scores: {
        rhythm_score: number;
        stress_score: number;
        pacing_score: number;
        intonation_score: number;
      },
    ) => void;
  };
  SessionCompletion: {
    day: number;
    scores: Array<{
      exerciseId: string;
      rhythm_score: number;
      stress_score: number;
      pacing_score: number;
      intonation_score: number;
    }>;
    streak: number;
    previousAverage?: number;
  };
  ProgramOverview: undefined;
};

type ExerciseScreenProps = NativeStackScreenProps<HomeStackParamList, "ExerciseScreen">;

export default function ExerciseScreen({ route, navigation }: ExerciseScreenProps) {
  const { exercise, onComplete } = route.params;

  const handleNext = () => {
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  switch (exercise.type) {
    case "stress":
      return (
        <StressDrillScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
    case "linking":
      return (
        <LinkingPracticeScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
    case "chunk":
      return (
        <ChunkSpeakingScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
    case "shadow":
      return (
        <ShadowingModeScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
    case "intonation":
      return (
        <IntonationTrainingScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
    default:
      return (
        <StressDrillScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={onComplete}
        />
      );
  }
}
