const moment = require('moment')

module.exports = options => {
  const notFoundResponse = {
    notFoundResponseTemplate: (req, res) => {
      return {
        error: {
          type: 'http',
          message: 'Not Found',
          details: `No route matching path '${req.url}' was found`,
          http: {
            code: res.statusCode,
            status: 'Not Found'
          }
        }
      }
    }
  }

  const pingResponse = (req, res) => {
    return {
      "I'm alive": moment().format()
    }
  }

  const healthResponse = (results, req, res) => {
    const allChecksPassed = results.every(result => result.status === 'OK')

    const systemInfo = {
      status: allChecksPassed ? 'OK' : 'Failure',
      subSystemStatus: results
    }

    return systemInfo
  }

  return {
    notFoundResponse: notFoundResponse,
    pingResponse: pingResponse,
    healthResponse: healthResponse
  }
}
