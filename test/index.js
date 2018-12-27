const expect = require('chai').expect
const Octokit = require('./octokit')

describe('Automatic Retries', function () {
  it('Should retry once and pass', async function () {
    const mapper = function (error) {
      error.retries = 1
      return error
    }
    const octokit = new Octokit.mapper(mapper)()

    const res = await octokit.request('GET /route', {
      request: {
        responses: [
          { status: 403, headers: {}, data: { message: 'Did not retry' } },
          { status: 200, headers: {}, data: { message: 'Success!'} },
        ]
      }
    })

    expect(res.status).to.equal(200)
    expect(res.data).to.include({ message: 'Success!' })
    expect(octokit.__requestLog).to.deep.equal([
      'START GET /route',
      'START GET /route',
      'END GET /route'
    ])
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(0, 10)
  })

  it('Should retry twice and fail', async function () {
    const mapper = function (error) {
      error.retries = 2
      error.retryAfter = 0.5
      return error
    }
    const octokit = new Octokit.mapper(mapper)()

    try {
      const res = await octokit.request('GET /route', {
        request: {
          responses: [
            { status: 403, headers: {}, data: { message: 'ONE' } },
            { status: 403, headers: {}, data: { message: 'TWO' } },
            { status: 404, headers: {}, data: { message: 'THREE' } }
          ]
        }
      })
      throw new Error('Should not reach this point')
    } catch (error) {
      expect(error.status).to.equal(404)
      expect(error.message).to.equal('THREE')
    }
    expect(octokit.__requestLog).to.deep.equal([
      'START GET /route',
      'START GET /route',
      'START GET /route'
    ])
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(0, 10)
    expect(octokit.__requestTimings[2] - octokit.__requestTimings[1]).to.be.closeTo(0, 10)
  })

  it('Should retry after 1000ms', async function () {
    const mapper = function (error) {
      error.retries = 1
      error.retryAfter = 1
      return error
    }
    const octokit = new Octokit.mapper(mapper)()

    const res = await octokit.request('GET /route', {
      request: {
        responses: [
          { status: 403, headers: {}, data: {} },
          { status: 202, headers: {}, data: { message: 'Yay!'} },
        ]
      }
    })

    expect(res.status).to.equal(202)
    expect(res.data).to.include({ message: 'Yay!' })
    expect(octokit.__requestLog).to.deep.equal([
      'START GET /route',
      'START GET /route',
      'END GET /route'
    ])
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(1000, 10)
  })
})
