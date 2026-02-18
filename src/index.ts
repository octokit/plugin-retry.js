import type { Octokit, OctokitOptions } from "@octokit/core";
import type { RequestError } from "@octokit/request-error";

import { VERSION } from "./version.js";
import { errorRequest } from "./error-request.js";
import { wrapRequest } from "./wrap-request.js";
import type { RetryOptions, RetryPlugin, RetryState } from "./types.js";
import type { RequestRequestOptions } from "@octokit/types";
export { VERSION } from "./version.js";

export function retry(
  octokit: Octokit,
  octokitOptions: OctokitOptions,
): RetryPlugin {
  const state: RetryState = Object.assign(
    {
      enabled: true,
      retryAfterBaseValue: 1000,
      doNotRetry: [400, 401, 403, 404, 410, 422, 451],
      retries: 3,
    } satisfies RetryState,
    octokitOptions.retry,
  );

  const retryPlugin: RetryPlugin = {
    retry: {
      retryRequest: (
        error: RequestError,
        retries: number,
        retryAfter: number,
      ) => {
        error.request.request = Object.assign({}, error.request.request, {
          retries: retries,
          retryAfter: retryAfter,
        } satisfies RequestRequestOptions);

        return error;
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

export type { RetryPlugin, RetryOptions };
