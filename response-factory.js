module.exports = options => {
  const notFoundResponseTemplate = (req, res) => {
    return {
      error: {
        type: 'http',
        message: 'Not Found',
        details: `No route matching path '${req.url}' was found`,
        http: {
          code: res.statusCode,
          status: 'Not Found'
        }
      }
    }
  }

  return {notFoundResponseTemplate: notFoundResponseTemplate}
}
