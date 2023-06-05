const extendReqContext = (options) => {
  const appInsightsIf = (req, _res, next) => {
    if (options.appInsights) {
      // Expose appInsights on each request.
      req.context.appInsights = options.appInsights
    }
    next()
  }

  return appInsightsIf
}

const initAndStart = (applicationResourceKey, applicationConfig) => {
  const appInsights = require('applicationinsights')
  appInsights.setup(applicationResourceKey).setAutoCollectExceptions(false)
  appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = applicationConfig.application

  if (applicationConfig.defaultClient.commonProperties) {
    appInsights.defaultClient.commonProperties = applicationConfig.defaultClient.commonProperties
  }

  appInsights.start()
  return appInsights
}

const useDefaultApplicationNameIfNotOverridden = (appName, appInsightsConfig) => {
  if (appInsightsConfig.application === 'tm-express-app') {
    appInsightsConfig.application = appName
  }
}

module.exports = {
  initAndStart,
  extendReqContext,
  useDefaultApplicationNameIfNotOverridden,
  defaultConfig: {
    appInsightsConfig: {
      application: 'tm-express-app',
      defaultClient: {
        config: undefined,
        commonProperties: undefined,
        context: undefined
      }
    }
  }
}
