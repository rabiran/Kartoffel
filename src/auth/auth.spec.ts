import { generateCertificates } from '../helpers/spec.helper';
// import * as getPublicKey from './jwt/getKey';
import * as sinon from 'sinon';
import * as jwt from 'jsonwebtoken';
import * as httpMocks from 'node-mocks-http';
import * as mockery from 'mockery';
import * as dotenv from 'dotenv';

// generate private and public keys for the token
const certs = generateCertificates();
// the JWT payload
const payload = { clientId: 'fuckfuck' };
// sign the token using the private key
const token = jwt.sign(payload, certs.pemPrivateKey, {
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  expiresIn: '600000000', // take your time...
  algorithm: 'RS256',
});

// use this mock to get the public key instead of calling the auth server
const mockGetKey = {
  getJWTPublicKey: async (request: any, rawJwtToken: string, done: (err: Error, pubKey: any) => void) => {
    done(null, certs.pemPublicKey); // immedietly return the public key
  },
};

// imported later
let authMiddleware: Function = null;

describe('Auth middleware', () => {
  before(() => {
    // enable the mock
    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
    mockery.registerMock('./getKey', mockGetKey);

    // important to import after enabling the mock
    const auth = require('./auth');
    authMiddleware = auth.middleware;
    // configure the JWT strategy
    auth.configure(); 
  });

  after(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('should call next function when sending appropriate token', () => {
    const nextFunction = sinon.spy();
    // mock request & response objects
    const req = httpMocks.createRequest({ headers: { authorization: token } });
    const res = httpMocks.createResponse();
    authMiddleware(req, res, nextFunction);
    // the next function should be called
    nextFunction.calledOnce.should.be.true;
  });
  it('should not call the next handler when the token is invalid', () => {
    const nextFunction = sinon.spy();
    // request object with invalid token in the header
    const req = httpMocks.createRequest({ headers: { authorization: 'shitty_token' } });
    const res = httpMocks.createResponse();
    authMiddleware(req, res, nextFunction);
    // middleware response should be 401 - unauthorized
    res.statusCode.should.be.equal(401);
    res._isEndCalled().should.be.true;
    nextFunction.called.should.be.false;
  });
});
