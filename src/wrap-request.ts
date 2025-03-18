// @ts-expect-error
import Bottleneck from "bottleneck/light.js";
import type TBottleneck from "bottleneck";
import { RequestError } from "@octokit/request-error";
import { errorRequest } from "./error-request.js";
import type { Octokit, State } from "./types.js";
import type { EndpointDefaults, OctokitResponse } from "@octokit/types";

type Request = (
  request: Request,
  options: Required<EndpointDefaults>,
) => Promise<OctokitResponse<any>>;
export async function wrapRequest(
  state: State,
  octokit: Octokit,
  request: (
    options: Required<EndpointDefaults>,
  ) => Promise<OctokitResponse<any>>,
  options: Required<EndpointDefaults>,
) {
  const limiter: TBottleneck = new Bottleneck();

  limiter.on("failed", function (error, info) {
    const maxRetries = ~~error.request.request.retries;
    const after = ~~error.request.request.retryAfter;
    options.request.retryCount = info.retryCount + 1;

    if (maxRetries > info.retryCount) {
      // Returning a number instructs the limiter to retry
      // the request after that number of milliseconds have passed
      return after * state.retryAfterBaseValue;
    }
  });

  return limiter.schedule(
    // @ts-expect-error
    requestWithGraphqlErrorHandling.bind(null, state, octokit, request),
    options,
  );
}

async function requestWithGraphqlErrorHandling(
  state: State,
  octokit: Octokit,
  request: (
    request: Request,
    options: Required<EndpointDefaults>,
  ) => Promise<OctokitResponse<any>>,
  options: Required<EndpointDefaults>,
) {
  const response = await request(request, options);

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
