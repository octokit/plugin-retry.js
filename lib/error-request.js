module.exports = errorRequest

async function errorRequest (octokit, state, error, options) {
  if (!state.doNotRetry.includes(error.status)) {
    const retries = options.request.retries != null ? options.request.retries : state.retries
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2)
    throw octokit.retry.retryRequest(error, retries, retryAfter)
  }

  // Maybe eventually there will be more cases here

  throw error
}
