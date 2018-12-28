module.exports = retryPlugin

const wrapRequest = require('./wrap-request')
const errorRequest = require('./error-request')

function retryPlugin (octokit) {
  const state = {
    retryAfterBaseValue: 1000
  }

  octokit.retry = {
    _options: (options = {}) => Object.assign(state, options),
    retryRequest: (error, retries, retryAfter) => {
      error.request.request.retries = retries
      error.request.request.retryAfter = retryAfter
      return error
    }
  }

  octokit.hook.error('request', errorRequest.bind(null, octokit))
  octokit.hook.wrap('request', wrapRequest.bind(null, state))
}
