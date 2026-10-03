import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { API_BASE_URL } from "../config/api";
import { ApiError, apiRequest } from "./apiRequest";
import { ProgressQueue } from "./progressQueue";

export const progressQueue = new ProgressQueue(AsyncStorage, async (submission) => {
  const result = await apiRequest<{ id: number }>(`${API_BASE_URL}/api/v1/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  if (!Number.isInteger(result?.id) || result.id <= 0) {
    throw new ApiError("The server did not confirm the save. Your session is still saved locally.");
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
