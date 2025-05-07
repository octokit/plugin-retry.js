import type { Octokit as OctokitCore } from "@octokit/core";
import type { RequestError } from "@octokit/request-error";

export type RetryOptions = {
  enabled?: boolean;
  doNotRetry?: number[];
  retries?: number;
  retryAfterBaseValue?: number;
};

export type State = Required<RetryOptions>;
export type Octokit = OctokitCore & {
  retry: {
    retryRequest: (
      error: RequestError,
      retries: number,
      retryAfter: number,
    ) => RequestError;
  };
};
