module.exports = errorRequest

async function errorRequest (error, options) {
  if (error.status === 500) {
    error.retries = 1
    error.retryAfter = 1
  }
  throw error
}
