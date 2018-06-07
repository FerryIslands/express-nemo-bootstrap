const express = require('express')
const Logger = require('./logger')

const defaultOptions = {
  basePath: '/'
}

module.exports = options => {
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

    serve: bootstrap => {
      const nemoApp = express()
      nemoApp.use(middlewares.pre)

      const routedApp = express()
      routedApp
        .get('/ping', middlewares.ping)
        .get('/health', middlewares.health)

      bootstrap(routedApp)

      nemoApp.use(options.basePath, routedApp).use(middlewares.post)

      const server = nemoApp.listen(PORT, () =>
        logger.info(`Server is now running on port ${PORT}`)
      )

      process.on('SIGTERM', () => {
        server.close(() => logger.info(`Shutting down server...`))
      })
    }
  }
}
