const expect = require('chai').expect
const helpers = require('./helpers')

describe('Automatic Retries', function () {
  let octokit, tracker

  beforeEach(function () {
    const testObjects = helpers.beforeEach()
    octokit = testObjects.octokit
    tracker = testObjects.tracker
  })

  it('Should retry once and pass', async function () {
    octokit = octokit.plugin(helpers.editErrorPlugin(function (error) {
      error.retries = 1
      return error
    }))

    const res = await octokit.request(
      { method: 'GET', url: 'route', headers: {} },
      [
        { status: 403, headers: {}, data: { message: 'Did not retry' } },
        { status: 200, headers: {}, data: { message: 'Success!'} },
      ]
    )

    expect(res.status).to.equal(200)
    expect(res.data).to.include({ message: 'Success!' })
    expect(tracker.events).to.deep.equal([
      'START GET route',
      'START GET route',
      'END GET route'
    ])
    expect(tracker.timings[1] - tracker.timings[0]).to.be.closeTo(0, 10)
  })

  it('Should retry twice and fail', async function () {
    octokit = octokit.plugin(helpers.editErrorPlugin(function (error) {
      error.retries = 2
      return error
    }))

    try {
      const res = await octokit.request(
        { method: 'GET', url: 'route', headers: {} },
        [
          { status: 403, headers: {}, data: { message: 'ONE' } },
          { status: 403, headers: {}, data: { message: 'TWO' } },
          { status: 404, headers: {}, data: { message: 'THREE' } }
        ]
      )
      throw new Error('Should not reach this point')
    } catch (error) {
      expect(error.status).to.equal(404)
      expect(error.message).to.equal('THREE')
    }
    expect(tracker.events).to.deep.equal([
      'START GET route',
      'START GET route',
      'START GET route'
    ])
    expect(tracker.timings[1] - tracker.timings[0]).to.be.closeTo(0, 10)
    expect(tracker.timings[2] - tracker.timings[1]).to.be.closeTo(0, 10)
  })

  it('Should retry after 1000ms', async function () {
    octokit = octokit.plugin(helpers.editErrorPlugin(function (error) {
      error.retries = 1
      error.retryAfter = 1
      return error
    }))

    const res = await octokit.request(
      { method: 'GET', url: 'route', headers: {} },
      [
        { status: 403, headers: {}, data: {} },
        { status: 202, headers: {}, data: { message: 'Yay!'} },
      ]
    )

    expect(res.status).to.equal(202)
    expect(res.data).to.include({ message: 'Yay!' })
    expect(tracker.events).to.deep.equal([
      'START GET route',
      'START GET route',
      'END GET route'
    ])
    expect(tracker.timings[1] - tracker.timings[0]).to.be.closeTo(1000, 10)
  })
})
