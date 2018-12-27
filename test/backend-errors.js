const expect = require('chai').expect
const Octokit = require('./octokit')

const noop = x => x

describe('Trigger Retries', function () {
  it('Should trigger a retry on HTTP 500 errors', async function () {
    const octokit = new Octokit.mapper(noop)()

    const res = await octokit.request('GET /route', {
      request: {
        responses: [
          { status: 500, headers: {}, data: { message: 'Did not retry' } },
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
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(0, 12)
  })
})
