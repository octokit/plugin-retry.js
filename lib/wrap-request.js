module.exports = wrapRequest

async function wrapRequest (request, options, retryCount = 0) {
  const retryRequest = function (after) {
    return new Promise(resolve => setTimeout(resolve, after * 1000))
      .then(() => wrapRequest(request, options, retryCount + 1))
  }

  try {
    return await request(options)
  } catch (error) {
    const maxRetries = Math.max(~~error.retries, 0)
    const after = Math.max(~~error.retryAfter, 0)

    if (maxRetries > retryCount) {
      return retryRequest(after)
    }

    throw error
  }
}
