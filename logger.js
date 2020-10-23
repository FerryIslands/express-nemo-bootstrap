const moment = require('moment')
const extend = require('deep-extend')

const loggingDisabled = () => {
  return '' + process.env.LOGGING_DISABLED === 'true'
}

const getDefaultStructure = () => {
  return {
    timestamp: moment().format(),
    level: 'debug',
    message: 'Missing message!',
    context: {
      origin: {
        name: 'express-nemo-bootstrap',
        logger: 'logger.js'
      }
    }
  }
}

const log = (data, level, context) => {
  let structureMessage
  const defaultStructure = getDefaultStructure()

  if (typeof data !== 'object') {
    structureMessage = extend({}, defaultStructure, {
      message: data,
      level: level,
      context: context
    })
  } else {
    const extendedData = extend({}, data, {
      timestamp: defaultStructure.timestamp,
      level: level,
      context: context
    })
    structureMessage = extend({}, defaultStructure, extendedData)
  }

  if (!loggingDisabled()) {
    const msg = JSON.stringify(structureMessage)
    switch (level) {
      case 'debug':
      case 'info':
      case 'warn':
        console.log(msg)
        break
      case 'error':
        console.error(msg)
        break
    }
  }
}

class Logger {
  constructor (options) {
    options = options || {}
    this.context = {
      ...options.context
    }
  }

  debug (data) {
    log(data, 'debug', this.context)
  }

  info (data) {
    log(data, 'info', this.context)
  }

  warn (data) {
    log(data, 'warn', this.context)
  }

  error (data) {
    log(data, 'error', this.context)
  }
}

module.exports = Logger
