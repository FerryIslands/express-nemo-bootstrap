const cors = require('cors')
const expressHttpContextCorrelationId = require('express-nemo-correlation-id')
const expressHttpContextLogger = require('express-nemo-logger')
const expressHttpContextRequestResponseLogger = require('express-nemo-request-response-logger')
const expressHttpContextPerformace = require('express-nemo-performance')
const expressHttpContextErrorResponse = require('express-nemo-error-response')
const expressHttpContextErrorLogger = require('express-nemo-error-logger')
const expressHttpNotFoundRoute = require('express-nemo-route-not-found')
const expressHttpPingRoute = require('express-nemo-route-ping')
const expressHttpHealthRoute = require('express-nemo-route-health')

const performaceMonitor = expressHttpContextPerformace()
const Logger = require('./logger')

const enhancedBy = (req, res, next) => {
  res.set('X-Ehanced-By', 'express-nemo-bootstrap')
  next()
}

const corsExpress = cors()

const corsEnabled = () => process.env.ALLOW_CORS === 'true'

const corsIf = (req, res, next) => {
  let nextError

  const cb = err => {
    nextError = err
  }

  if (corsEnabled()) {
    corsExpress(req, res, cb)
  }

  next(nextError)
}

const defaults = {
  application: 'tm-express-app'
}

module.exports = options => {
  options = { ...defaults, ...options }

  const loggerFactory = require('./logger-factory')(options)
  const logEventFactory = require('./log-event-factory')(options)
  const responseFactory = require('./response-factory')(options)

  const logger = new Logger({
    context: {
      origin: {
        name: options.application
      }
    }
  })

  if (corsEnabled()) {
    logger.info('CORS enabled (environment variable ALLOW_CORS is set to true)')
  }

  return {
    pre: [
      enhancedBy,
      performaceMonitor.start,
      corsIf,
      expressHttpContextCorrelationId(),
      expressHttpContextLogger({ loggerFactory })
    ],

    ping: expressHttpPingRoute({
      responseTemplate: responseFactory.pingResponse
    }),

    health: expressHttpHealthRoute({
      responseTemplate: responseFactory.healthResponse,
      checks: options.healthchecks
    }),

    post: [
      expressHttpNotFoundRoute(responseFactory.notFoundResponse),
      performaceMonitor.end,
      expressHttpContextErrorLogger({
        eventTemplate: logEventFactory.createErrorLogEvent
      }),
      expressHttpContextErrorResponse({
        errorMessageTemplate: responseFactory.errorResponseTemplate
      }),
      expressHttpContextRequestResponseLogger({
        logEventFactory: logEventFactory.createRequestResponseLogEvent
      })
    ]
  }
}
