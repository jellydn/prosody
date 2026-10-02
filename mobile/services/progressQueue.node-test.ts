import assert from "node:assert/strict";
import { test } from "node:test";
import { ProgressQueue, PROGRESS_QUEUE_KEY, type ProgressSubmission } from "./progressQueue";

const submission: ProgressSubmission = {
  submission_id: "fb431cb1-f8e9-428a-a84f-c71f5c89a61c",
  user_id: 7,
  day: 2,
  exercises_completed: 3,
  rhythm_score: 2.3,
  stress_score: 3.4,
  pacing_score: 4.1,
  intonation_score: 1.5,
};

function storage() {
  const data = new Map<string, string>([["userId", "7"]]);
  return {
    data,
    async getItem(key: string) {
      return data.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

test("offline progress survives restart and reuses its key after a lost response", async () => {
  const store = storage();
  const received: ProgressSubmission[] = [];
  const queue = new ProgressQueue(store, async (item) => {
    received.push(item);
    throw new Error("response lost");
  });
  await queue.enqueue(submission);
  await queue.sync();
  assert.match(queue.getStatus(), /1 session.*Sync failed/);
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_QUEUE_KEY)!), [submission]);
  const restarted = new ProgressQueue(store, async (item) => {
    received.push(item);
  });
  await restarted.sync();
  assert.deepEqual(received, [submission, submission]);
  assert.equal(store.data.get(PROGRESS_QUEUE_KEY), "[]");
  assert.equal(restarted.getStatus(), "Progress is synced.");
});

test("concurrent enqueue and sync cannot lose newly saved work", async () => {
  const store = storage();
  let release!: () => void;
  let started!: () => void;
  const sending = new Promise<void>((resolve) => {
    started = resolve;
  });
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let sends = 0;
  const queue = new ProgressQueue(store, async () => {
    sends++;
    started();
    await response;
  });
  await Promise.all([queue.enqueue(submission), queue.enqueue(submission)]);
  const sync = queue.sync();
  await sending;
  const overlap = queue.sync();
  await queue.enqueue({ ...submission, submission_id: "second", day: 3 });
  release();
  await Promise.all([sync, overlap]);
  assert.equal(sends, 1);
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_QUEUE_KEY)!), [
    { ...submission, submission_id: "second", day: 3 },
  ]);
  await queue.sync();
  assert.equal(sends, 2);
  assert.equal(store.data.get(PROGRESS_QUEUE_KEY), "[]");
});

test("only the current user's entries are sent and another user's entries stay intact", async () => {
  const store = storage();
  const received: ProgressSubmission[] = [];
  const queue = new ProgressQueue(store, async (item) => {
    received.push(item);
  });
  await queue.enqueue(submission);
  await queue.enqueue({ ...submission, user_id: 9 });
  store.data.set("userId", "9");
  await queue.sync();
  assert.deepEqual(received, [{ ...submission, user_id: 9 }]);
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_QUEUE_KEY)!), [submission]);
  assert.match(queue.getStatus(), /another user/);
});

test("storage failures reject save and do not discard queued progress", async () => {
  const store = storage();
  const queue = new ProgressQueue(store, async () => {});
  store.setItem = async () => {
    throw new Error("disk full");
  };
  await assert.rejects(queue.enqueue(submission), /disk full/);
  store.data.set(PROGRESS_QUEUE_KEY, JSON.stringify([submission]));
  await queue.sync();
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_QUEUE_KEY)!), [submission]);
  assert.match(queue.getStatus(), /Sync failed/);
});

test("corrupt local data is not overwritten", async () => {
  const store = storage();
  store.data.set(PROGRESS_QUEUE_KEY, "broken");
  const queue = new ProgressQueue(store, async () => {
    assert.fail("must not send");
  });
  await assert.rejects(queue.enqueue(submission));
  await queue.sync();
  assert.equal(store.data.get(PROGRESS_QUEUE_KEY), "broken");
  assert.match(queue.getStatus(), /Cannot read/);
});

test("a rejected entry does not prevent other sessions from syncing", async () => {
  const store = storage();
  const queue = new ProgressQueue(store, async (item) => {
    if (item.day === 2) throw new Error("HTTP 409");
  });
  await queue.enqueue(submission);
  await queue.enqueue({ ...submission, day: 4, submission_id: "another" });
  await queue.sync();
  assert.deepEqual(JSON.parse(store.data.get(PROGRESS_QUEUE_KEY)!), [submission]);
});
