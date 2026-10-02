import { fireEventAsync, renderAsync, screen } from "@testing-library/react-native";
import * as Speech from "expo-speech";
import AudioPlayer from "./AudioPlayer";

const mockPlayer = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() };
const mockStatus = { playing: false, currentTime: 0, duration: 12 };

jest.mock("expo-audio", () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => mockStatus,
}));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn(async () => {}) }));
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => <Text>{name}</Text> };
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockStatus, { playing: false, currentTime: 0, duration: 12 });
});

it.each([11, 12])("plays audio at position %s, seeking only at the end", async (position) => {
  mockStatus.currentTime = position;
  await renderAsync(<AudioPlayer audioUrl="https://example.test/model.wav" targetText="Hello" />);
  await fireEventAsync.press(screen.getByText("play"));
  expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  if (position === 12) {
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
  } else {
    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
  }
  expect(Speech.speak).not.toHaveBeenCalled();
});

it("pauses active audio playback", async () => {
  mockStatus.playing = true;
  await renderAsync(<AudioPlayer audioUrl="https://example.test/model.wav" targetText="Hello" />);
  await fireEventAsync.press(screen.getByText("pause"));
  expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
  expect(mockPlayer.play).not.toHaveBeenCalled();
});

it("uses speech when no model recording exists and stops it on a second press", async () => {
  await renderAsync(<AudioPlayer audioUrl={null} targetText="Please join our meeting" />);
  expect(screen.getByText("TTS model voice")).toBeTruthy();
  await fireEventAsync.press(screen.getByText("play"));
  expect(Speech.speak).toHaveBeenCalledWith(
    "Please join our meeting",
    expect.objectContaining({ language: "en-US" }),
  );
  await fireEventAsync.press(screen.getByText("pause"));
  expect(Speech.stop).toHaveBeenCalledTimes(1);
  expect(screen.getByText("play")).toBeTruthy();
  expect(mockPlayer.play).not.toHaveBeenCalled();
});
