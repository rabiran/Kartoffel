import * as passport from 'passport';
import { Router, Request, Response, NextFunction } from 'express';
import { Strategy as jwtConfiguredStrategy } from './jwt/jwtStrategy';

export function configure() {
  passport.use(jwtConfiguredStrategy as any); // because of missing decleration file
}

const _router = Router();
_router.get('/getAuthUser', passport.authenticate('jwt', { session: false }), 
  async (req: Request, res: Response, next: NextFunction) => {
    res.send(req.user);
  });

export const router = _router;


