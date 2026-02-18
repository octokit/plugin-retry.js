import type { Octokit } from "@octokit/core";
import { isRequestError, type RetryPlugin, type RetryState } from "./types.js";
import type { RequestRequestOptions } from "@octokit/types";
import type { RequestError } from "@octokit/request-error";

export async function errorRequest(
  state: RetryState,
  octokit: Octokit & RetryPlugin,
  error: RequestError | Error,
  options: { request: RequestRequestOptions },
): Promise<any> {
  if (!isRequestError(error) || !error?.request.request) {
    // address https://github.com/octokit/plugin-retry.js/issues/8
    throw error;
  }

  // retry all >= 400 && not doNotRetry
  if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
    const retries =
      options.request.retries != null ? options.request.retries : state.retries;
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
    throw octokit.retry.retryRequest(error, retries, retryAfter);
  }

  // Maybe eventually there will be more cases here

  throw error;
}
