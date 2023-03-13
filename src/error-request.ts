// @ts-ignore

export async function errorRequest(state, octokit, error, options) {
  if (!error.request || !error.request.request) {
    // address https://github.com/octokit/plugin-retry.js/issues/8
    throw error;
  }

  // retry all >= 400 && not doNotRetry
  if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
    const retries =
      options.request.retries != null ? options.request.retries : state.retries;
    const retryCount = (options.request.retryCount || 0) + 1;
    let retryAfter;
    switch (state.strategy) {
      case "exponential":
        retryAfter = Math.round(Math.pow(2, retryCount));
        break;
      case "linear":
        retryAfter = retryCount;
        break;
      default: // "polynomial"
        retryAfter = Math.round(Math.pow(retryCount, 2));
        break;
    }
    throw octokit.retry.retryRequest(error, retries, retryAfter);
  }

  // Maybe eventually there will be more cases here

  throw error;
}
