import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { getJWTPublicKey } from './getKey';

export const AUTH_HEADER = 'authorization';

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromHeader(AUTH_HEADER),
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  secretOrKeyProvider: getJWTPublicKey,
};

const jwtStrategy = new JwtStrategy(opts, (jwt_payload, done) => {
  console.log('jwt_payload:', JSON.stringify(jwt_payload));
  done(null, jwt_payload);
});

export const Strategy = jwtStrategy;
