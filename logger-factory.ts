import { Logger } from "./logger";
import { merge as extend } from "lodash";

export const loggerFactory = (options) => {
  const createLogger = (req?: any) => {
    let requestData = {};
    if (req && req.context) {
      requestData = {
        context: { tracing: { correlation_id: req.context.correlationId } },
      };
    }

    return new Logger(
      extend(
        {},
        {
          context: {
            origin: {
              name: options.application,
            },
          },
        },
        requestData
      )
    );
  };

  return createLogger;
};
