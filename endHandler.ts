import {Response, NextFunction} from "express";
import {NemoRequest, NemoOptions, Middlewares} from "./NemoTypes";

export const createEndHandler = (options: NemoOptions, middlewares: Middlewares) => {
  const endHandler = (req: NemoRequest, res: Response, next: NextFunction) => {
    if (options.postHandlerOptions) {
      req.context.postHandlerOptions = options.postHandlerOptions
    }

    req.on('end', () => {
      if (!middlewares) {
        console.log('Did you forget to put end handlers!')
      }

      for (let i = 0; i < middlewares.length; i++) {
        middlewares[i](req, res, () => {})
      }
    })

    next()
  }

  return endHandler
}
