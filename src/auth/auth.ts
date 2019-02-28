import * as passport from 'passport';
import * as _ from 'lodash';
import { Router, Request, Response, NextFunction } from 'express';
import { Strategy as jwtConfiguredStrategy } from './jwt/jwtStrategy';

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
  [Scope.WRITE] : ['POST', 'PUT'],
};

const authenticate = passport.authenticate('jwt', { session: false });

/**
 * express middlware that authorize the request according to the user's scope
 */
const authorize = function (req: Request, res: Response, next: NextFunction) {
  if (
    !req.user || !req.user.scope || !Array.isArray(req.user.scope) || 
    req.user.scope.length === 0 ||
    // the scope contains only allowed values 
    _.without(req.user.scope, Scope.READ, Scope.WRITE).length !== 0) {
    return res.sendStatus(401); // 401 unauthorized
  }
  // get all the allowed methods for this user's request
  const allowedMethods = (<[string]>req.user.scope.map((s: string) => scopeToMethodMap[s]))
    .reduce((accumulator, curr) => accumulator.concat(curr), []);
  // check that this request's method is included in the allowed methods
  if (!allowedMethods.includes(req.method)) {
    return res.sendStatus(401); // 401 unauthorized
  }
  return next();
};

export const middlewares = [authenticate, authorize];
