import { act, fireEventAsync, renderAsync, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { Exercise } from "./ExerciseScreen";
import StressDrillScreen from "./StressDrillScreen";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-audio", () => ({ setAudioModeAsync: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../config/byop", () => ({ appendByopToFormData: async () => ({}) }));
jest.mock("../components/AudioPlayer", () => () => null);
jest.mock("../components/FeedbackCard", () => () => null);
jest.mock("../components/AudioRecorder", () => {
  const { Button } = require("react-native");
  return ({ onRecordingComplete }: { onRecordingComplete: (uri: string) => void }) => (
    <Button title="Finish recording" onPress={() => onRecordingComplete("file:///synthetic.m4a")} />
  );
});

const originalFetch = global.fetch;
afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

it("retries the same recording after API downtime without completing the exercise early", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  const onComplete = jest.fn();
  const audio: unknown[] = [];
  const append = FormData.prototype.append;
  jest.spyOn(FormData.prototype, "append").mockImplementation(function (
    this: FormData,
    name,
    value,
  ) {
    if (name === "audio") audio.push(value);
    return append.call(this, name, value);
  });
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        rhythm_score: 3,
        stress_score: 4,
        pacing_score: 2,
        intonation_score: 5,
      }),
    });
  const exercise = {
    id: "offline-test",
    title: "Test",
    targetText: "Hello world",
    tips: [],
    type: "stress",
  } as unknown as Exercise;
  await renderAsync(
    <StressDrillScreen
      exercise={exercise}
      onNext={jest.fn()}
      onBack={jest.fn()}
      onComplete={onComplete}
    />,
  );
  await fireEventAsync.press(screen.getByText("Finish recording"));
  expect(onComplete).not.toHaveBeenCalled();
  expect(screen.queryByText("Next Exercise")).toBeNull();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2];
  await act(async () => buttons?.find((button) => button.text === "Retry")?.onPress?.());
  expect(audio).toEqual([
    { uri: "file:///synthetic.m4a", type: "audio/m4a", name: "recording.m4a" },
    { uri: "file:///synthetic.m4a", type: "audio/m4a", name: "recording.m4a" },
  ]);
  expect(screen.getByText("Next Exercise")).toBeTruthy();
  expect(onComplete).not.toHaveBeenCalled();
});
