const express = require('express')
const Logger = require('./logger')
const Sentry = require('@sentry/node')

const defaultOptions = {
  basePath: '/'
}

const captureException = error => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error)
  }
}

let connections = []

const expressNemo = options => {
  options = { ...defaultOptions, ...options }

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
      nemoApp.use(middlewares.pre)

      const routedApp = express()
      routedApp
        .get('/ping', middlewares.ping)
        .get('/health', middlewares.health)

      await bootstrap(routedApp, middlewares)

      nemoApp.use(options.basePath, routedApp).use(middlewares.post)

      const server = nemoApp.listen(PORT, () =>
        logger.info(`Server is now running on port ${PORT}`)
      )

      server.on('connection', connection => {
        connections.push(connection)
        connection.on('close', () => {
          connections = connections.filter(curr => curr !== connection)
        })
      })

      function shutDown () {
        console.log('Received kill signal, shutting down gracefully')
        server.close(() => {
          console.log('Closed out remaining connections')
          process.exit(0)
        })

        setTimeout(() => {
          console.error(
            'Could not close connections in time, forcefully shutting down'
          )
          process.exit(1)
        }, 9900)

        connections.forEach(curr => curr.end())
        setTimeout(() => connections.forEach(curr => curr.destroy()), 5000)
      }

      process.on('SIGTERM', shutDown)
      process.on('SIGINT', shutDown)
    }
  }
}

expressNemo.express = express
expressNemo.Logger = Logger
expressNemo.captureException = captureException

module.exports = expressNemo
