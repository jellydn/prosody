import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { HomeStackParamList } from "./ExerciseScreen";

interface ExerciseScore {
	exerciseId: string;
	rhythm_score: number;
	stress_score: number;
	pacing_score: number;
	intonation_score: number;
}

const MOTIVATIONAL_MESSAGES = [
	"Great job! Your rhythm is improving!",
	"You're making real progress!",
	"Keep up the excellent work!",
	"Your intonation is getting much better!",
	"Fantastic effort today!",
	"You're building strong speaking habits!",
	"Every practice session counts!",
	"You're on track to reach your goals!",
];

export default function SessionCompletionScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
	const route = useRoute();
	const { day, scores, streak, previousAverage } =
		route.params as HomeStackParamList["SessionCompletion"];

	const calculateAverageScore = () => {
		if (scores.length === 0) return 0;
		const total = scores.reduce((sum, score) => {
			return (
				sum +
				score.rhythm_score +
				score.stress_score +
				score.pacing_score +
				score.intonation_score
			);
		}, 0);
		return Math.round((total / (scores.length * 4)) * 10) / 10;
	};

	const calculateCategoryAverage = (category: keyof ExerciseScore) => {
		if (scores.length === 0) return 0;
		const total = scores.reduce(
			(sum, score) => sum + (score[category] as number),
			0,
		);
		return Math.round((total / scores.length) * 10) / 10;
	};

	const averageScore = calculateAverageScore();
	const improvement =
		previousAverage !== undefined
			? Math.round((averageScore - previousAverage) * 10) / 10
			: null;
	const motivationalMessage =
		MOTIVATIONAL_MESSAGES[
			Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
		];

	const handleDone = async () => {
		try {
			const userId = await AsyncStorage.getItem("userId");
			if (!userId) {
				Alert.alert("Error", "User ID not found. Please complete onboarding.");
				return;
			}

			const response = await fetch("http://localhost:8000/api/v1/progress", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					user_id: parseInt(userId),
					day,
					exercises_completed: scores.length,
					rhythm_score: calculateCategoryAverage("rhythm_score"),
					stress_score: calculateCategoryAverage("stress_score"),
					pacing_score: calculateCategoryAverage("pacing_score"),
					intonation_score: calculateCategoryAverage("intonation_score"),
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			navigation.navigate("HomeMain");
		} catch (err) {
			console.error("Error saving progress:", err);
			Alert.alert(
				"Save Failed",
				"Could not save your progress. Please try again.",
			);
		}
	};

	const renderScoreDots = (score: number) => {
		const dots = [];
		for (let i = 1; i <= 5; i++) {
			const isActive = i <= Math.round(score);
			dots.push(
				<View
					key={`dot-${i}`}
					style={[
						styles.scoreDot,
						isActive ? styles.scoreDotActive : styles.scoreDotInactive,
					]}
				/>,
			);
		}
		return dots;
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.celebrationContainer}>
					<Ionicons name="trophy" size={80} color="#FFD700" />
					<Text style={styles.congratsText}>Session Complete!</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Today's Results</Text>

					<View style={styles.averageContainer}>
						<Text style={styles.averageLabel}>Average Score</Text>
						<Text style={styles.averageScore}>{averageScore}</Text>
					</View>

					<View style={styles.scoreBreakdown}>
						<Text style={styles.breakdownTitle}>Score Breakdown</Text>
						<View style={styles.scoreRow}>
							<Text style={styles.scoreLabel}>Rhythm</Text>
							<View style={styles.scoreDots}>
								{renderScoreDots(calculateCategoryAverage("rhythm_score"))}
							</View>
						</View>
						<View style={styles.scoreRow}>
							<Text style={styles.scoreLabel}>Stress</Text>
							<View style={styles.scoreDots}>
								{renderScoreDots(calculateCategoryAverage("stress_score"))}
							</View>
						</View>
						<View style={styles.scoreRow}>
							<Text style={styles.scoreLabel}>Pacing</Text>
							<View style={styles.scoreDots}>
								{renderScoreDots(calculateCategoryAverage("pacing_score"))}
							</View>
						</View>
						<View style={styles.scoreRow}>
							<Text style={styles.scoreLabel}>Intonation</Text>
							<View style={styles.scoreDots}>
								{renderScoreDots(calculateCategoryAverage("intonation_score"))}
							</View>
						</View>
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.streakRow}>
						<Ionicons name="flame" size={24} color="#FF6B6B" />
						<Text style={styles.streakText}>{streak} day streak</Text>
					</View>

					{improvement !== null && (
						<View style={styles.improvementRow}>
							{improvement > 0 ? (
								<>
									<Ionicons name="arrow-up" size={24} color="#34C759" />
									<Text style={styles.improvementText}>
										Improved by {improvement} points
									</Text>
								</>
							) : improvement < 0 ? (
								<>
									<Ionicons name="arrow-down" size={24} color="#FF9500" />
									<Text style={styles.improvementText}>
										Down by {Math.abs(improvement)} points
									</Text>
								</>
							) : (
								<>
									<Ionicons name="remove" size={24} color="#8E8E93" />
									<Text style={styles.improvementText}>Same as yesterday</Text>
								</>
							)}
						</View>
					)}
				</View>

				<View style={styles.motivationCard}>
					<Text style={styles.motivationText}>{motivationalMessage}</Text>
				</View>

				<TouchableOpacity style={styles.doneButton} onPress={handleDone}>
					<Text style={styles.doneButtonText}>Done for Today</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F2F2F7",
	},
	content: {
		flex: 1,
		padding: 20,
	},
	celebrationContainer: {
		alignItems: "center",
		marginVertical: 32,
	},
	congratsText: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#000",
		marginTop: 16,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#000",
		marginBottom: 16,
	},
	averageContainer: {
		alignItems: "center",
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5EA",
		marginBottom: 16,
	},
	averageLabel: {
		fontSize: 16,
		color: "#8E8E93",
		marginBottom: 8,
	},
	averageScore: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#007AFF",
	},
	scoreBreakdown: {
		paddingTop: 8,
	},
	breakdownTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#000",
		marginBottom: 12,
	},
	scoreRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	scoreLabel: {
		width: 80,
		fontSize: 14,
		color: "#8E8E93",
	},
	scoreDots: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 4,
	},
	scoreDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	scoreDotActive: {
		backgroundColor: "#007AFF",
	},
	scoreDotInactive: {
		backgroundColor: "#E5E5EA",
	},
	streakRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
	},
	streakText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#FF6B6B",
		marginLeft: 8,
	},
	improvementRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: "#E5E5EA",
	},
	improvementText: {
		fontSize: 16,
		color: "#3C3C43",
		marginLeft: 8,
	},
	motivationCard: {
		backgroundColor: "#E3F2FF",
		borderRadius: 16,
		padding: 20,
		marginBottom: 24,
	},
	motivationText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#007AFF",
		textAlign: "center",
		lineHeight: 24,
	},
	doneButton: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: "auto",
		marginBottom: 20,
	},
	doneButtonText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
	},
});
