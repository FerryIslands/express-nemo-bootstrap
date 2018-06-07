const express = require('express')
const Logger = require('./logger')

module.exports = options => {
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
    options: { ...options },

    serve: bootstrap => {
      const app = express()

      app
        .use(middlewares.pre)
        .get('/ping', middlewares.ping)
        .get('/health', middlewares.health)

      bootstrap(app)

      app.use(middlewares.post)

      const server = app.listen(PORT, () =>
        logger.info(`Server is now running on port ${PORT}`)
      )

      process.on('SIGTERM', () => {
        server.close(() => logger.info(`Shutting down server...`))
      })
    }
  }
}
