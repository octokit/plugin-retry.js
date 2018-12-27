module.exports = errorRequest

async function errorRequest (error, options) {
  console.log(error.retries)
  throw error
}
