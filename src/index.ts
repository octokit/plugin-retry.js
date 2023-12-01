import { Octokit } from "@octokit/core";
import type { RequestError } from "@octokit/request-error";

import { errorRequest } from "./error-request.js";
import { wrapRequest } from "./wrap-request.js";

export const VERSION = "0.0.0-development";

export function retry(octokit: Octokit, octokitOptions: any) {
  const state = Object.assign(
    {
      enabled: true,
      retryAfterBaseValue: 1000,
      doNotRetry: [400, 401, 403, 404, 422, 451],
      retries: 3,
    },
    octokitOptions.retry,
  );

  if (state.enabled) {
    octokit.hook.error("request", errorRequest.bind(null, state, octokit));
    octokit.hook.wrap("request", wrapRequest.bind(null, state, octokit));
  }

  return {
    retry: {
      retryRequest: (
        error: RequestError,
        retries: number,
        retryAfter: number,
      ) => {
        error.request.request = Object.assign({}, error.request.request, {
          retries: retries,
          retryAfter: retryAfter,
        });

        return error;
      },
    },
  };
}
retry.VERSION = VERSION;
