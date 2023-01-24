import { OctokitResponse } from "@octokit/types";
import Bottleneck from "bottleneck/light";
import { RetryState, RequestOptionsWithRequest } from "./types";

export async function wrapRequest(
  state: RetryState,
  request: (
    options: RequestOptionsWithRequest
  ) => Promise<OctokitResponse<any>>,
  options: RequestOptionsWithRequest
) {
  const limiter = new Bottleneck();

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

  return limiter.schedule<OctokitResponse<any>, RequestOptionsWithRequest>(
    request,
    options
  );
}
