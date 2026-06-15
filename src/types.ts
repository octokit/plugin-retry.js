import type { RequestError } from "@octokit/request-error";
import type { RequestOptions, RequestRequestOptions } from "@octokit/types";

export interface RetryRequestOptions {
  retries?: number;
  retryAfter?: number;
}

export type RequestOptionsWithRequest = RequestOptions & {
  request: RequestRequestOptions & RetryRequestOptions;
};

export interface RetryPlugin {
  retry: {
    retryRequest: (
      request: RequestOptionsWithRequest,
      retries: number,
      retryAfter: number,
    ) => RequestOptions & {
      request: RequestRequestOptions & Required<RetryRequestOptions>;
    };
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
