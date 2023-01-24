import { RequestOptions, RequestRequestOptions } from "@octokit/types";

export interface RetryState {
  enabled: boolean;
  retryAfterBaseValue: number;
  doNotRetry: number[];
  retries: number;
}

export interface RequestOptionsWithRequest extends RequestOptions {
  request: RequestRequestOptions;
}
