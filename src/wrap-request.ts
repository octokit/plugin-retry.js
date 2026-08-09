import Bottleneck, { type RetryableInfo } from "bottleneck/light.js";
import { RequestError } from "@octokit/request-error";
import { errorRequest } from "./error-request.js";
import type { RetryPlugin, RetryState } from "./types.js";
import type { EndpointDefaults, OctokitResponse } from "@octokit/types";

type RequestHook = (
  options: Required<EndpointDefaults>,
) => OctokitResponse<any, number> | Promise<OctokitResponse<any, number>>;

export async function wrapRequest(
  state: RetryState,
  octokit: RetryPlugin,
  request: RequestHook,
  options: Required<EndpointDefaults>,
) {
  const limiter = new Bottleneck();

  limiter.on("failed", function (error: RequestError, info: RetryableInfo) {
    const maxRetries = error.request.request?.retries || 0;
    const after = error.request.request?.retryAfter || 0;
    options.request.retryCount = info.retryCount + 1;

    if (maxRetries > info.retryCount) {
      // Returning a number instructs the limiter to retry
      // the request after that number of milliseconds have passed
      return after * state.retryAfterBaseValue;
    }

    // Do not retry.
    return undefined;
  });

  return limiter.schedule(
    requestWithGraphqlErrorHandling.bind(null, state, octokit, request),
    options,
  );
}

async function requestWithGraphqlErrorHandling(
  state: RetryState,
  octokit: RetryPlugin,
  request: RequestHook,
  options: Required<EndpointDefaults>,
): Promise<OctokitResponse<any, number>> {
  const response = await request(options);

  if (
    response.data &&
    response.data.errors &&
    response.data.errors.length > 0 &&
    /Something went wrong while executing your query/.test(
      response.data.errors[0].message,
    )
  ) {
    // simulate 500 request error for retry handling
    const error = new RequestError(response.data.errors[0].message, 500, {
      request: options,
      response,
    });
    return errorRequest(state, octokit, error, options);
  }

  return response;
}
