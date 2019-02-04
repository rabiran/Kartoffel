import * as passport from 'passport';
import { Router, Request, Response, NextFunction } from 'express';
import { Strategy as jwtConfiguredStrategy } from './jwt/jwtStrategy';

export function configure() {
  passport.use(jwtConfiguredStrategy as any); // because of missing decleration file
}

export const middleware = passport.authenticate('jwt', { session: false });
