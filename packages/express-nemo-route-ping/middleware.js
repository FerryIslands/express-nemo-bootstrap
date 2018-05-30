const moment = require('moment')

const defaults = {
  responseTemplate: `I'm alive: ${moment().format()}`,
  respondToClient: (res, response) => { res.send(response) }
}

module.exports = options => {
  options = { ...defaults, ...options }

  if (!options.responseTemplate) {
    throw new Error('[Options] Missing responseTemplate')
  }

  if (!options.respondToClient || typeof options.respondToClient !== 'function') {
    throw new Error('[Options] Missing respondToClient function')
  }

  const middleware = (req, res, next) => {
    options.respondToClient(res, options.responseTemplate)

    next()
  }

  middleware.options = options
  return middleware
}
