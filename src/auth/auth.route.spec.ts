import { generateCertificates, generateToken } from '../helpers/spec.helper';
import * as sinon from 'sinon';
import * as chai from 'chai';
import * as httpMocks from 'node-mocks-http';
import * as mockery from 'mockery';
import * as dotenv from 'dotenv';
import { Request, Response, NextFunction, Express } from 'express';
import { Scope } from './auth';
import { AUTH_HEADER } from './jwt/jwtStrategy';
import { UnauthorizedError } from '../types/error';
const expect = chai.expect;


// generate private and public keys for the token
const certs = generateCertificates();
// generate different tokens for tests
const readScopeToken = generateToken({ clientId: 'fuckfuck', scope: [Scope.READ] }, certs.pemPrivateKey);
const readAndWriteScopeToken = generateToken({ clientId: 'fuckfuck', scope: [Scope.READ, Scope.WRITE] }, certs.pemPrivateKey);
const invalidScopeToken = generateToken({ clientId: 'fuckfuck', scope: [Scope.READ, 'admin'] }, certs.pemPrivateKey);

// use this mock to get the public key instead of calling the auth server
const mockGetKey = {
  getJWTPublicKey: async (request: any, rawJwtToken: string, done: (err: Error, pubKey: any) => void) => {
    done(null, certs.pemPublicKey); // immedietly return the public key
  },
};

// server to perform request on - imported later
let app: Express = null;

describe('Auth routes', () => {
  before(() => {
    // enable the mock
    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });
    mockery.registerMock('./getKey', mockGetKey);

    // important to import after enabling the mock
    app = require('../server').app;
  });

  after(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('should return status 200 when requesting GET with read scope', (done) => {
    chai.request(app)
    .get('/test/auth')
    .set(AUTH_HEADER, readScopeToken)
    .end((err, res) => {
      expect(err).to.be.null;
      res.should.have.status(200);
      done();
    });
  });
  it('should return status 200 when requesting POST with write scope', (done) => {
    chai.request(app)
    .post('/test/auth')
    .set(AUTH_HEADER, readAndWriteScopeToken)
    .send({ example: 'whatever' })
    .end((err, res) => {
      expect(err).to.be.null;
      res.should.have.status(200);
      done();
    });
  });
  it('should return status 200 when requesting PUT with write scope', (done) => {
    chai.request(app)
    .put('/test/auth')
    .set(AUTH_HEADER, readAndWriteScopeToken)
    .send({ example: 'whatever' })
    .end((err, res) => {
      expect(err).to.be.null;
      res.should.have.status(200);
      done();
    });
  });
  it('should return status 200 when requesting DELETE with write scope', (done) => {
    chai.request(app)
    .del('/test/auth')
    .set(AUTH_HEADER, readAndWriteScopeToken)
    .end((err, res) => {
      expect(err).to.be.null;
      res.should.have.status(200);
      done();
    });
  });
  it('should return status 401 when requesting with invalid token', (done) => {
    chai.request(app)
    .get('/test/auth')
    .set(AUTH_HEADER, 'shitty_token')
    .end((err, res) => {
      expect(err).to.exist;
      res.should.have.status(401);
      const errMsg = res.body.message;
      expect(errMsg).to.equal(UnauthorizedError.ERROR_MESSAGE);
      done();
    });
  });
  // it('should return status 401 when requesting with invalid scope', (done) => {
  //   chai.request(app)
  //   .get('/test/auth')
  //   .set(AUTH_HEADER, invalidScopeToken)
  //   .end((err, res) => {
  //     expect(err).to.exist;
  //     res.should.have.status(401);
  //     const errMsg = res.body.message;
  //     expect(errMsg).to.equal(UnauthorizedError.ERROR_MESSAGE);
  //     done();
  //   });
  // });
  it('should return status 401 when requesting POST with read scope', (done) => {
    chai.request(app)
    .post('/test/auth')
    .set(AUTH_HEADER, readScopeToken)
    .send({ example: 'whatever' })    
    .end((err, res) => {
      expect(err).to.exist;
      res.should.have.status(401);
      const errMsg = res.body.message;
      expect(errMsg).to.equal(UnauthorizedError.ERROR_MESSAGE);
      done();
    });
  });
  it('should return status 401 when requesting PUT with read scope', (done) => {
    chai.request(app)
    .put('/test/auth')
    .set(AUTH_HEADER, readScopeToken)
    .send({ example: 'whatever' })    
    .end((err, res) => {
      expect(err).to.exist;
      res.should.have.status(401);
      const errMsg = res.body.message;
      expect(errMsg).to.equal(UnauthorizedError.ERROR_MESSAGE);
      done();
    });
  });
  it('should return status 401 when requesting DELETE with read scope', (done) => {
    chai.request(app)
    .del('/test/auth')
    .set(AUTH_HEADER, readScopeToken)
    .end((err, res) => {
      expect(err).to.exist;
      res.should.have.status(401);
      const errMsg = res.body.message;
      expect(errMsg).to.equal(UnauthorizedError.ERROR_MESSAGE);
      done();
    });
  });
});
