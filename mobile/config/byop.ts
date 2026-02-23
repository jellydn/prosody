import * as SecureStore from "expo-secure-store";

export const BYOP_API_KEY_KEY = "speech_api_key";
export const BYOP_PROVIDER_KEY = "speech_provider";

type Provider = "free" | "azure" | "google" | "openai";

export async function appendByopToFormData(formData: FormData): Promise<Record<string, string>> {
  const savedProvider = await SecureStore.getItemAsync(BYOP_PROVIDER_KEY);
  const provider = (savedProvider as Provider | null) ?? "free";

  if (provider === "free") {
    formData.append("provider", "free");
    return {};
  }

  const apiKey = await SecureStore.getItemAsync(BYOP_API_KEY_KEY);
  if (!apiKey) {
    formData.append("provider", "free");
    return {};
  }

  formData.append("provider", provider);
  return { "X-Provider-Api-Key": apiKey };
}
