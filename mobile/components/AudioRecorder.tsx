import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import {
	Alert,
	Linking,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

interface AudioRecorderProps {
	onRecordingComplete: (uri: string | null) => void;
}

export default function AudioRecorder({
	onRecordingComplete,
}: AudioRecorderProps) {
	const [hasPermission, setHasPermission] = useState<boolean | null>(null);
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [sound, setSound] = useState<Audio.Sound | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [recordedUri, setRecordedUri] = useState<string | null>(null);
	const [isPulsing, setIsPulsing] = useState(false);

	useEffect(() => {
		(async () => {
			const { status } = await Audio.requestPermissionsAsync();
			setHasPermission(status === "granted");
			if (status !== "granted") {
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
		return sound
			? () => {
					sound.unloadAsync();
				}
			: undefined;
	}, [sound]);

	useEffect(() => {
		let pulseInterval: NodeJS.Timeout | null = null;

		if (isRecording) {
			pulseInterval = setInterval(() => {
				setIsPulsing((prev) => !prev);
			}, 500);
		} else {
			setIsPulsing(false);
		}

		return () => {
			if (pulseInterval) clearInterval(pulseInterval);
		};
	}, [isRecording]);

	const startRecording = async () => {
		if (!hasPermission) {
			Alert.alert(
				"Permission Required",
				"Microphone permission is required to record.",
			);
			return;
		}

		try {
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			const recordingOptions = {
				android: {
					extension: ".m4a",
					outputFormat: Audio.AndroidOutputFormat.MPEG_4,
					audioEncoder: Audio.AndroidAudioEncoder.AAC,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
				},
				ios: {
					extension: ".m4a",
					outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
					audioQuality: Audio.IOSAudioQuality.HIGH,
					sampleRate: 44100,
					numberOfChannels: 2,
					bitRate: 128000,
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false,
				},
				web: {
					mimeType: "audio/webm",
					bitsPerSecond: 128000,
				},
			};

			const { recording } = await Audio.Recording.createAsync(recordingOptions);
			setRecording(recording);
			setIsRecording(true);
			setRecordedUri(null);
			onRecordingComplete(null);

			recording.setOnRecordingStatusUpdate((status) => {
				if (status.durationMillis > 10000) {
					stopRecording();
				}
			});
		} catch (err) {
			console.error("Failed to start recording", err);
		}
	};

	const stopRecording = async () => {
		if (!recording) return;

		try {
			await recording.stopAndUnloadAsync();
			const uri = recording.getURI();
			setRecordedUri(uri);
			setRecording(null);
			setIsRecording(false);
			onRecordingComplete(uri);
		} catch (err) {
			console.error("Failed to stop recording", err);
		}
	};

	const playRecording = async () => {
		if (!recordedUri) return;

		try {
			if (sound) {
				if (isPlaying) {
					await sound.pauseAsync();
					setIsPlaying(false);
				} else {
					await sound.replayAsync();
					setIsPlaying(true);
				}
			} else {
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri: recordedUri },
					{ shouldPlay: true },
					onPlaybackStatusUpdate,
				);
				setSound(newSound);
				setIsPlaying(true);
			}
		} catch (err) {
			console.error("Failed to play recording", err);
		}
	};

	const onPlaybackStatusUpdate = (status: any) => {
		if (status.didJustFinish) {
			setIsPlaying(false);
		}
	};

	const reRecord = () => {
		setRecordedUri(null);
		setSound(null);
		setIsPlaying(false);
		startRecording();
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
					onPress={isRecording ? stopRecording : startRecording}
					style={[
						styles.recordButton,
						isRecording && styles.recordButtonActive,
						isPulsing && styles.recordButtonPulsing,
					]}
				>
					<Ionicons
						name={isRecording ? "stop" : "mic"}
						size={32}
						color="#fff"
					/>
				</Pressable>
			) : (
				<View style={styles.playbackContainer}>
					<Pressable onPress={playRecording} style={styles.playButton}>
						<Ionicons
							name={isPlaying ? "pause" : "play"}
							size={28}
							color="#007AFF"
						/>
					</Pressable>
					<Pressable onPress={reRecord} style={styles.rerecordButton}>
						<Ionicons name="refresh" size={20} color="#FF3B30" />
						<Text style={styles.rerecordText}>Re-record</Text>
					</Pressable>
				</View>
			)}
			{isRecording && <Text style={styles.recordingText}>Recording...</Text>}
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
