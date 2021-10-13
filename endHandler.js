const createEndHandler = (options, middlewares) => {
  const endHandler = (req, res, next) => {
    if (options.postHandlerOptions) {
      req.context.postHandlerOptions = options.postHandlerOptions
    }

    req.on('end', () => {
      if(!middlewares) {
        console.log('Did you forget to put end handlers!')
      }

      for (let i = 0; i < middlewares.length; i++) {
        middlewares[i](req,res, () => {})
      }
    })

    next();
  }

  return endHandler;
}

module.exports = {
  createEndHandler,
}
