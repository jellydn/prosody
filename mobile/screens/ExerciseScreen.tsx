import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ChunkSpeakingScreen from "../screens/ChunkSpeakingScreen";
import IntonationTrainingScreen from "../screens/IntonationTrainingScreen";
import LinkingPracticeScreen from "../screens/LinkingPracticeScreen";
import ShadowingModeScreen from "../screens/ShadowingModeScreen";
import StressDrillScreen from "../screens/StressDrillScreen";

export type ExerciseType =
	| "stress"
	| "linking"
	| "chunk"
	| "shadow"
	| "intonation";

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
	ExerciseScreen: { exercise: Exercise };
};

type ExerciseScreenProps = NativeStackScreenProps<
	HomeStackParamList,
	"ExerciseScreen"
>;

export default function ExerciseScreen({
	route,
	navigation,
}: ExerciseScreenProps) {
	const { exercise } = route.params;

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
				/>
			);
		case "linking":
			return (
				<LinkingPracticeScreen
					exercise={exercise}
					onNext={handleNext}
					onBack={handleBack}
				/>
			);
		case "chunk":
			return (
				<ChunkSpeakingScreen
					exercise={exercise}
					onNext={handleNext}
					onBack={handleBack}
				/>
			);
		case "shadow":
			return (
				<ShadowingModeScreen
					exercise={exercise}
					onNext={handleNext}
					onBack={handleBack}
				/>
			);
		case "intonation":
			return (
				<IntonationTrainingScreen
					exercise={exercise}
					onNext={handleNext}
					onBack={handleBack}
				/>
			);
		default:
			return (
				<StressDrillScreen
					exercise={exercise}
					onNext={handleNext}
					onBack={handleBack}
				/>
			);
	}
}
