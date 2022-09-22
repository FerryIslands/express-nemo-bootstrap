import * as express from "express";
import { Express } from "express";
import { Logger } from "./logger";
import * as Sentry from "@sentry/node";
import {middlewareFactory} from "./middlewares";
import {NemoOptions} from "./NemoTypes";

const defaultOptions: Partial<NemoOptions> = {
  basePath: "/",
};

export const captureException = (error: Error) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
};

export { Logger, express };

export default (options: NemoOptions) => {
  options = { ...defaultOptions, ...options };

  const middlewares = middlewareFactory(options);

  const PORT = process.env.PORT || 4000;
  const logger = new Logger({
    context: {
      origin: {
        name: options.application,
      },
    },
  });

  return {
    options: options,
    middlewares: middlewares,

    serve: async (
      bootstrap: (routedApp: Express, middleware: typeof middlewares) => void
    ) => {
      const nemoApp = express();
      nemoApp.use(middlewares.pre);

      const routedApp = express();
      routedApp
        .get("/ping", middlewares.ping)
        .get("/health", middlewares.health);

      await bootstrap(routedApp, middlewares);

      nemoApp.use(options.basePath, routedApp).use(middlewares.post);

      const server = nemoApp.listen(PORT, () =>
        logger.info(`Server is now running on port ${PORT}`)
      );

      process.on("SIGTERM", () => {
        server.close(() => logger.info("Shutting down server..."));
      });
    },
  };
};
