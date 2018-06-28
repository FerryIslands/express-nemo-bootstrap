const { URL } = require('url')

const isSecure = req =>
  req.connection.encrypted || req.headers['x-forwarded-proto'] === 'https'

const getFullUrl = req =>
  `http${isSecure(req) ? 's' : ''}://${req.headers.host}${req.url}`

const buildLogEvent = (req, le) => {
  const correlationId = req.context.correlationId
  const logEvent = {
    context: {
      origin: {},
      tracing: {
        correlation_id: correlationId
      }
    },
    event: {},
    ...le
  }

  const performance = req.context.performance
  if (performance) {
    const timing = performance.timing
    if (
      timing &&
      logEvent.event &&
      logEvent.event.http &&
      logEvent.event.http.response
    ) {
      logEvent.message = `${logEvent.message} (${timing.time} s.ms)`
      logEvent.event.http.response.time_s_ms = timing.time
    }
  }

  const customData = req.context.logEventCustomData
  if (customData) {
    logEvent.event.custom = { ...logEvent.event.custom, ...customData }
  }

  return logEvent
}

const createRequestResponseLogEvent = (req, res) => {
  const url = new URL(getFullUrl(req))
  return buildLogEvent(req, {
    message: `${req.method} ${req.url} - HTTP ${res.statusCode}`,
    event: {
      http: {
        request: {
          direction: 'incoming',
          method: req.method,
          scheme: url.protocol.replace(':', ''),
          path: url.pathname,
          host: url.hostname,
          port: url.port,
          query_string: req.method === 'POST' ? req.body : url.search
        },
        response: {
          direction: 'outgoing',
          status: res.statusCode
        }
      }
    }
  })
}

const createErrorLogEvent = (err, req) => {
  return buildLogEvent(req, {
    message: `Unandled error: ${err.name}, ${err.message}`,
    event: {
      error: {
        type: err.name.toLowerCase(),
        details: `An error occured when executing handler for path '${
          req.url
        }'`,
        message: err.message,
        stacktrace: (err.stack || '').split('\n')
      }
    }
  })
}

module.exports = options => {
  return {
    createRequestResponseLogEvent,
    createErrorLogEvent
  }
}
