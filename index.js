const expressHttpContextCorrelationId = require('express-nemo-correlation-id')
const expressHttpContextLogger = require('express-nemo-logger')
const expressHttpContextRequestResponseLogger = require('express-nemo-request-response-logger')
const expressHttpContextPerformace = require('express-nemo-performance')
const expressHttpContextErrorResponse = require('express-nemo-error-response')
const expressHttpContextErrorLogger = require('express-nemo-error-logger')
const expressHttpNotFoundRoute = require('express-nemo-route-not-found')
const expressHttpPingRoute = require('./packages/express-nemo-route-ping')
const expressHttpHealthRoute = require('./packages/express-nemo-route-health')

const performaceMonitor = expressHttpContextPerformace()

const enhancedBy = (req, res, next) => {
  res.set('X-Ehanced-By', 'TM-Express')
  next()
}

const defaults = {
  application: 'TM-Express-App'
}

module.exports = options => {
  options = { ...defaults, ...options }

  const loggerFactory = require('./logger-factory')(options)
  const logEventFactory = require('./log-event-factory')(options)
  const responseFactory = require('./response-factory')(options)

  return {
    pre: [
      enhancedBy,
      performaceMonitor.start,
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
      expressHttpContextErrorResponse(),
      expressHttpContextRequestResponseLogger({
        logEventFactory: logEventFactory.createRequestResponseLogEvent
      })
    ]
  }
}
