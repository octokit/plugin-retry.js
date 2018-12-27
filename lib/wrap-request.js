module.exports = wrapRequest

async function wrapRequest (request, options) {
  const retryRequest = function (after) {
    return new Promise(resolve => setTimeout(resolve, after * 1000))
      .then(() => wrapRequest(request, options))
  }

  try {
    return await request(options)
  } catch (error) {
    const retryCount = options.request != null ? ~~options.request.retryCount : 0
    const maxRetries = ~~error.retries
    const after = ~~error.retryAfter

    if (maxRetries > retryCount) {
      if (options.request) {
        options.request.retryCount++
      } else {
        options.request = { retryCount: retryCount + 1 }
      }
      return retryRequest(after)
    }

    throw error
  }
}
