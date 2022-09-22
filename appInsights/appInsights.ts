import * as appInsights from "applicationinsights";
import { Request, Response, NextFunction } from "express";
import {NemoOptions, NemoRequest} from "../NemoTypes";
export type AppInsights = typeof appInsights;

export const extendReqContext = (options: NemoOptions) => {
  const appInsightsIf = (req: NemoRequest, res: Response, next: NextFunction) => {
    if (options.appInsights) {
      // Expose appInsights on each request.
      req.context.appInsights = options.appInsights;
    }
    next();
  };

  return appInsightsIf;
};

export interface AppInsightsConfig {
  application: string;
  defaultClient: {
    config: undefined;
    commonProperties:
      | {
          [key: string]: string;
        }
      | undefined;
    context: undefined;
  };
}

export const initAndStart = (
  applicationResourceKey: string,
  applicationConfig: AppInsightsConfig
) => {
  appInsights.setup(applicationResourceKey).setAutoCollectExceptions(false);
  appInsights.defaultClient.context.tags[
    appInsights.defaultClient.context.keys.cloudRole
  ] = applicationConfig.application;

  if (applicationConfig.defaultClient.commonProperties) {
    appInsights.defaultClient.commonProperties =
      applicationConfig.defaultClient.commonProperties;
  }

  appInsights.start();
  return appInsights;
};

export const useDefaultApplicationNameIfNotOverridden = (
  appName: string,
  appInsightsConfig: AppInsightsConfig
) => {
  if (appInsightsConfig.application === "tm-express-app") {
    appInsightsConfig.application = appName;
  }
};

export const defaultConfig = {
  appInsightsConfig: {
    application: "tm-express-app",
    defaultClient: {
      config: undefined,
      commonProperties: undefined,
      context: undefined,
    },
  } as AppInsightsConfig,
};
