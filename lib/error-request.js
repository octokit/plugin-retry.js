module.exports = errorRequest

async function errorRequest (error, options) {
  if (error.status === 500) {
    error.retries = 3
    error.retryAfter = 2 * (options.request.retryCount || 0)
  }
  throw error
}
