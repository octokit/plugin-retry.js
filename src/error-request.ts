import { type RetryPlugin, type RetryState } from "./types.js";
import type { RequestRequestOptions } from "@octokit/types";
import type { RequestError } from "@octokit/request-error";

export function isRequestError(error: any): error is RequestError {
  return error.request !== undefined;
}

export function defaultShouldRetry(
  state: RetryState,
  error: RequestError | Error,
): boolean {
  if (!isRequestError(error) || !error?.request.request) {
    // address https://github.com/octokit/plugin-retry.js/issues/8
    throw error;
  }

  return error.status >= 400 && !state.doNotRetry.includes(error.status);
}

export async function errorRequest(
  state: RetryState,
  octokit: RetryPlugin,
  error: RequestError | Error,
  options: { request: RequestRequestOptions },
): Promise<any> {
  if (isRequestError(error) && state.shouldRetry(state, error)) {
    const retries =
      options.request.retries != null ? options.request.retries : state.retries;
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
    throw octokit.retry.retryRequest(error, retries, retryAfter);
  }

  // Maybe eventually there will be more cases here

  throw error;
}
