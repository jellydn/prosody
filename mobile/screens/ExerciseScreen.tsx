import { CommonActions } from "@react-navigation/native";
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

export interface ExerciseScores {
  rhythm_score: number;
  stress_score: number;
  pacing_score: number;
  intonation_score: number;
}

export interface ExerciseCompletionPayload extends ExerciseScores {
  exerciseId: string;
}

export type ExerciseSource = "home" | "library";

export interface ExerciseScreenParams {
  exercise: Exercise;
  source: ExerciseSource;
}

export type HomeStackParamList = {
  HomeMain:
    | {
        completedExercise?: ExerciseCompletionPayload;
        completedAt?: number;
        selectedDay?: number;
      }
    | undefined;
  ExerciseScreen: ExerciseScreenParams;
  SessionCompletion: {
    day: number;
    scores: ExerciseCompletionPayload[];
    streak: number;
    previousAverage?: number;
  };
  ProgramOverview: undefined;
};

type ExerciseScreenProps = NativeStackScreenProps<HomeStackParamList, "ExerciseScreen">;

export default function ExerciseScreen({ route, navigation }: ExerciseScreenProps) {
  const { exercise, source } = route.params;

  const handleNext = () => {
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleComplete = (exerciseId: string, scores: ExerciseScores) => {
    if (source !== "home") {
      return;
    }

    const parentRoute = navigation.getState().routes.find((r) => r.name === "HomeMain");
    if (!parentRoute) {
      return;
    }

    navigation.dispatch({
      ...CommonActions.setParams({
        completedExercise: { exerciseId, ...scores },
        completedAt: Date.now(),
      }),
      source: parentRoute.key,
    });
  };

  switch (exercise.type) {
    case "stress":
      return (
        <StressDrillScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    case "linking":
      return (
        <LinkingPracticeScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    case "chunk":
      return (
        <ChunkSpeakingScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    case "shadow":
      return (
        <ShadowingModeScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    case "intonation":
      return (
        <IntonationTrainingScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    default:
      return (
        <StressDrillScreen
          exercise={exercise}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
  }
}
