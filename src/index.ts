import type { Octokit, OctokitOptions } from "@octokit/core";

import { VERSION } from "./version.js";
import { defaultShouldRetry, errorRequest } from "./error-request.js";
import { wrapRequest } from "./wrap-request.js";
import type {
  RequestOptionsWithRequest,
  RetryOptions,
  RetryPlugin,
  RetryRequestOptions,
  RetryState,
} from "./types.js";
import type { RequestRequestOptions } from "@octokit/types";
export { VERSION } from "./version.js";

export const defaultRetryState: RetryState = {
  enabled: true,
  retryAfterBaseValue: 1000,
  doNotRetry: [400, 401, 403, 404, 410, 422, 451],
  retries: 3,
  shouldRetry: defaultShouldRetry,
};

export function retry(
  octokit: Octokit,
  octokitOptions: OctokitOptions,
): RetryPlugin {
  const state: RetryState = Object.assign(
    {},
    defaultRetryState,
    octokitOptions.retry,
  );

  const retryPlugin: RetryPlugin = {
    retry: {
      retryRequest: (
        request: RequestOptionsWithRequest,
        retries: number,
        retryAfter: number,
      ) => {
        const newRequest: RequestRequestOptions &
          Required<RetryRequestOptions> = Object.assign({}, request.request, {
          retries: retries,
          retryAfter: retryAfter,
        } as Required<RetryRequestOptions>);

        return { ...request, request: newRequest };
      },
    },
  };

  if (state.enabled) {
    octokit.hook.error("request", errorRequest.bind(null, state, retryPlugin));
    octokit.hook.wrap("request", wrapRequest.bind(null, state, retryPlugin));
  }

  return retryPlugin;
}
retry.VERSION = VERSION;

declare module "@octokit/core/types" {
  interface OctokitOptions {
    retry?: RetryOptions;
  }
}

declare module "@octokit/types" {
  interface RequestRequestOptions {
    retries?: number;
    retryAfter?: number;
  }
}

export type { RetryPlugin, RetryOptions };
