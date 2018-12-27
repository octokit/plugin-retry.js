module.exports = retryPlugin

const wrapRequest = require('./wrap-request')

function retryPlugin (octokit) {
  octokit.hook.wrap('request', wrapRequest)
}
