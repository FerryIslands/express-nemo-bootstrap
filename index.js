const expressHttpContextCorrelationId = require('../express-nemo/packages/express-nemo-correlation-id')
const expressHttpContextLogger = require('../express-nemo/packages/express-nemo-logger')
const expressHttpContextRequestResponseLogger = require('../express-nemo/packages/express-nemo-request-response-logger')
const expressHttpContextPerformace = require('../express-nemo/packages/express-nemo-performance')
const expressHttpContextErrorResponse = require('../express-nemo/packages/express-nemo-error-response')
const expressHttpContextErrorLogger = require('../express-nemo/packages/express-nemo-error-logger')
const performaceMonitor = expressHttpContextPerformace()

const enhancedBy = (req, res, next) => {
  res.set('X-Ehanced-By', 'TM-Express')
  next()
}

const notFound = (req, res, next) => {
  if (!req.route) {
    res.status(404).send({})
  }
  next()
}

const defaults = {
  application: 'TM-Express-App'
}

module.exports = options => {
  options = { ...defaults, ...options }

  const loggerFactory = require('./logger-factory')(options)
  const logEventFactory = require('./log-event-factory')(options)

  return {
    pre: [
      enhancedBy,
      performaceMonitor.start,
      expressHttpContextCorrelationId(),
      expressHttpContextLogger({ loggerFactory })
    ],

    post: [
      notFound,
      performaceMonitor.end,
      expressHttpContextErrorLogger({
        eventTemplate: logEventFactory.createErrorLogEvent
      }),
      expressHttpContextErrorResponse(),
      expressHttpContextRequestResponseLogger({
        logEventFactory: logEventFactory.createRequestResponseLogEvent
      })
    ]
  }
}
