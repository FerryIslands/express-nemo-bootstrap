const express = require('express')
const Logger = require('./logger')
const Sentry = require('@sentry/node')
const merge = require('lodash/merge')

const defaultOptions = {
  basePath: '/',
  injectable: {
    beforePre: [],
    afterPre: [],
    beforePost: [],
    afterPost: []
  }
}

const captureException = (error) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error)
  }
}

const expressNemo = options => {
  options = merge(defaultOptions, options)

  const middlewares = require('./middlewares')(options)

  const PORT = process.env.PORT || 4000
  const logger = new Logger({
    context: {
      origin: {
        name: options.application
      }
    }
  })

  return {
    options: options,
    middlewares: middlewares,

    serve: async bootstrap => {
      const nemoApp = express()

      if (options.injectable.beforePre.length) {
        nemoApp.use(options.injectable.beforePre)
      }

      nemoApp.use(middlewares.pre)

      if (options.injectable.afterPre.length) {
        nemoApp.use(options.injectable.afterPre)
      }

      const routedApp = express()
      routedApp
        .get('/ping', middlewares.ping)
        .get('/health', middlewares.health)

      await bootstrap(routedApp, middlewares)

      nemoApp.use(options.basePath, routedApp)

      if (options.injectable.beforePost.length) {
        nemoApp.use(options.injectable.beforePost)
      }

      nemoApp.use(middlewares.post)

      if (options.injectable.afterPost.length) {
        nemoApp.use(options.injectable.afterPost)
      }

      const server = nemoApp.listen(PORT, () =>
        logger.info(`Server is now running on port ${PORT}`)
      )

      process.on('SIGTERM', () => {
        server.close(() => logger.info('Shutting down server...'))
      })
    }
  }
}

expressNemo.express = express
expressNemo.Logger = Logger
expressNemo.captureException = captureException

module.exports = expressNemo
