const Logger = require('./logger')
const extend = require('deep-extend')

module.exports = options => {
  const createLogger = (req, res) => {
    let requestData = {}
    if (req && req.context) {
      requestData = {
        context: { tracing: req.context.tracing }
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
