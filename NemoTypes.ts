import { Request, NextFunction, RequestHandler } from "express";
import { AppInsightsConfig, AppInsights } from "./appInsights/appInsights";
import { middlewareFactory } from "./middlewares";

export type Middlewares = ReturnType<typeof middlewareFactory>;

export interface NemoOptions {
  application: string;
  basePath: string;
  healthchecks?: Array<any>;
  appInsightsConfig: AppInsightsConfig;
  appInsights: AppInsights;
  postHandlerOptions: PostHandlerOptions
}

export interface NemoRequest extends Request {
  user: {
    sub: string;
  };
  context: NemoRequestContext;
}

interface NemoRequestContext {
  appInsights: AppInsights;
  postHandlerOptions: PostHandlerOptions
}

interface PostHandlerOptions {
  [key: string]: any;
}

export type RequestHandlerFactory = (options: NemoOptions, middlewares: Middlewares) => RequestHandler