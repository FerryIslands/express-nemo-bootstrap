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
  const err = new Error('Bad, bad, boys, come with me, come with me')
  err.status = 400
  throw err
}

nemo({
  application: 'tm-example',
  healthchecks: [
    {
      name: 'sqlserver-db',
      check: async () => {
        return 'OK'
      }
    },
    {
      name: 'external-api',
      check: async () => {
        return 'OK'
      }
    }
  ],
  injectable: {
    beforePost: [(error, req, res, next) => {
      if (error && error.status) {
        console.log(error.message)
        res.status(error.status)
        res.send(error.message)
        next()
      }
    }]
  }
}).serve(server => server.get('/hello', helloRoute).get('/error', errorRoute))
