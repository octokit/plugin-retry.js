module.exports = retryPlugin

const wrapRequest = require('./wrap-request')
const errorRequest = require('./error-request')

function retryPlugin (octokit) {
  octokit.hook.wrap('request', wrapRequest)
  // octokit.hook.error('request', errorRequest)
}
