import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { apiErrorMessage, apiRequest } from "./apiRequest";

afterEach(() => mock.restoreAll());

test("returns JSON and preserves a write without automatic retries", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => Response.json({ id: 73 }));
  const options = { method: "POST", body: '{"day":4}' };
  assert.deepEqual(await apiRequest("https://example.test/progress", options), { id: 73 });
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(fetch.mock.calls[0].arguments[1]?.body, options.body);
});

test("reports a connection failure without retrying a write", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Network request failed");
  });
  await assert.rejects(
    apiRequest("https://example.test/users", { method: "POST" }),
    /Check your internet connection/,
  );
  assert.equal(fetch.mock.callCount(), 1);
});

for (const status of [500, 502, 503]) {
  test(`reports API downtime for HTTP ${status}`, async () => {
    mock.method(globalThis, "fetch", async () => new Response("down", { status }));
    await assert.rejects(apiRequest("https://example.test"), /server is unavailable/);
  });
}

for (const status of [401, 403]) {
  test(`reports access denial for HTTP ${status}`, async () => {
    mock.method(globalThis, "fetch", async () => new Response("denied", { status }));
    await assert.rejects(apiRequest("https://example.test"), /API access is blocked/);
  });
}

test("does not accept a successful HTML login page as an API response", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Log in</html>", { headers: { "content-type": "text/html" } }),
  );
  await assert.rejects(apiRequest("https://example.test"), /did not return API data/);
});

test("rejects an authentication redirect even if the destination returns JSON", async () => {
  const response = Response.json({ login: true });
  Object.defineProperty(response, "redirected", { value: true });
  mock.method(globalThis, "fetch", async () => response);
  await assert.rejects(apiRequest("https://example.test"), /API access is blocked/);
});

test("reports malformed JSON", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("{broken", { headers: { "content-type": "application/json" } }),
  );
  await assert.rejects(apiRequest("https://example.test"), /invalid data/);
});

test("times out and aborts even if the transport never settles", async () => {
  let signal: AbortSignal | null | undefined;
  mock.method(globalThis, "fetch", (_url: unknown, options?: RequestInit) => {
    signal = options?.signal;
    return new Promise<Response>(() => {});
  });
  await assert.rejects(apiRequest("https://example.test", {}, 10), /took too long/);
  assert.equal(signal?.aborted, true);
});

test("keeps the deadline active while the response body is stalled", async () => {
  const response = Response.json({ id: 1 });
  mock.method(response, "json", () => new Promise(() => {}));
  mock.method(globalThis, "fetch", async () => response);
  await assert.rejects(apiRequest("https://example.test", {}, 10), /took too long/);
});

test("does not show arbitrary internal exception details", () => {
  assert.equal(
    apiErrorMessage(new Error("private internal error")),
    "Something went wrong. Please try again.",
  );
});

test("preserves an actionable API validation error", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ detail: "Select a speech provider." }, { status: 400 }),
  );
  await assert.rejects(apiRequest("https://example.test"), /Select a speech provider/);
});
