import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { getJWTPublicKey } from './getKey';

export const AUTH_HEADER = 'authorization';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromHeader(AUTH_HEADER),
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  secretOrKeyProvider: getJWTPublicKey,
};

const jwtStrategy = new JwtStrategy(opts, (jwtPayload, done) => {
  // for now just pass the payload 
  done(null, jwtPayload);
});

export const Strategy = jwtStrategy;
