const expect = require('chai').expect
const Octokit = require('./octokit')

describe('Trigger Retries', function () {
  it('Should trigger exponential retries on HTTP 500 errors', async function () {
    const octokit = new Octokit()
    octokit.retry._options({ retryAfterBaseValue: 50 })

    const res = await octokit.request('GET /route', {
      request: {
        responses: [
          { status: 500, headers: {}, data: { message: 'Did not retry, one' } },
          { status: 500, headers: {}, data: { message: 'Did not retry, two' } },
          { status: 500, headers: {}, data: { message: 'Did not retry, three' } },
          { status: 200, headers: {}, data: { message: 'Success!' } }
        ]
      }
    })

    expect(res.status).to.equal(200)
    expect(res.data).to.include({ message: 'Success!' })
    expect(octokit.__requestLog).to.deep.equal([
      'START GET /route',
      'START GET /route',
      'START GET /route',
      'START GET /route',
      'END GET /route'
    ])
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(50, 15)
    expect(octokit.__requestTimings[2] - octokit.__requestTimings[1]).to.be.closeTo(200, 15)
    expect(octokit.__requestTimings[3] - octokit.__requestTimings[2]).to.be.closeTo(450, 15)
  })
})
