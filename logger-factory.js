module.exports = options => {
  const log = (level, args) => {
    const loggerArgs = []
    args.forEach(arg => loggerArgs.push(JSON.stringify(arg, null, 0)))
    console[level].apply(console, loggerArgs)
  }

  const createLogger = (req, res) => {
    return {
      debug: (...args) => log('debug', args),
      error: (...args) => log('error', args)
    }
  }

  return createLogger
}
