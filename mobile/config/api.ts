const FALLBACK_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL && process.env.EXPO_PUBLIC_API_BASE_URL.trim().length > 0
    ? process.env.EXPO_PUBLIC_API_BASE_URL
    : FALLBACK_API_BASE_URL;
