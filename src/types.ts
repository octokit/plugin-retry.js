import type { RequestError } from "@octokit/request-error";

export interface RetryPlugin {
  retry: {
    retryRequest: (
      error: RequestError,
      retries: number,
      retryAfter: number,
    ) => RequestError;
  };
}

export interface RetryState {
  enabled: boolean;
  retryAfterBaseValue: number;
  doNotRetry: number[];
  retries: number;
}

export interface RetryOptions {
  retry: RetryOptions;
}

export function isRequestError(error: any): error is RequestError {
  return error.request !== undefined;
}
