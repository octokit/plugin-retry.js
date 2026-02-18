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

export interface RetryOptions {
  enabled?: boolean;
  retryAfterBaseValue?: number;
  doNotRetry?: number[];
  retries?: number;
}

export type RetryState = Required<RetryOptions>;

export function isRequestError(error: any): error is RequestError {
  return error.request !== undefined;
}
