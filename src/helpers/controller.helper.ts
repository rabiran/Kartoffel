import { Request, Response, NextFunction, Router } from 'express';
import { wrapAsync as wa } from './wrapAsync';
import { Readable } from 'stream';

/**
 * Handles controller execution and responds to person (API Express version).
 * Web socket has a similar handler implementation.
 * @param promise Controller Promise. I.e. getPerson.
 * @param params A function (req, res, next), all of which are optional
 * @param scopePolicyExtractor
 * @param postTransformer
 * that maps our desired controller parameters. I.e. (req) => [req.params.personname, ...].
 */
export const controllerHandler = (
  promise: Function, 
  params: Function,
  scopePolicyExtractor?: (scopes: string[]) => any,
  scopePolicyResultTransformer?: (scopes: string[], result: any) => any
) => wa(async (req: Request, res: Response) => {
  const boundParams = params ? params(req, res) : [];
  const requestScopes = req.user ? req.user.scope : undefined;
  const policyParams = scopePolicyExtractor && requestScopes ? 
    scopePolicyExtractor(requestScopes) : undefined;
  const result = await promise(...boundParams, policyParams);
  const transformedResult = scopePolicyResultTransformer && requestScopes ? 
    scopePolicyResultTransformer(requestScopes, result) : result;
  return res.json(transformedResult || { message: 'OK' });
});

export type StreamResponse = {
  stream: Readable;
  metaData?: {
    contentType?: string;
  }
};

export const streamHandler = (
  streamProvider: (...args: any[]) => Promise<StreamResponse>, 
  paramsExtractor: Function,
  scopePolicyExtractor?: (scopes: string[]) => any
) => 
  wa(async (req: Request, res: Response) => {
    const boundParams = paramsExtractor ? paramsExtractor(req) : [];
    const policyParams = scopePolicyExtractor && req.user && req.user.scopes ? 
    scopePolicyExtractor(req.user.scopes) : undefined;
    const { stream, metaData } = await streamProvider(...boundParams, policyParams);
    if (!!metaData && !!metaData.contentType) {
      res.contentType(metaData.contentType);
    }
    return stream.pipe(res);
  });
