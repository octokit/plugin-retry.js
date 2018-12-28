module.exports = errorRequest

async function errorRequest (octokit, error, options) {
  if (error.status === 500) {
    const retries = 3
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2)
    throw octokit.retry.retryRequest(error, retries, retryAfter)
  }

  /*
    TODO:
    Add more cases here.
    Use the 500 error above as example.
  */

  throw error
}
