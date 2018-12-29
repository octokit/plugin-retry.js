const expect = require('chai').expect
const Octokit = require('./octokit')

describe('Trigger Retries', function () {
  it('Should trigger exponential retries on HTTP 500 errors', async function () {
    const octokit = new Octokit({ retry: { retryAfterBaseValue: 50 } })

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
    expect(octokit.__requestTimings[1] - octokit.__requestTimings[0]).to.be.closeTo(50, 20)
    expect(octokit.__requestTimings[2] - octokit.__requestTimings[1]).to.be.closeTo(200, 20)
    expect(octokit.__requestTimings[3] - octokit.__requestTimings[2]).to.be.closeTo(450, 20)
  })

  it('Should not retry 400/401/403 errors', async function () {
    const octokit = new Octokit({ retry: { retryAfterBaseValue: 50 } })
    let caught = 0

    try {
      await octokit.request('GET /route', {
        request: {
          responses: [
            { status: 400, headers: {}, data: { message: 'Error 400' } },
            { status: 500, headers: {}, data: { message: 'Error 500' } }
          ]
        }
      })
    } catch (error) {
      expect(error.message).to.equal('Error 400')
      caught++
    }

    try {
      await octokit.request('GET /route', {
        request: {
          responses: [
            { status: 401, headers: {}, data: { message: 'Error 401' } },
            { status: 500, headers: {}, data: { message: 'Error 500' } }
          ]
        }
      })
    } catch (error) {
      expect(error.message).to.equal('Error 401')
      caught++
    }

    try {
      await octokit.request('GET /route', {
        request: {
          responses: [
            { status: 403, headers: {}, data: { message: 'Error 403' } },
            { status: 500, headers: {}, data: { message: 'Error 500' } }
          ]
        }
      })
    } catch (error) {
      expect(error.message).to.equal('Error 403')
      caught++
    }

    expect(caught).to.equal(3)
    expect(octokit.__requestLog).to.deep.equal([
      'START GET /route',
      'START GET /route',
      'START GET /route'
    ])
  })
})
