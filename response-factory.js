const moment = require('moment')

const debugEnabled = () => process.env.NODE_ENV === 'DEV'

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
  const errorResponseTemplate = (err, req, res) => {
    const statusCode = res.statusCode
    let errorResponse = {
      error: {
        type: err.name,
        message: 'Unhandled error',
        details: `An error occured when executing handler for path '${
          req.url
        }'`,
        http: {
          code: statusCode,
          status: 'Internal Server Error'
        }
      }
    }

    if (debugEnabled()) {
      errorResponse.error.message = err.message
      errorResponse.error.stacktrace = (err.stack || '').split('\n')
    }

    return errorResponse
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
    errorResponseTemplate: errorResponseTemplate,
    pingResponse: pingResponse,
    healthResponse: healthResponse
  }
}
