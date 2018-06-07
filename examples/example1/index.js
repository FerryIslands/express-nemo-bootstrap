const nemo = require('../../index')

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

nemo({
  application: 'tm-example',
  healthchecks: [
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
}).serve(router => router.get('/hello', helloRoute).get('/error', errorRoute))
