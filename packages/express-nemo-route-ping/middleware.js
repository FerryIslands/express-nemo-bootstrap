const moment = require('moment')

const defaults = {
  responseTemplate: (req, res) => `I'm alive: ${moment().format()}`
}

module.exports = options => {
  options = { ...defaults, ...options }

  if (!options.responseTemplate) {
    throw new Error('[Options] Missing responseTemplate')
  }

  const middleware = (req, res, next) => {
    const response = options.responseTemplate(req, res)
    res.send(response)
    next()
  }

  middleware.options = options
  return middleware
}
