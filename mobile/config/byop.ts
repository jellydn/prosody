import * as SecureStore from "expo-secure-store";

export const BYOP_API_KEY_KEY = "speech_api_key";
export const BYOP_PROVIDER_KEY = "speech_provider";

type Provider = "free" | "azure" | "google" | "openai";

export async function appendByopToFormData(formData: FormData) {
  const savedProvider = await SecureStore.getItemAsync(BYOP_PROVIDER_KEY);
  const provider = (savedProvider as Provider | null) ?? "free";

  formData.append("provider", provider);

  if (provider !== "free") {
    const apiKey = await SecureStore.getItemAsync(BYOP_API_KEY_KEY);
    if (apiKey) {
      formData.append("api_key", apiKey);
    }
  }
}
