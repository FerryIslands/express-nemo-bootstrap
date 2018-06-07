const Logger = require('./logger')

module.exports = options => {
  const createLogger = (req, res) => {
    return new Logger({
      context: {
        origin: {
          name: options.application
        }
      }
    })
  }

  return createLogger
}
