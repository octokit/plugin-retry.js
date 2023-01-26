// @ts-ignore
import Bottleneck from "bottleneck/light";
import { RequestError } from "@octokit/request-error";

// @ts-ignore
export async function wrapRequest(state, request, options) {
  const limiter = new Bottleneck();

  // @ts-ignore
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
    requestWithGraphqlErrorHandling.bind(null, request),
    options
  );
}

// @ts-ignore
async function requestWithGraphqlErrorHandling(request, options) {
  const response = await request(request, options);

  if (
    response.data.errors &&
    /Something went wrong while executing your query/.test(
      response.data.errors[0].message
    )
  ) {
    // simulate 500 request error for retry handling
    const error = new RequestError(response.data.errors[0].message, 500, {
      request: options,
      response,
    });
    throw error;
  }

  return response;
}
