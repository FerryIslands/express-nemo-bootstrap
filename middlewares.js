const Sentry = require('@sentry/node')
const cors = require('cors')
const jwksRsa = require('jwks-rsa')
const expressHttpContextAuth0JwtVerify = require('express-nemo-auth0-jwt-verify')
const expressHttpContextCorrelationId = require('express-nemo-correlation-id')
const expressHttpContextLogger = require('express-nemo-logger')
const expressHttpContextRequestResponseLogger = require('express-nemo-request-response-logger')
const expressHttpContextPerformace = require('express-nemo-performance')
const expressHttpContextErrorResponse = require('express-nemo-error-response')
const expressHttpContextErrorLogger = require('express-nemo-error-logger')
const expressHttpNotFoundRoute = require('express-nemo-route-not-found')
const expressHttpPingRoute = require('express-nemo-route-ping')
const expressHttpHealthRoute = require('express-nemo-route-health')

const { version } = require('./package.json')

const performaceMonitor = expressHttpContextPerformace()

const enhancedBy = (req, res, next) => {
  res.set('X-Ehanced-By', `express-nemo-bootstrap v.${version}`)
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

const applicationInsightsIf = (options) => {
  const appInsightsIf = (_req, _res, next) => {
    if (process.env.AI_INSTRUMENTATION_KEY) {
      const appInsights = require('applicationinsights')

      appInsights.setup(process.env.AI_INSTRUMENTATION_KEY).setAutoCollectExceptions(false)
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = options.application
      appInsights.start()
    }
    next()
  }

  return appInsightsIf
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT
  })
}

const sentryPre = (req, res, next) => {
  if (process.env.SENTRY_DSN) {
    let requestHandler = Sentry.Handlers.requestHandler()
    return requestHandler(req, res, next)
  }
  return next()
}

const sentryError = (error, req, res, next) => {
  if (process.env.SENTRY_DSN) {
    if (req.user && req.user.sub) {
      const [_provider, _providerLocation, email] = req.user.sub.split('|')
      if (email) {
        Sentry.configureScope(scope => scope.setUser({ email }))
      }
    }

    let errorHandler = Sentry.Handlers.errorHandler()
    return errorHandler(error, req, res, next)
  }
  return next(error)
}

const defaults = {
  application: 'tm-express-app'
}

module.exports = options => {
  options = { ...defaults, ...options }

  const loggerFactory = require('./logger-factory')(options)
  const logEventFactory = require('./log-event-factory')(options)
  const responseFactory = require('./response-factory')(options)

  const logger = loggerFactory()

  logger.info(`Using express-nemo-bootstrap v.${version}`)

  if (corsEnabled()) {
    logger.info('CORS enabled (environment variable ALLOW_CORS is set to true)')
  }

  if (process.env.SENTRY_DSN) {
    logger.info('Sentry enabled')
  }

  if (process.env.AI_INSTRUMENTATION_KEY) {
    logger.info('Application Insights enabled')
  }

  return {
    pre: [
      sentryPre,
      applicationInsightsIf(options),
      enhancedBy,
      performaceMonitor.start,
      corsIf,
      expressHttpContextCorrelationId(),
      expressHttpContextLogger({ loggerFactory })
    ],

    auth: expressHttpContextAuth0JwtVerify({
      jwt: {
        // Dynamically provide a signing key
        // based on the kid in the header and
        // the signing keys provided by the JWKS endpoint.
        secret: jwksRsa.expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `https://nem0.eu.auth0.com/.well-known/jwks.json`
        }),

        // Validate the audience and the issuer.
        audience: 'https://nemo.stena.io/api',
        issuer: `https://nem0.eu.auth0.com/`,
        algorithms: ['RS256']
      }
    }),

    ping: expressHttpPingRoute({
      responseTemplate: responseFactory.pingResponse
    }),

    health: expressHttpHealthRoute({
      responseTemplate: responseFactory.healthResponse,
      checks: options.healthchecks
    }),

    post: [
      sentryError,
      expressHttpNotFoundRoute(responseFactory.notFoundResponse),
      performaceMonitor.end,
      expressHttpContextErrorLogger({
        eventTemplate: logEventFactory.createErrorLogEvent,
        excludeErrors: ['UnauthorizedError']
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
