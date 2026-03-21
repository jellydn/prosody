import { Ionicons } from "@expo/vector-icons";
import {
	AudioModule,
	RecordingPresets,
	setAudioModeAsync,
	useAudioPlayer,
	useAudioPlayerStatus,
	useAudioRecorder,
	useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

interface AudioRecorderProps {
	onRecordingComplete: (uri: string | null) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
	const SILENCE_THRESHOLD_DB = -45;
	const SILENCE_WINDOW_MS = 10000;
	const MAX_RECORDING_MS = 60000;

	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [recordedUri, setRecordedUri] = useState<string | null>(null);
	const [isPulsing, setIsPulsing] = useState(false);
	const silenceStartRef = useRef<number | null>(null);
	const isStoppingRef = useRef(false);

	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(recorder, 200);

	const player = useAudioPlayer(null);
	const playerStatus = useAudioPlayerStatus(player);

	useEffect(() => {
		if (recordedUri) {
			player.replace(recordedUri);
		}
	}, [recordedUri, player]);

	const stopRecordingRef = useRef<(() => Promise<void>) | undefined>(undefined);

	useEffect(() => {
		(async () => {
			const status = await AudioModule.requestRecordingPermissionsAsync();
			setHasPermission(status.granted);
			if (!status.granted) {
				Alert.alert(
					"Microphone Permission Required",
					"Please enable microphone access in Settings to record your voice.",
					[
						{ text: "Cancel", style: "cancel" },
						{
							text: "Settings",
							onPress: () => Linking.openSettings(),
						},
					],
				);
			}
		})();
	}, []);

	useEffect(() => {
		let pulseInterval: NodeJS.Timeout | null = null;

		if (recorderState.isRecording) {
			pulseInterval = setInterval(() => {
				setIsPulsing((prev) => !prev);
			}, 500);
		} else {
			setIsPulsing(false);
		}

		return () => {
			if (pulseInterval) clearInterval(pulseInterval);
		};
	}, [recorderState.isRecording]);

	const stopRecording = useCallback(async () => {
		if (isStoppingRef.current) return;
		isStoppingRef.current = true;

		try {
			await recorder.stop();
			await setAudioModeAsync({
				allowsRecording: false,
				playsInSilentMode: true,
			});
			const uri = recorder.uri;
			setRecordedUri(uri);
			silenceStartRef.current = null;
			onRecordingComplete(uri);
		} catch (err) {
			console.error("Failed to stop recording", err);
		} finally {
			isStoppingRef.current = false;
		}
	}, [recorder, onRecordingComplete]);

	useEffect(() => {
		stopRecordingRef.current = stopRecording;
	}, [stopRecording]);

	// Metering / silence detection + max duration via recorderState
	useEffect(() => {
		if (!recorderState.isRecording) return;

		if (recorderState.durationMillis > MAX_RECORDING_MS) {
			stopRecordingRef.current?.();
			return;
		}

		if (typeof recorderState.metering === "number") {
			if (recorderState.metering < SILENCE_THRESHOLD_DB) {
				if (silenceStartRef.current === null) {
					silenceStartRef.current = Date.now();
				} else if (Date.now() - silenceStartRef.current >= SILENCE_WINDOW_MS) {
					stopRecordingRef.current?.();
				}
			} else {
				silenceStartRef.current = null;
			}
		}
	}, [recorderState]);

	const startRecording = async () => {
		if (!hasPermission) {
			Alert.alert("Permission Required", "Microphone permission is required to record.");
			return;
		}

		try {
			player.pause();
			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});

			await recorder.prepareToRecordAsync();
			recorder.record();
			setRecordedUri(null);
			onRecordingComplete(null);
			silenceStartRef.current = null;
		} catch (err) {
			console.error("Failed to start recording", err);
		}
	};

	const playRecording = () => {
		if (!recordedUri) return;

		try {
			if (playerStatus.playing) {
				player.pause();
			} else {
				player.seekTo(0);
				player.play();
			}
		} catch (err) {
			console.error("Failed to play recording", err);
		}
	};

	const reRecord = () => {
		player.pause();
		setRecordedUri(null);
		silenceStartRef.current = null;
		onRecordingComplete(null);
	};

	if (hasPermission === null) {
		return (
			<View style={styles.container}>
				<Text style={styles.text}>Requesting microphone permission...</Text>
			</View>
		);
	}

	if (!hasPermission) {
		return (
			<View style={styles.container}>
				<Text style={styles.text}>Microphone permission not granted</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{!recordedUri ? (
				<Pressable
					onPress={recorderState.isRecording ? stopRecording : startRecording}
					style={[
						styles.recordButton,
						recorderState.isRecording && styles.recordButtonActive,
						isPulsing && styles.recordButtonPulsing,
					]}
				>
					<Ionicons name={recorderState.isRecording ? "stop" : "mic"} size={32} color="#fff" />
				</Pressable>
			) : (
				<View style={styles.playbackContainer}>
					<Pressable onPress={playRecording} style={styles.playButton}>
						<Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#007AFF" />
					</Pressable>
					<Pressable onPress={reRecord} style={styles.rerecordButton}>
						<Ionicons name="refresh" size={20} color="#FF3B30" />
						<Text style={styles.rerecordText}>Re-record</Text>
					</Pressable>
				</View>
			)}
			{recorderState.isRecording && <Text style={styles.recordingText}>Recording...</Text>}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		paddingVertical: 16,
	},
	text: {
		fontSize: 16,
		color: "#8E8E93",
	},
	recordButton: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#FF3B30",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#FF3B30",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	recordButtonActive: {
		width: 64,
		height: 64,
		borderRadius: 32,
	},
	recordButtonPulsing: {
		shadowColor: "#FF3B30",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.8,
		shadowRadius: 20,
		elevation: 10,
	},
	recordingText: {
		marginTop: 12,
		fontSize: 14,
		color: "#FF3B30",
		fontWeight: "600",
	},
	playbackContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 20,
	},
	playButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#E3F2FF",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#007AFF",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	rerecordButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "#FFF0F0",
		borderRadius: 8,
	},
	rerecordText: {
		fontSize: 14,
		color: "#FF3B30",
		fontWeight: "600",
	},
});
