import type { Octokit } from "@octokit/core";
import type { RequestError } from "@octokit/request-error";

import { VERSION } from "./version.js";
import { errorRequest } from "./error-request.js";
import { wrapRequest } from "./wrap-request.js";
export { VERSION } from "./version.js";

export enum RetryStrategy {
  exponential = "exponential",
  linear = "linear",
  polynomial = "polynomial",
}

export function retry(octokit: Octokit, octokitOptions: any) {
  const state = Object.assign(
    {
      enabled: true,
      retryAfterBaseValue: 1000,
      doNotRetry: [400, 401, 403, 404, 410, 422, 451],
      retries: 3,
      strategy: RetryStrategy.polynomial,
    },
    octokitOptions.retry,
  );

  if (!RetryStrategy.hasOwnProperty(state.strategy)) {
    throw new Error(`Invalid retry strategy: ${state.strategy}`);
  }

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
