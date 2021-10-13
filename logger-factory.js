const Logger = require('./logger')
const {merge: extend} = require('lodash')


module.exports = options => {
  const createLogger = (req, res) => {
    let requestData = {}
    if (req && req.context) {
      requestData = {
        context: { tracing: { correlation_id: req.context.correlationId } }
      }
    }

    return new Logger(
      extend(
        {},
        {
          context: {
            origin: {
              name: options.application
            }
          }
        },
        requestData
      )
    )
  }

  return createLogger
}
