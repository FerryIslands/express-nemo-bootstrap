import * as Sentry from "@sentry/node";
import * as cors from "cors";
import * as jwksRsa from "jwks-rsa";
import { Request, Response, NextFunction } from "express";
import * as expressHttpContextAuth0JwtVerify from "express-nemo-auth0-jwt-verify";
import * as expressHttpContextCorrelationId from "express-nemo-correlation-id";
import * as expressHttpContextLogger from "express-nemo-logger";
import * as expressHttpContextRequestResponseLogger from "express-nemo-request-response-logger";
import * as expressHttpContextPerformace from "express-nemo-performance";
import * as expressHttpContextErrorResponse from "express-nemo-error-response";
import * as expressHttpContextErrorLogger from "express-nemo-error-logger";
import * as expressHttpNotFoundRoute from "express-nemo-route-not-found";
import * as expressHttpPingRoute from "express-nemo-route-ping";
import * as expressHttpHealthRoute from "express-nemo-route-health";
import { NemoOptions, NemoRequest } from "./NemoTypes";
import { createEndHandler } from "./endHandler";
import * as appInsights from "./appInsights/appInsights";
import { merge as extend } from "lodash";

import { version } from "./package.json";

import { loggerFactory } from "./logger-factory";
import * as logEventFactory from "./log-event-factory";
import * as responseFactory from "./response-factory";

const performanceMonitor = expressHttpContextPerformace();

const enhancedBy = (req: Request, res: Response, next: NextFunction) => {
  res.set("X-Ehanced-By", `express-nemo-bootstrap v.${version}`);
  next();
};

const corsExpress = cors();

const corsEnabled = () => process.env.ALLOW_CORS === "true";

const corsIf = (req: Request, res: Response, next: NextFunction) => {
  let nextError;

  const cb: NextFunction = (err) => {
    nextError = err;
  };

  if (corsEnabled()) {
    corsExpress(req, res, cb);
  }

  next(nextError);
};

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
  });
}

const configureSentry = (req: NemoRequest) => {
  if (req.user && req.user.sub) {
    // eslint-disable-next-line no-unused-vars
    const [_provider, _providerLocation, email] = req.user.sub.split("|");
    if (email) {
      Sentry.configureScope((scope) => scope.setUser({ email }));
    } else {
      Sentry.configureScope((scope) => scope.setUser({ id: req.user.sub }));
    }
  }
};

const sentryPre = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.SENTRY_DSN) {
    const requestHandler = Sentry.Handlers.requestHandler();
    return requestHandler(req, res, next);
  }
  return next();
};

const sentryError = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.SENTRY_DSN) {
    const errorHandler = Sentry.Handlers.errorHandler();
    return errorHandler(error, req, res, next);
  }
  return next(error);
};

const defaults = {
  application: "tm-express-app",
  ...appInsights.defaultConfig,
};

export const middlewareFactory = (options: NemoOptions) => {
  options = extend({}, defaults, options);

  appInsights.useDefaultApplicationNameIfNotOverridden(
    options.application,
    options.appInsightsConfig
  );

  const logger = loggerFactory(options)();

  logger.info(`Using express-nemo-bootstrap v.${version}`);

  if (process.env.AI_INSTRUMENTATION_KEY) {
    options.appInsights = appInsights.initAndStart(
      process.env.AI_INSTRUMENTATION_KEY,
      options.appInsightsConfig
    );
    logger.info("Application Insights enabled");
  }

  if (corsEnabled()) {
    logger.info(
      "CORS enabled (environment variable ALLOW_CORS is set to true)"
    );
  }

  const auth = expressHttpContextAuth0JwtVerify({
    jwt: {
      // Dynamically provide a signing key
      // based on the kid in the header and
      // the signing keys provided by the JWKS endpoint.
      secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://nem0.eu.auth0.com/.well-known/jwks.json",
      }),

      // Validate the audience and the issuer.
      audience: "https://nemo.stena.io/api",
      issuer: "https://nem0.eu.auth0.com/",
      algorithms: ["RS256"],
    },
  });

  const authThenConfigureSentry = (
    req: NemoRequest,
    res: Response,
    next: NextFunction
  ) => {
    const wrappedNext: NextFunction = (err) => {
      configureSentry(req);
      next(err);
    };

    auth(req, res, wrappedNext);
  };

  if (process.env.SENTRY_DSN) {
    logger.info("Sentry enabled");
  }

  const requestResponseLogger = expressHttpContextRequestResponseLogger({
    logEventFactory: logEventFactory.createRequestResponseLogEvent,
  });

  return {
    dependencies: {
      appInsights,
    },
    pre: [
      sentryPre,
      enhancedBy,
      performanceMonitor.start,
      corsIf,
      expressHttpContextCorrelationId(),
      appInsights.extendReqContext(options),
      expressHttpContextLogger({ loggerFactory }),
      createEndHandler(options, [performanceMonitor.end, requestResponseLogger]),
    ],

    auth: process.env.SENTRY_DSN ? authThenConfigureSentry : auth,

    ping: expressHttpPingRoute({
      responseTemplate: responseFactory.pingResponse,
    }),

    health: expressHttpHealthRoute({
      responseTemplate: responseFactory.healthResponse,
      checks: options.healthchecks,
    }),

    post: [
      performanceMonitor.error,
      expressHttpNotFoundRoute(responseFactory.notFoundResponse),
      sentryError,
      expressHttpContextErrorLogger({
        eventTemplate: logEventFactory.createErrorLogEvent,
        excludeErrors: ["UnauthorizedError"],
      }),
      expressHttpContextErrorResponse({
        errorMessageTemplate: responseFactory.errorResponseTemplate,
      }),
    ],
  };
};
