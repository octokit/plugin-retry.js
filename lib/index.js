module.exports = retryPlugin

const wrapRequest = require('./wrap-request')
const errorRequest = require('./error-request')

function retryPlugin (octokit) {
  octokit.hook.error('request', errorRequest)
  octokit.hook.wrap('request', wrapRequest)
}
