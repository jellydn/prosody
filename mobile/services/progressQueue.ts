export interface ProgressSubmission {
  submission_id: string;
  user_id: number;
  day: number;
  exercises_completed: number;
  rhythm_score: number;
  stress_score: number;
  pacing_score: number;
  intonation_score: number;
}

interface QueueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const PROGRESS_QUEUE_KEY = "pendingProgress.v1";

export class ProgressQueue {
  private writes: Promise<unknown> = Promise.resolve();
  private syncing: Promise<void> | null = null;
  private listeners = new Set<() => void>();
  private status = "Checking progress sync…";

  constructor(
    private storage: QueueStorage,
    private send: (submission: ProgressSubmission) => Promise<void>,
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getStatus = () => this.status;

  private report(status: string) {
    this.status = status;
    this.listeners.forEach((listener) => listener());
  }

  private exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writes.then(operation);
    this.writes = result.catch(() => {});
    return result;
  }

  private async read(): Promise<ProgressSubmission[]> {
    const raw = await this.storage.getItem(PROGRESS_QUEUE_KEY);
    const items: unknown = raw === null ? [] : JSON.parse(raw);
    // Do not replace unreadable local data with an empty queue.
    if (
      !Array.isArray(items) ||
      items.some(
        (item) =>
          !item || typeof item.submission_id !== "string" || !Number.isInteger(item.user_id),
      )
    )
      throw new Error("Cannot read saved progress");
    return items;
  }

  async enqueue(submission: ProgressSubmission): Promise<void> {
    await this.exclusive(async () => {
      const items = await this.read();
      if (
        !items.some(
          (item) =>
            item.submission_id === submission.submission_id && item.user_id === submission.user_id,
        )
      ) {
        await this.storage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify([...items, submission]));
      }
    });
    this.report("Progress saved on this device. Waiting to sync.");
  }

  sync = (): Promise<void> => {
    if (this.syncing) return this.syncing;
    this.syncing = this.flush().finally(() => {
      this.syncing = null;
    });
    return this.syncing;
  };

  private async flush(): Promise<void> {
    try {
      const userId = await this.storage.getItem("userId");
      const items = await this.exclusive(() => this.read());
      const owned = items.filter((item) => String(item.user_id) === userId);
      if (owned.length) this.report(`Syncing ${owned.length} saved session(s)…`);
      let failed = false;
      for (const item of owned) {
        // Never relabel queued work when onboarding selects another user.
        if ((await this.storage.getItem("userId")) !== userId) return;
        try {
          await this.send(item);
          await this.exclusive(async () => {
            const current = await this.read();
            await this.storage.setItem(
              PROGRESS_QUEUE_KEY,
              JSON.stringify(
                current.filter(
                  (entry) =>
                    entry.submission_id !== item.submission_id || entry.user_id !== item.user_id,
                ),
              ),
            );
          });
        } catch {
          failed = true;
        }
      }
      const remaining = await this.exclusive(() => this.read());
      const pending = remaining.filter((item) => String(item.user_id) === userId).length;
      this.report(
        pending
          ? `${pending} session(s) saved on this device. ${failed ? "Sync failed; will retry." : "Waiting to sync."}`
          : remaining.length
            ? "Saved progress for another user is waiting on this device."
            : "Progress is synced.",
      );
    } catch {
      this.report("Cannot read saved progress. Check device storage and retry.");
    }
  }
}
