const defaults = {
  responseTemplate: (results, req, res) => {
    return `Status: ${
      results.every(result => result.status === 'OK') ? 'OK' : 'Failure'
    }`
  }
}

module.exports = options => {
  options = { ...defaults, ...options }

  if (!options.checks || !Array.isArray(options.checks)) {
    throw new Error('[Options] Missing checks array')
  }

  if (
    !options.responseTemplate ||
    typeof options.responseTemplate !== 'function'
  ) {
    throw new Error('[Options] Missing responseTemplate')
  }

  const middleware = async (req, res, next) => {
    let results = []

    for (let healtCheck of options.checks) {
      results.push({
        name: healtCheck.name,
        status: await healtCheck.check()
      })
    }

    const response = options.responseTemplate(results, req, res)
    const statusCode = results.every(result => result.status === 'OK')
      ? 200
      : 424

    res.status(statusCode).send(response)
    next()
  }

  middleware.options = options
  return middleware
}
