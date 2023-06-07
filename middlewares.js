const Sentry = require('@sentry/node')
const cors = require('cors')
const jwksRsa = require('jwks-rsa')
const expressHttpContextAuth0JwtVerify = require('express-nemo-auth0-jwt-verify')
const expressHttpContextCorrelationId = require('express-nemo-correlation-id')
const expressHttpContextLogger = require('express-nemo-logger')
const expressHttpContextRequestResponseLogger = require('express-nemo-request-response-logger')
const expressHttpContextPerformance = require('express-nemo-performance')
const expressHttpContextErrorResponse = require('express-nemo-error-response')
const expressHttpContextErrorLogger = require('express-nemo-error-logger')
const expressHttpNotFoundRoute = require('express-nemo-route-not-found')
const expressHttpPingRoute = require('express-nemo-route-ping')
const expressHttpHealthRoute = require('express-nemo-route-health')

const { createEndHandler } = require('./endHandler.js')
const appInsights = require('./appInsights/appInsights')
const { merge: extend } = require('lodash')

const { version } = require('./package.json')
const { jwksOptions, validationOptions } = require('./authenticationOptions')

const performanceMonitor = expressHttpContextPerformance()

const enhancedBy = (req, res, next) => {
  res.set('X-Enhanced-By', `express-nemo-bootstrap v.${version}`)
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

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT
  })
}

const configureSentry = (req) => {
  if (req.user && req.user.sub) {
    // eslint-disable-next-line no-unused-vars
    const [_provider, _providerLocation, email] = req.user.sub.split('|')
    if (email) {
      Sentry.configureScope(scope => scope.setUser({ email }))
    } else {
      Sentry.configureScope(scope => scope.setUser({ id: req.user.sub }))
    }
  }
}

const sentryPre = (req, res, next) => {
  if (process.env.SENTRY_DSN) {
    const requestHandler = Sentry.Handlers.requestHandler()
    return requestHandler(req, res, next)
  }
  return next()
}

const sentryError = (error, req, res, next) => {
  if (process.env.SENTRY_DSN) {
    const errorHandler = Sentry.Handlers.errorHandler()
    return errorHandler(error, req, res, next)
  }
  return next(error)
}

const defaults = {
  application: 'tm-express-app',
  ...appInsights.defaultConfig
}

module.exports = options => {
  options = extend({}, defaults, options)

  appInsights.useDefaultApplicationNameIfNotOverridden(options.application, options.appInsightsConfig)

  const loggerFactory = require('./logger-factory')(options)
  const logEventFactory = require('./log-event-factory')(options)
  const responseFactory = require('./response-factory')(options)

  const logger = loggerFactory()

  logger.info(`Using express-nemo-bootstrap v.${version}`)

  if (process.env.AI_INSTRUMENTATION_KEY) {
    options.appInsights = appInsights.initAndStart(process.env.AI_INSTRUMENTATION_KEY, options.appInsightsConfig)
    logger.info('Application Insights enabled')
  }

  if (corsEnabled()) {
    logger.info('CORS enabled (environment variable ALLOW_CORS is set to true)')
  }

  const auth = expressHttpContextAuth0JwtVerify({
    jwt: {
      // Dynamically provide a signing key
      // based on the kid in the header and
      // the signing keys provided by the JWKS endpoint.
      secret: jwksRsa.expressJwtSecret(jwksOptions),
      ...validationOptions
    }
  })

  const authThenConfigureSentry = (req, res, next) => {
    const wrappedNext = err => {
      configureSentry(req)
      next(err)
    }

    auth(req, res, wrappedNext)
  }

  if (process.env.SENTRY_DSN) {
    logger.info('Sentry enabled')
  }

  const requestResponseLogger = expressHttpContextRequestResponseLogger({
    logEventFactory: logEventFactory.createRequestResponseLogEvent
  })

  return {
    dependencies: {
      appInsights
    },
    pre: [
      sentryPre,
      enhancedBy,
      performanceMonitor.start,
      corsIf,
      expressHttpContextCorrelationId(),
      appInsights.extendReqContext(options),
      expressHttpContextLogger({ loggerFactory }),
      createEndHandler(options, [
        performanceMonitor.end,
        requestResponseLogger
      ])
    ],

    auth: process.env.SENTRY_DSN ? authThenConfigureSentry : auth,

    ping: expressHttpPingRoute({
      responseTemplate: responseFactory.pingResponse
    }),

    health: expressHttpHealthRoute({
      responseTemplate: responseFactory.healthResponse,
      checks: options.healthchecks
    }),

    post: [
      performanceMonitor.error,
      expressHttpNotFoundRoute(responseFactory.notFoundResponse),
      sentryError,
      expressHttpContextErrorLogger({
        eventTemplate: logEventFactory.createErrorLogEvent,
        excludeErrors: ['UnauthorizedError']
      }),
      expressHttpContextErrorResponse({
        errorMessageTemplate: responseFactory.errorResponseTemplate
      })
    ]
  }
}
