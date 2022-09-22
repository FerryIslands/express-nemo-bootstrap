import * as moment from 'moment'
import { merge as extend } from 'lodash'

type LoggingLevel =
| "debug"
| "info"
| "warn"
| "error"

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

const log = (data: any, level: LoggingLevel, context) => {
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

  if (!pathShouldBeLogged(structureMessage)) {
    return
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

export interface LoggingOptions {
  context: {
    origin: {
      name?: string;
    }
  }
}

export class Logger {
  private context: {}
  constructor (options: LoggingOptions) {
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
