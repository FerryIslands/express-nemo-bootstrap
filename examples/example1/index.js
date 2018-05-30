const express = require('express')
const middleware = require('../../index')({
  application: 'tm-example',
  healthchecks: [
    {
      name: 'mongo-db',
      check: async () => {
        return 'OK'
      }
    },
    {
      name: 'sqlserver-db',
      check: async () => {
        return 'Failure'
      }
    },
    {
      name: 'external-api',
      check: async () => {
        return 'OK'
      }
    }
  ]
})

const PORT = process.env.PORT || 4000

const helloRoute = (req, res, next) => {
  req.context.logger.debug('Hit the hello route')
  res.status(200).send({
    data: {
      correlationId: req.context.correlationId
    }
  })
  next()
}

const errorRoute = (req, res, next) => {
  throw new Error('Bad, bad, boys, come with me, come with me')
}

express()
  .use(middleware.pre)
  .get('/hello', helloRoute)
  .get('/error', errorRoute)
  .get('/ping', middleware.ping)
  .get('/health', middleware.health)
  .use(middleware.post)
  .listen(PORT, () => console.log(`Server is now running on port ${PORT}`))
