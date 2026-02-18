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
  shouldRetry?: (state: RetryState, error: RequestError | Error) => boolean;
}

export type RetryState = Required<RetryOptions>;
