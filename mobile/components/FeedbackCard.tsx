import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type FeedbackType = "good" | "warning" | "tip";

interface FeedbackItem {
	type: FeedbackType;
	message: string;
}

interface AnalysisResult {
	rhythm_score: number;
	stress_score: number;
	pacing_score: number;
	intonation_score: number;
	feedback: FeedbackItem[];
}

interface FeedbackCardProps {
	result: AnalysisResult | null;
	isLoading?: boolean;
}

export default function FeedbackCard({
	result,
	isLoading = false,
}: FeedbackCardProps) {
	if (isLoading) {
		return (
			<View style={styles.container}>
				<View style={styles.loadingContainer}>
					<Ionicons name="sync" size={24} color="#007AFF" />
					<Text style={styles.loadingText}>Analyzing your recording...</Text>
				</View>
			</View>
		);
	}

	if (!result) {
		return null;
	}

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

	const renderFeedbackItem = (item: FeedbackItem, index: number) => {
		const iconMap = {
			good: "checkmark-circle",
			warning: "warning",
			tip: "bulb",
		};

		const colorMap = {
			good: "#34C759",
			warning: "#FF9500",
			tip: "#007AFF",
		};

		return (
			<View key={`feedback-${index}`} style={styles.feedbackItem}>
				<Ionicons
					name={iconMap[item.type] as any}
					size={20}
					color={colorMap[item.type]}
				/>
				<Text style={styles.feedbackText}>{item.message}</Text>
			</View>
		);
	};

	const scores = [
		{ label: "Rhythm", value: result.rhythm_score },
		{ label: "Stress", value: result.stress_score },
		{ label: "Pacing", value: result.pacing_score },
		{ label: "Intonation", value: result.intonation_score },
	];

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Your Feedback</Text>

			<View style={styles.scoresContainer}>
				{scores.map((score) => (
					<View key={score.label} style={styles.scoreRow}>
						<Text style={styles.scoreLabel}>{score.label}</Text>
						<View style={styles.scoreDots}>{renderScoreDots(score.value)}</View>
					</View>
				))}
			</View>

			{result.feedback && result.feedback.length > 0 && (
				<View style={styles.feedbackContainer}>
					{result.feedback.map(renderFeedbackItem)}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
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
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
	},
	loadingText: {
		marginLeft: 12,
		fontSize: 16,
		color: "#007AFF",
		fontWeight: "500",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#000",
		marginBottom: 16,
	},
	scoresContainer: {
		marginBottom: 16,
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
	feedbackContainer: {
		borderTopWidth: 1,
		borderTopColor: "#E5E5EA",
		paddingTop: 16,
	},
	feedbackItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	feedbackText: {
		flex: 1,
		marginLeft: 12,
		fontSize: 14,
		lineHeight: 20,
		color: "#3C3C43",
	},
});
