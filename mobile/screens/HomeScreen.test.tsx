import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, renderAsync, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { Alert } from "react-native";
import HomeScreen from "./HomeScreen";

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate, setParams: jest.fn() };

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../assets/curriculum", () => {
  const curriculum = jest.requireActual("../assets/curriculum");
  const days = { ...curriculum.CURRICULUM_BY_DAY };
  delete days[7];
  return { ...curriculum, CURRICULUM_BY_DAY: days };
});

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(AsyncStorage.getItem).mockResolvedValue("42");
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

async function renderHome(selectedDay: number | undefined, completedDays: number[]) {
  global.fetch = jest.fn(async (url) => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () =>
      String(url).endsWith("/summary") ? {} : completedDays.map((day) => ({ day })),
  })) as jest.Mock;
  const props = {
    route: { key: "home", name: "HomeMain", params: { selectedDay } },
    navigation: mockNavigation,
  } as unknown as ComponentProps<typeof HomeScreen>;
  await renderAsync(<HomeScreen {...props} />);
}

it.each([0, -1, 1.5, 15, NaN, Infinity, 7])(
  "falls back to day 1 for invalid or missing selected day %s",
  async (day) => {
    await renderHome(day, [4]);
    expect(screen.getByText("Day 1 of 14")).toBeTruthy();
  },
);

it.each([1, 14])("loads valid selected day %s", async (day) => {
  await renderHome(day, [4]);
  expect(screen.getByText(`Day ${day} of 14`)).toBeTruthy();
});

it("ignores invalid history entries when selecting the next day", async () => {
  await renderHome(undefined, [-4, 2, NaN, 400]);
  expect(screen.getByText("Day 3 of 14")).toBeTruthy();
});

it("falls back when the next curriculum day is missing", async () => {
  await renderHome(undefined, [6]);
  expect(screen.getByText("Day 1 of 14")).toBeTruthy();
});

it("caps completed progress at the final day", async () => {
  await renderHome(undefined, [14]);
  expect(screen.getByText("Day 14 of 14")).toBeTruthy();
});

it("opens an exercise from the fallback day", async () => {
  await renderHome(-1, []);
  expect(screen.getByText("Day 1 of 14")).toBeTruthy();
  const { CURRICULUM_BY_DAY } = jest.requireActual("../assets/curriculum");
  const exercise = CURRICULUM_BY_DAY[1].exercises[0];
  fireEvent.press(screen.getByText(exercise.title));
  expect(mockNavigate).toHaveBeenCalledWith("ExerciseScreen", { exercise, source: "home" });
});

it("keeps the selected bundled lesson available when the API is offline", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  global.fetch = jest.fn().mockRejectedValue(new TypeError("offline"));
  const props = {
    route: { key: "home", name: "HomeMain", params: { selectedDay: 4 } },
    navigation: mockNavigation,
  } as unknown as ComponentProps<typeof HomeScreen>;
  const view = await renderAsync(<HomeScreen {...props} />);
  expect(screen.getByText("Day 4 of 14")).toBeTruthy();
  expect(Alert.alert).toHaveBeenCalledWith(
    "Progress unavailable",
    expect.stringContaining("internet connection"),
    expect.arrayContaining([
      expect.objectContaining({ text: "Retry", onPress: expect.any(Function) }),
    ]),
  );
  await view.rerenderAsync(
    <HomeScreen {...props} route={{ ...props.route, params: { selectedDay: 6 } }} />,
  );
  expect(screen.getByText("Day 6 of 14")).toBeTruthy();
});
