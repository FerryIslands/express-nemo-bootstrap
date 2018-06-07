const express = require('express')

module.exports = options => {
  const middlewares = require('./middlewares')(options)

  const PORT = process.env.PORT || 4000

  return {
    options: { ...options },

    serve: bootstrap => {
      const server = express()

      server
        .use(middlewares.pre)
        .get('/ping', middlewares.ping)
        .get('/health', middlewares.health)

      bootstrap(server)

      server.use(middlewares.post).listen(PORT, () =>
        // TODO: Use logger
        console.log(`Server is now running on port ${PORT}`)
      )

      process.on('SIGTERM', () => {
        server.stop(() => {
          // TODO: Use logger
          console.log(`Stopping server`)
          process.exit(1)
        })
      })
    }
  }
}
