const FakeOctokit = require('./fixtures/octokit')

exports.beforeEach = function () {
  const tracker = { events: [], timings: [], t0: Date.now() }

  const testPlugin = function (octokit) {
    octokit.hook.wrap('request', async function (request, options) {
      tracker.events.push(`START ${options.method} ${options.url}`)
      tracker.timings.push(Date.now() - tracker.t0)
      const response = await request(options)
      tracker.events.push(`END ${options.method} ${options.url}`)
      tracker.timings.push(Date.now() - tracker.t0)
      return response
    })
    return octokit
  }

  const octokit = new FakeOctokit()
    .plugin(require('../lib'))
    .plugin(testPlugin)

  return { tracker, octokit }
}

exports.editErrorPlugin = function (mapper) {
  return function (octokit) {
    octokit.hook.wrap('request', async function (request, options) {
      try {
        return await request(options)
      } catch (error) {
        throw mapper(error)
      }
    })
  }
}
