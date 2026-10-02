import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { API_BASE_URL } from "../config/api";
import { ProgressQueue } from "./progressQueue";

export const progressQueue = new ProgressQueue(AsyncStorage, async (submission) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Progress sync failed: ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
});

export function startProgressSync() {
  void progressQueue.sync();
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") void progressQueue.sync();
  });
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) void progressQueue.sync();
  });
  // Also recover from a server failure while connectivity remains unchanged.
  const interval = setInterval(() => {
    if (AppState.currentState === "active") void progressQueue.sync();
  }, 30000);
  return () => {
    subscription.remove();
    unsubscribe();
    clearInterval(interval);
  };
}
