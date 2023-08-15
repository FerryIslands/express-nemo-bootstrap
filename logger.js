const { merge: extend } = require('lodash')
const pino = require('pino')

const loggingDisabled = () => {
  return '' + process.env.LOGGING_DISABLED === 'true'
}

const pingLoggingEnabled = () => {
  return '' + process.env.LOGGING_PING_ENABLED === 'true'
}

const filteredPaths = {
  '/ping': {}
}

const pathShouldBeLogged = (structureMessage) => {
  const path = structureMessage?.event?.http?.request?.path

  if (pingLoggingEnabled()) return true

  if (path && filteredPaths[path]) {
    return false
  }

  return true
}

const defaultStructure = {
  context: {
    origin: {
      name: 'express-nemo-bootstrap',
      logger: 'logger.js'
    }
  }
}

const pinoLogger = pino({
  level: process.env.PINO_LOG_LEVEL || 'debug',
  formatters: {
    bindings (_) {
      return {}
    },
    level (label) {
      return { level: label }
    }
  },
  messageKey: 'message',
  timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`
})

const log = (data, level, context) => {
  let logContext = {
    context: extend({}, defaultStructure.context, context)
  }
  let logMessage

  if (!pathShouldBeLogged(data)) {
    return
  }

  if (typeof data !== 'object') {
    logMessage = data ?? ''
  } else {
    logMessage = data.message ?? ''
    // eslint-disable-next-line no-unused-vars
    const { message, level, timestamp, ...dataProps } = data
    logContext = extend({}, dataProps, logContext)
  }

  if (!loggingDisabled()) {
    switch (level) {
      case 'debug':
        pinoLogger.debug(logContext, logMessage)
        break
      case 'info':
        pinoLogger.info(logContext, logMessage)
        break
      case 'warn':
        pinoLogger.warn(logContext, logMessage)
        break
      case 'error':
        pinoLogger.error(logContext, logMessage)
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
