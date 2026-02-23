import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
  { id: "free", name: "Free (default)" },
  { id: "azure", name: "Azure Speech Services" },
  { id: "google", name: "Google Cloud Speech" },
  { id: "openai", name: "OpenAI Whisper" },
] as const;

type Provider = (typeof PROVIDERS)[number]["id"];

export default function SettingsScreen() {
  const [provider, setProvider] = useState<Provider>("free");
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
    await SecureStore.setItemAsync(BYOP_PROVIDER_KEY, selectedProvider);
  }, []);

  const handleTest = useCallback(async () => {
    if (provider === "free") {
      Alert.alert("Info", "Free provider doesn't require an API key");
      return;
    }

    if (!apiKey) {
      Alert.alert("Error", "Please enter an API key");
      return;
    }

    setIsTesting(true);

    try {
      const formData = new FormData();
      formData.append("target_text", "Hello, this is a test");
      formData.append("provider", provider);
      formData.append("api_key", apiKey);

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await saveSettings();
        Alert.alert("Success", "API key verified successfully!");
      } else {
        const error = await response.text();
        Alert.alert("Error", `Failed to verify API key: ${error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      Alert.alert("Error", "Failed to connect to server. Make sure the backend is running.");
    } finally {
      setIsTesting(false);
    }
  }, [provider, apiKey, saveSettings]);

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
                    {provider === p.id && <Ionicons name="checkmark" size={20} color="#007AFF" />}
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
            </View>
          )}

          {provider !== "free" && (
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTest}
              disabled={isTesting}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{isTesting ? "Testing..." : "Test API Key"}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#8E8E93" />
          <Text style={styles.infoText}>
            API keys are stored securely on your device. Bring your own provider key for enhanced
            speech analysis.
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
