import AsyncStorage from "@react-native-async-storage/async-storage";
import { PROGRESS_QUEUE_KEY } from "./progressQueue";
import { progressQueue } from "./progressSync";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@react-native-community/netinfo", () => ({ addEventListener: jest.fn() }));

const originalFetch = global.fetch;
const submission = {
  submission_id: "4f1c9045-7854-4d23-b7c8-de258657e75a",
  user_id: 42,
  day: 3,
  exercises_completed: 4,
  rhythm_score: 3,
  stress_score: 4,
  pacing_score: 2,
  intonation_score: 5,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem("userId", "42");
  await progressQueue.enqueue(submission);
});

afterEach(() => {
  global.fetch = originalFetch;
});

it.each([
  { ok: true, headers: { get: () => "text/html" }, json: async () => ({}) },
  { ok: false, status: 503 },
  { ok: true, headers: { get: () => "application/json" }, json: async () => ({}) },
])("retains queued progress after an unconfirmed save: %j", async (response) => {
  global.fetch = jest.fn().mockResolvedValue(response);
  await progressQueue.sync();
  expect(await AsyncStorage.getItem(PROGRESS_QUEUE_KEY)).toBe(JSON.stringify([submission]));
  expect(progressQueue.getStatus()).toContain("Sync failed");

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ id: 83 }),
  });
  await progressQueue.sync();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/progress"),
    expect.objectContaining({ body: JSON.stringify(submission) }),
  );
  expect(await AsyncStorage.getItem(PROGRESS_QUEUE_KEY)).toBe("[]");
  expect(progressQueue.getStatus()).toBe("Progress is synced.");
});
