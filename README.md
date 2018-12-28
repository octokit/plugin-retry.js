# plugin-retry.js

[![npm](https://img.shields.io/npm/v/@octokit/plugin-retry.svg)](https://www.npmjs.com/package/@octokit/plugin-retry)
[![Build Status](https://travis-ci.com/octokit/plugin-retry.js.svg?branch=beta)](https://travis-ci.com/octokit/plugin-retry.js)
[![Coverage Status](https://img.shields.io/coveralls/github/octokit/plugin-retry.js.svg)](https://coveralls.io/github/octokit/plugin-retry.js)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/plugin-retry.js.svg)](https://greenkeeper.io/)

Implements request retries for server error responses.

## Usage

```js
const Octokit = require('@ocotkit/rest')
  .plugin(require('@octokit/plugin-retry'))

const octokit = new Octokit()

// retries request up to 3 times in case of a 500 response
octokit.request('/').catch(error => {
  if (error.request.request.retryCount) {
    console.log(`request failed after ${error.request.request.retryCount} retries`)
  }

  console.error(error)
})
```

You can ask for retries for any request by passing `{ request: { retries }}`

```js
octokit.request('/', { request: { retries: 1 } }).catch(error => {
  if (error.request.request.retryCount) {
    console.log(`request failed after ${error.request.request.retryCount} retries`)
  }

  console.error(error)
})
```

## LICENSE

[MIT](LICENSE)
