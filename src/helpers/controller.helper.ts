import { Request, Response, NextFunction, Router } from 'express';
import { wrapAsync as wa } from './wrapAsync';
import { Readable } from 'stream';

/**
 * Handles controller execution and responds to person (API Express version).
 * Web socket has a similar handler implementation.
 * @param promise Controller Promise. I.e. getPerson.
 * @param params A function (req, res, next), all of which are optional
 * that maps our desired controller parameters. I.e. (req) => [req.params.personname, ...].
 */
export const controllerHandler = (promise: Function, params: Function) => wa(async (req: Request, res: Response) => {
  const boundParams = params ? params(req, res) : [];
  const result = await promise(...boundParams);
  return res.json(result || { message: 'OK' });
});

export type StreamResponse = {
  stream: Readable;
  metaData?: {
    contentType?: string;
  }
};

export const streamHandler = (streamProvider: (...args: any[]) => Promise<StreamResponse>, paramsExtractor: Function) => 
  wa(async (req: Request, res: Response) => {
    const boundParams = paramsExtractor ? paramsExtractor(req) : [];
    const { stream, metaData } = await streamProvider(...boundParams);
    if (!!metaData && !!metaData.contentType) {
      res.contentType(metaData.contentType);
    }
    return stream.pipe(res);
  });


