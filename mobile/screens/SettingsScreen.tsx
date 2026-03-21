import { Ionicons } from "@expo/vector-icons";
import {
	AudioModule,
	RecordingPresets,
	setAudioModeAsync,
	useAudioRecorder,
	useAudioRecorderState,
} from "expo-audio";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { API_BASE_URL } from "../config/api";
import { BYOP_API_KEY_KEY, BYOP_PROVIDER_KEY } from "../config/byop";

const PROVIDERS = [
	{ id: "free", name: "Free (default)", keyUrl: null },
	{
		id: "azure",
		name: "Azure Speech Services",
		keyUrl: "https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/SpeechServices",
	},
	{
		id: "google",
		name: "Google Cloud Speech",
		keyUrl: "https://aistudio.google.com/app/apikey",
	},
	{
		id: "openai",
		name: "OpenAI Whisper",
		keyUrl: "https://platform.openai.com/api-keys",
	},
] as const;

type Provider = (typeof PROVIDERS)[number]["id"];

type TestStep = "idle" | "recording" | "analyzing" | "success" | "error";

export default function SettingsScreen() {
	const [provider, setProvider] = useState<Provider>("free");
	const [apiKey, setApiKey] = useState("");
	const [showPicker, setShowPicker] = useState(false);
	const [testStep, setTestStep] = useState<TestStep>("idle");
	const [testError, setTestError] = useState<string | null>(null);

	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recorderState = useAudioRecorderState(recorder, 200);

	const loadSettings = useCallback(async () => {
		try {
			const savedProvider = await SecureStore.getItemAsync(BYOP_PROVIDER_KEY);
			const savedApiKey = await SecureStore.getItemAsync(BYOP_API_KEY_KEY);

			if (savedProvider) {
				setProvider(savedProvider as Provider);
			}
			if (savedApiKey) {
				setApiKey(savedApiKey);
			}
		} catch (error) {
			console.error("Error loading settings:", error);
		}
	}, []);

	useEffect(() => {
		loadSettings();
	}, [loadSettings]);

	const saveSettings = useCallback(async () => {
		try {
			await SecureStore.setItemAsync(BYOP_PROVIDER_KEY, provider);
			if (apiKey && provider !== "free") {
				await SecureStore.setItemAsync(BYOP_API_KEY_KEY, apiKey);
			} else {
				await SecureStore.deleteItemAsync(BYOP_API_KEY_KEY);
			}
		} catch (error) {
			console.error("Error saving settings:", error);
			Alert.alert("Error", "Failed to save settings");
		}
	}, [provider, apiKey]);

	const handleProviderSelect = useCallback(async (selectedProvider: Provider) => {
		setProvider(selectedProvider);
		setShowPicker(false);
		setTestStep("idle");
		setTestError(null);
		await SecureStore.setItemAsync(BYOP_PROVIDER_KEY, selectedProvider);
	}, []);

	const startTestRecording = async () => {
		if (provider !== "free" && !apiKey) {
			Alert.alert("Error", "Please enter an API key first");
			return;
		}

		const { granted } = await AudioModule.requestRecordingPermissionsAsync();
		if (!granted) {
			Alert.alert(
				"Microphone Required",
				"Microphone access is needed to test your API key.",
				[
					{ text: "Cancel", style: "cancel" },
					{ text: "Settings", onPress: () => Linking.openSettings() },
				],
			);
			return;
		}

		try {
			await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
			await recorder.prepareToRecordAsync();
			recorder.record();
			setTestStep("recording");
			setTestError(null);
		} catch (err) {
			console.error("Failed to start recording", err);
			Alert.alert("Error", "Failed to start recording");
		}
	};

	const stopAndAnalyze = async () => {
		try {
			await recorder.stop();
			await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
			const uri = recorder.uri;

			if (!uri) {
				setTestStep("error");
				setTestError("No recording captured");
				return;
			}

			setTestStep("analyzing");
			await saveSettings();

			const formData = new FormData();
			formData.append("audio", {
				uri,
				type: "audio/m4a",
				name: "test-recording.m4a",
			} as unknown as Blob);
			formData.append("target_text", "Hello world");
			if (provider !== "free") {
				formData.append("provider", provider);
			}

			const headers: Record<string, string> = {
				"Content-Type": "multipart/form-data",
			};
			if (apiKey && provider !== "free") {
				headers["X-Provider-Api-Key"] = apiKey;
			}

			const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
				method: "POST",
				body: formData,
				headers,
			});

			if (response.ok) {
				setTestStep("success");
			} else {
				const errorData = await response.json().catch(() => null);
				const detail = errorData?.detail || `Server error (${response.status})`;
				setTestStep("error");
				setTestError(detail);
			}
		} catch (err) {
			console.error("Test failed:", err);
			setTestStep("error");
			setTestError("Failed to connect to server");
		}
	};

	const resetTest = () => {
		setTestStep("idle");
		setTestError(null);
	};

	const renderTestSection = () => {
		if (testStep === "idle") {
			return (
				<TouchableOpacity
					style={[styles.button, styles.testButton]}
					onPress={startTestRecording}
				>
					<Ionicons name="mic" size={20} color="#fff" style={styles.buttonIcon} />
					<Text style={styles.buttonText}>Record & Verify</Text>
				</TouchableOpacity>
			);
		}

		if (testStep === "recording") {
			return (
				<View style={styles.testContainer}>
					<View style={styles.recordingIndicator}>
						<View style={styles.recordingDot} />
						<Text style={styles.recordingLabel}>
							Recording... ({Math.round(recorderState.durationMillis / 1000)}s)
						</Text>
					</View>
					<Text style={styles.testHint}>Say anything, e.g. "Hello world"</Text>
					<TouchableOpacity
						style={[styles.button, styles.stopButton]}
						onPress={stopAndAnalyze}
					>
						<Ionicons name="stop" size={20} color="#fff" style={styles.buttonIcon} />
						<Text style={styles.buttonText}>Stop & Verify</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (testStep === "analyzing") {
			return (
				<View style={styles.testContainer}>
					<View style={styles.statusRow}>
						<Ionicons name="hourglass" size={20} color="#FF9500" />
						<Text style={styles.analyzingText}>Analyzing with {provider}...</Text>
					</View>
				</View>
			);
		}

		if (testStep === "success") {
			return (
				<View style={styles.testContainer}>
					<View style={styles.statusRow}>
						<Ionicons name="checkmark-circle" size={24} color="#34C759" />
						<Text style={styles.successText}>API key verified!</Text>
					</View>
					<TouchableOpacity style={styles.retryLink} onPress={resetTest}>
						<Text style={styles.retryText}>Test again</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return (
			<View style={styles.testContainer}>
				<View style={styles.statusRow}>
					<Ionicons name="close-circle" size={24} color="#FF3B30" />
					<Text style={styles.errorText}>Verification failed</Text>
				</View>
				{testError && <Text style={styles.errorDetail}>{testError}</Text>}
				<TouchableOpacity style={styles.retryLink} onPress={resetTest}>
					<Text style={styles.retryText}>Try again</Text>
				</TouchableOpacity>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
				<Text style={styles.title}>Settings</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Speech API</Text>

					<View style={styles.field}>
						<Text style={styles.label}>Provider</Text>
						<TouchableOpacity
							style={styles.dropdownButton}
							onPress={() => setShowPicker(!showPicker)}
						>
							<Text style={styles.dropdownText}>
								{PROVIDERS.find((p) => p.id === provider)?.name}
							</Text>
							<Ionicons
								name={showPicker ? "chevron-up" : "chevron-down"}
								size={20}
								color="#007AFF"
							/>
						</TouchableOpacity>

						{showPicker && (
							<View style={styles.pickerContainer}>
								{PROVIDERS.map((p) => (
									<TouchableOpacity
										key={p.id}
										style={[styles.pickerItem, provider === p.id && styles.pickerItemSelected]}
										onPress={() => handleProviderSelect(p.id)}
									>
										<Text
											style={[
												styles.pickerItemText,
												provider === p.id && styles.pickerItemTextSelected,
											]}
										>
											{p.name}
										</Text>
										{provider === p.id && (
											<Ionicons name="checkmark" size={20} color="#007AFF" />
										)}
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>

					{provider !== "free" && (
						<View style={styles.field}>
							<Text style={styles.label}>API Key</Text>
							<TextInput
								style={styles.input}
								value={apiKey}
								onChangeText={setApiKey}
								placeholder={`Enter ${provider} API key`}
								secureTextEntry
								autoCapitalize="none"
								autoCorrect={false}
							/>
							{PROVIDERS.find((p) => p.id === provider)?.keyUrl && (
								<TouchableOpacity
									style={styles.getKeyLink}
									onPress={() => {
										const url = PROVIDERS.find((p) => p.id === provider)?.keyUrl;
										if (url) Linking.openURL(url);
									}}
								>
									<Ionicons name="key-outline" size={16} color="#007AFF" />
									<Text style={styles.getKeyText}>Get API Key →</Text>
								</TouchableOpacity>
							)}
						</View>
					)}

					{renderTestSection()}
				</View>

				<View style={styles.infoSection}>
					<Ionicons name="information-circle" size={20} color="#8E8E93" />
					<Text style={styles.infoText}>
						{provider === "free"
							? "Record a short sample to verify the server connection."
							: "Record a short sample to verify your API key works with the selected provider."}
					</Text>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollView: {
		flex: 1,
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 24,
		marginTop: 8,
	},
	section: {
		backgroundColor: "#F8F8F8",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 16,
		color: "#000",
	},
	field: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 8,
		color: "#000",
	},
	dropdownButton: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: "#E5E5EA",
	},
	dropdownText: {
		fontSize: 16,
		color: "#000",
	},
	pickerContainer: {
		backgroundColor: "#fff",
		borderRadius: 8,
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#E5E5EA",
		overflow: "hidden",
	},
	pickerItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5EA",
	},
	pickerItemSelected: {
		backgroundColor: "#E3F2FF",
	},
	pickerItemText: {
		fontSize: 16,
		color: "#000",
	},
	pickerItemTextSelected: {
		fontWeight: "600",
	},
	input: {
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "#E5E5EA",
	},
	getKeyLink: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
		gap: 4,
	},
	getKeyText: {
		fontSize: 14,
		color: "#007AFF",
		fontWeight: "500",
	},
	button: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		padding: 14,
	},
	buttonIcon: {
		marginRight: 8,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
	testButton: {
		backgroundColor: "#34C759",
	},
	stopButton: {
		backgroundColor: "#FF3B30",
	},
	testContainer: {
		alignItems: "center",
		gap: 12,
	},
	recordingIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	recordingDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#FF3B30",
	},
	recordingLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FF3B30",
	},
	testHint: {
		fontSize: 14,
		color: "#8E8E93",
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	analyzingText: {
		fontSize: 16,
		color: "#FF9500",
		fontWeight: "500",
	},
	successText: {
		fontSize: 16,
		color: "#34C759",
		fontWeight: "600",
	},
	errorText: {
		fontSize: 16,
		color: "#FF3B30",
		fontWeight: "600",
	},
	errorDetail: {
		fontSize: 14,
		color: "#8E8E93",
		textAlign: "center",
	},
	retryLink: {
		paddingVertical: 4,
	},
	retryText: {
		fontSize: 14,
		color: "#007AFF",
		fontWeight: "500",
	},
	infoSection: {
		flexDirection: "row",
		padding: 12,
		backgroundColor: "#F0F8FF",
		borderRadius: 8,
		marginTop: 8,
	},
	infoText: {
		flex: 1,
		fontSize: 14,
		color: "#8E8E93",
		marginLeft: 8,
		lineHeight: 20,
	},
});
