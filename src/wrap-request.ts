import { RequestError } from "@octokit/request-error";
import { errorRequest, isRequestError } from "./error-request.js";
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
  let retryCount = 0;

  while (true) {
    try {
      return await requestWithGraphqlErrorHandling(
        state,
        octokit,
        request,
        options,
      );
    } catch (error) {
      if (!isRequestError(error)) {
        throw error;
      }

      const maxRetries = ~~error.request.request?.retries;
      const retryAfter = ~~error.request.request?.retryAfter;
      options.request.retryCount = retryCount + 1;

      if (maxRetries <= retryCount) {
        throw error;
      }

      const retryAfterMs = retryAfter * state.retryAfterBaseValue;
      if (retryAfterMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      }
      retryCount++;
    }
  }
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
