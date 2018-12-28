module.exports = wrapRequest

async function wrapRequest (state, request, options) {
  const retryRequest = function (after) {
    return new Promise(resolve => setTimeout(resolve, after * state.retryAfterBaseValue))
      .then(() => wrapRequest(state, request, options))
  }

  try {
    return await request(options)
  } catch (error) {
    const retryCount = ~~options.request.retryCount
    const maxRetries = ~~error.request.request.retries
    const after = ~~error.request.request.retryAfter

    if (maxRetries > retryCount) {
      options.request.retryCount = retryCount + 1
      return retryRequest(after)
    }

    throw error
  }
}
