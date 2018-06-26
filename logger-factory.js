const Logger = require('./logger')
const extend = require('deep-extend')

module.exports = options => {
  const createLogger = (req, res) => {
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
        {
          context: req.context
        }
      )
    )
  }

  return createLogger
}
