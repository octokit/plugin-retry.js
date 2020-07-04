import { RequestOptions, OctokitResponse } from "@octokit/types";
import Bottleneck from "bottleneck/light";
import { RetryState } from "./types";

export async function wrapRequest(
  state: RetryState,
  request: (options: RequestOptions) => Promise<OctokitResponse<any>>,
  options: RequestOptions
) {
  const limiter = new Bottleneck();

  limiter.on("failed", function (error, info) {
    const maxRetries = ~~error.request.request.retries;
    const after = ~~error.request.request.retryAfter;

    if (!options.request) {
      options.request = {};
    }
    options.request.retryCount = info.retryCount + 1;

    if (maxRetries > info.retryCount) {
      // Returning a number instructs the limiter to retry
      // the request after that number of milliseconds have passed
      return after * state.retryAfterBaseValue;
    }
  });

  return limiter.schedule<OctokitResponse<any>, RequestOptions>(
    request,
    options
  );
}
