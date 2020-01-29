import * as passport from 'passport';
import * as _ from 'lodash';
import { Router, Request, Response, NextFunction } from 'express';
import { Strategy as jwtConfiguredStrategy } from './jwt/jwtStrategy';
import { UnauthorizedError } from '../types/error';
import { wrapAsync as wa } from '../helpers/wrapAsync';

export function initialize() {
  passport.use(jwtConfiguredStrategy as any); // because of missing decleration file
  return passport.initialize();
}

export enum Scope {
  READ = 'read',
  WRITE = 'write',
}

// the allowed http methods for each scope
const scopeToMethodMap = {
  [Scope.READ] : ['GET'],
  [Scope.WRITE] : ['POST', 'PUT', 'DELETE'],
};

const authenticate = function (req: Request, res: Response, next: NextFunction) {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new UnauthorizedError());
    }
    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * express middlware that authorize the request according to the user's scope
 */
const authorize = wa(async (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.user || !req.user.scope || !Array.isArray(req.user.scope) || 
    req.user.scope.length === 0 ||
    // the scope contains only allowed values 
    _.without(req.user.scope, Scope.READ, Scope.WRITE).length !== 0) {
    throw new UnauthorizedError();
  }
  // get all the allowed methods for this user's request
  const allowedMethods = (<[string]>req.user.scope.map((s: string) => scopeToMethodMap[s]))
    .reduce((accumulator, curr) => accumulator.concat(curr), []);
  // check that this request's method is included in the allowed methods
  if (!allowedMethods.includes(req.method)) {
    throw new UnauthorizedError();
  }
  return next();
});

export const middlewares = [authenticate, authorize];
