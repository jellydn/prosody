export class ApiError extends Error {}

export function apiErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

// Do not retry writes here: a lost response does not mean the server rejected them.
export async function apiRequest<T>(
  url: string,
  options: Omit<RequestInit, "signal"> = {},
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new ApiError("The server took too long to respond. Please try again."));
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      deadline,
      (async () => {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (response.redirected || response.status === 401 || response.status === 403) {
          throw new ApiError("API access is blocked. Check the server access settings.");
        }
        if (!response.ok) {
          if (
            response.status < 500 &&
            response.headers.get("content-type")?.includes("application/json")
          ) {
            const errorData = await response.json().catch(() => null);
            if (typeof errorData?.detail === "string") throw new ApiError(errorData.detail);
          }
          throw new ApiError(
            response.status >= 500
              ? "The server is unavailable. Please try again later."
              : `The request failed (${response.status}). Check your settings and try again.`,
          );
        }
        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new ApiError(
            "The server did not return API data. Check the server address and access settings.",
          );
        }
        try {
          return (await response.json()) as T;
        } catch {
          throw new ApiError("The server returned invalid data. Please try again later.");
        }
      })(),
    ]);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Cannot reach the server. Check your internet connection and try again.");
  } finally {
    clearTimeout(timeout);
  }
}
