const HttpStatus = require('http-status-codes')

const debugEnabled = () => process.env.NODE_ENV === 'DEV'

module.exports = _options => {
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
    const statusMessage =
      HttpStatus.getReasonPhrase(statusCode) || HttpStatus.getReasonPhrase(500)

    const errorResponse = {
      error: {
        type: err.name,
        message: 'Error',
        details: `An error occured when executing handler for path '${
          req.url
        }'`,
        http: {
          code: statusCode,
          status: statusMessage
        }
      }
    }

    if (debugEnabled()) {
      errorResponse.error.message = err.message
      errorResponse.error.stacktrace = (err.stack || '').split('\n')
    }

    return errorResponse
  }

  const pingResponse = (_req, _res) => {
    return {
      "I'm alive": new Date().toISOString()
    }
  }

  const healthResponse = (results, _req, _res) => {
    const allChecksPassed = results.every(result => result.status === 'OK')

    const systemInfo = {
      status: allChecksPassed ? 'OK' : 'Failure',
      subSystemStatus: results
    }

    return systemInfo
  }

  return {
    notFoundResponse,
    errorResponseTemplate,
    pingResponse,
    healthResponse
  }
}
