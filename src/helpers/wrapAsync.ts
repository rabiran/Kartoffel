import { Request, Response, NextFunction } from 'express';

export function wrapAsync(fn: Function) {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}
