import { act, fireEventAsync, renderAsync, screen } from "@testing-library/react-native";
import ProgressSyncStatus from "./ProgressSyncStatus";
import { progressQueue } from "../services/progressSync";

let mockStatus = "Progress is synced.";
const mockListeners = new Set<() => void>();

jest.mock("../services/progressSync", () => ({
  progressQueue: {
    getStatus: () => mockStatus,
    subscribe: (listener: () => void) => {
      mockListeners.add(listener);
      return () => mockListeners.delete(listener);
    },
    sync: jest.fn(async () => {}),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStatus = "Progress is synced.";
});

it.each(["Progress is synced.", "Checking progress sync…"])(
  "renders no banner or retry control for %s",
  async (status) => {
    mockStatus = status;
    await renderAsync(<ProgressSyncStatus />);
    expect(screen.toJSON()).toBeNull();
  },
);

it("keeps failed progress retryable and removes the banner after recovery", async () => {
  mockStatus = "1 session(s) saved on this device. Sync failed; will retry.";
  await renderAsync(<ProgressSyncStatus />);
  expect(screen.getByText(mockStatus)).toBeTruthy();
  await fireEventAsync.press(screen.getByRole("button"));
  expect(progressQueue.sync).toHaveBeenCalledTimes(1);

  await act(async () => {
    mockStatus = "Progress is synced.";
    mockListeners.forEach((listener) => {
      listener();
    });
  });
  expect(screen.toJSON()).toBeNull();
});
