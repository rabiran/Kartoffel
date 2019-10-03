import { config } from '../../config/config';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { getJWTPublicKey } from './getKey';

export const AUTH_HEADER = 'authorization';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromHeader(AUTH_HEADER),
  issuer: config.auth.jwt.issuer,
  audience: config.auth.jwt.audience,
  secretOrKeyProvider: getJWTPublicKey,
};

const jwtStrategy = new JwtStrategy(opts, (jwtPayload, done) => {
  // for now just pass the payload 
  done(null, jwtPayload);
});

export const Strategy = jwtStrategy;
