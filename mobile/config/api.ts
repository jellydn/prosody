import { NativeModules, Platform } from "react-native";

const FALLBACK_API_BASE_URL = "http://localhost:8000";
const ANDROID_EMULATOR_API_BASE_URL = "http://10.0.2.2:8000";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function getDevServerHost(): string | null {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL || typeof scriptURL !== "string") {
    return null;
  }

  try {
    return new URL(scriptURL).hostname;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (__DEV__) {
    const host = getDevServerHost();
    if (host) {
      const isLocalHost = host === "localhost" || host === "127.0.0.1";
      if (Platform.OS === "android" && isLocalHost) {
        return ANDROID_EMULATOR_API_BASE_URL;
      }

      return `http://${host}:8000`;
    }

    if (Platform.OS === "android") {
      return ANDROID_EMULATOR_API_BASE_URL;
    }
  }

  return FALLBACK_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
