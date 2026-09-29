import { fireEventAsync, renderAsync, screen } from "@testing-library/react-native";
import { AudioModule, setAudioModeAsync } from "expo-audio";
import { Alert } from "react-native";
import AudioRecorder from "./AudioRecorder";

const mockRecorder = {
  prepareToRecordAsync: jest.fn(async () => {}),
  record: jest.fn(),
  stop: jest.fn(async () => {}),
  uri: "file:///recording.m4a",
};
const mockRecorderState = { isRecording: false, durationMillis: 0 };
const mockPlayer = { replace: jest.fn(), pause: jest.fn() };

jest.mock("expo-audio", () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: jest.fn(async () => {}),
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => mockRecorderState,
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => ({ playing: false }),
}));
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => <Text>{name}</Text> };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRecorderState.isRecording = false;
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockResolvedValue({
    granted: true,
  } as Awaited<ReturnType<typeof AudioModule.requestRecordingPermissionsAsync>>);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

it("does not offer recording when microphone permission is denied", async () => {
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockResolvedValue({
    granted: false,
  } as Awaited<ReturnType<typeof AudioModule.requestRecordingPermissionsAsync>>);
  await renderAsync(<AudioRecorder onRecordingComplete={jest.fn()} />);
  expect(screen.getByText("Microphone permission not granted")).toBeTruthy();
  expect(screen.queryByText("mic")).toBeNull();
  expect(mockRecorder.record).not.toHaveBeenCalled();
});

it("starts recording, clears the old result, then returns the stopped recording URI", async () => {
  const onRecordingComplete = jest.fn();
  const view = await renderAsync(<AudioRecorder onRecordingComplete={onRecordingComplete} />);
  await fireEventAsync.press(screen.getByText("mic"));
  expect(setAudioModeAsync).toHaveBeenCalledWith({
    allowsRecording: true,
    playsInSilentMode: true,
  });
  expect(mockRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
  expect(mockRecorder.record).toHaveBeenCalledTimes(1);
  expect(onRecordingComplete).toHaveBeenLastCalledWith(null);

  mockRecorderState.isRecording = true;
  await view.rerenderAsync(<AudioRecorder onRecordingComplete={onRecordingComplete} />);
  await fireEventAsync.press(screen.getByText("stop"));
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(setAudioModeAsync).toHaveBeenLastCalledWith({
    allowsRecording: false,
    playsInSilentMode: true,
  });
  expect(onRecordingComplete).toHaveBeenLastCalledWith("file:///recording.m4a");
  expect(mockPlayer.replace).toHaveBeenCalledWith("file:///recording.m4a");
  expect(screen.getByText("Re-record")).toBeTruthy();
});
