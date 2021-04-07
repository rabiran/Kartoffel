import { rewiremock } from '../../helpers/rewiremock';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { Express } from 'express';
import { OrganizationGroup } from './organizationGroup.controller';
import { IOrganizationGroup } from './organizationGroup.interface';
// import { IPerson } from './person.interface';
// import { Person } from './person.controller';
import { generateCertificates, generateToken } from '../../helpers/spec.helper';
// import { CURRENT_UNIT, ENTITY_TYPE, SERVICE_TYPE, SEX, RANK, DATA_SOURCE } from '../../config/db-enums';
import { ScopePolicyService } from '../../scopes/ScopePolicyService';
import { GroupExcluderQuery } from './organizationGroup.excluder.query';
import { Scope } from '../../auth/auth';
import { AUTH_HEADER } from '../../auth/jwt/jwtStrategy';

chai.use(require('chai-http'));
const expect = chai.expect;
const PERSON_BASE_URL = '/api/persons';
const BASE_URL = '/api/organizationGroups';

// server to perform request on - imported later
let app: Express = null;

const createRootGroup = {
  name: 'root',
} as IOrganizationGroup;

const createSensitiveGroup = {
  name: 'sensitive',
} as IOrganizationGroup;

const createSensitive2Group = {
  name: 'sensitive2',
} as IOrganizationGroup;

const createNonSensitiveGroup = {
  name: 'hoyyy',
} as IOrganizationGroup; 

const sensitiveHierarchy = `${createRootGroup.name}/${createSensitiveGroup.name}`;
const sensitive2Hierarchy = `${createRootGroup.name}/${createSensitive2Group.name}`;

const mockGroupScopePolicyService = new ScopePolicyService<IOrganizationGroup, GroupExcluderQuery>(
  {
    filters: [
      {
        name: 'removeSensitiveGroups',
        field: 'hierarchy',
        values: [sensitive2Hierarchy, sensitiveHierarchy],
      },
    ],
  },
  {
    externalScope: ['removeSensitiveGroups'],
  }
);

const certs = generateCertificates();
const externalScope = generateToken({ clientId: 'hh', scope: [Scope.READ, 'externalScope'] }, certs.pemPrivateKey);
const privilegedScope = generateToken({ clientId: 'hh', scope: [Scope.READ, 'privilegedScope'] }, certs.pemPrivateKey);

const mockGetKey = {
  getJWTPublicKey: async (request: any, rawJwtToken: string, done: (err: Error, pubKey: any) => void) => {
    done(null, certs.pemPublicKey); // immedietly return the public key
  },
};

let rootGroup: IOrganizationGroup, 
  sensitiveGroup: IOrganizationGroup, 
  sensitive2Group: IOrganizationGroup,
  nonSensitiveGroup: IOrganizationGroup;

describe('group routes with scope policy', () => {
  before(() => {
    // configure the mock
    rewiremock<typeof mockGetKey>(() => require('../../auth/jwt/getKey')).with(mockGetKey);
    rewiremock(() => require('./scopePolicy/groupScopePolicyService')).withDefault(mockGroupScopePolicyService);
    // enable the interceptor
    rewiremock.enable();
    // important to import after enabling the mock
    app = require('../../server').app;
  });
  after(() => {
    rewiremock.disable();
  });
  beforeEach(async () => {
    rootGroup = await OrganizationGroup.createOrganizationGroup(createRootGroup);
    sensitiveGroup = await OrganizationGroup.createOrganizationGroup(createSensitiveGroup, rootGroup.id);
    sensitive2Group = await OrganizationGroup.createOrganizationGroup(createSensitive2Group, rootGroup.id);
    nonSensitiveGroup = await OrganizationGroup.createOrganizationGroup(createNonSensitiveGroup, rootGroup.id);
  });
  describe('GET / all', () => {
    it('should get all except sensitive groups', async () => {
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result.map(g => g.id)).to.have.members([rootGroup.id, nonSensitiveGroup.id]);
    });
    it('should get all including sensitive groups (privileged scope)', async () => {
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, privilegedScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(4);
    });
  });
  describe('GET /:id', () => {
    it('should return 401 unauthorized when trying to get sensitive group', async () => {
      await chai.request(app).get(`${BASE_URL}/${sensitiveGroup.id}`).set(AUTH_HEADER, externalScope)
      .then(
        () => expect.fail(undefined, undefined, 'request should return error'),
        (err) => {
          expect(err).to.exist;
          expect(err).to.have.status(401);
        }
      );
    });
    it('should get sensitive group (privileged scope)', async () => {
      const response = await chai.request(app).get(`${BASE_URL}/${sensitiveGroup.id}`)
        .set(AUTH_HEADER, privilegedScope);
      expect(response).to.have.status(200);
      const result = response.body as IOrganizationGroup;
      expect(result).to.exist;
      expect(result).to.haveOwnProperty('id', sensitiveGroup.id);
    });
  });
  describe('GET /getUpdated/:from', () => {
    it('should get all except sensitive groups', async () => {
      const clock = sinon.useFakeTimers();
      const from = clock.Date().toISOString();
      clock.tick(1000);
      await OrganizationGroup
        .createOrganizationGroup({ name: 'fff' } as IOrganizationGroup, sensitiveGroup.id);
      await OrganizationGroup
        .createOrganizationGroup({ name: 'fff' } as IOrganizationGroup, nonSensitiveGroup.id);
      const result = (await chai.request(app).get(`${BASE_URL}/getUpdated/${from}`)
        .set(AUTH_HEADER, externalScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(2);
      clock.restore();
    });
    it('should get all including sensitive groups (privileged scope)', async () => {
      const clock = sinon.useFakeTimers();
      const from = clock.Date().toISOString();
      clock.tick(1000);
      await OrganizationGroup
        .createOrganizationGroup({ name: 'fff' } as IOrganizationGroup, sensitiveGroup.id);
      await OrganizationGroup
        .createOrganizationGroup({ name: 'h' } as IOrganizationGroup, nonSensitiveGroup.id);
      const result = (await chai.request(app).get(`${BASE_URL}/getUpdated/${from}`)
        .set(AUTH_HEADER, privilegedScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(4);
      clock.restore();
    });
  });
  describe('GET /path/:path', () => {
    it('should return 401 unauthorized when trying to get sensitive group', async () => {
      await chai.request(app).get(`${BASE_URL}/path/${encodeURIComponent(sensitiveHierarchy)}`)
        .set(AUTH_HEADER, externalScope)
      .then(
        () => expect.fail(undefined, undefined, 'request should return error'),
        (err) => {
          expect(err).to.exist;
          expect(err).to.have.status(401);
        }
      );
    });
    it('should get sensitive group (privileged scope)', async () => {
      const response = await chai.request(app).get(`${BASE_URL}/path/${encodeURIComponent(sensitiveHierarchy)}`)
        .set(AUTH_HEADER, privilegedScope);
      expect(response).to.have.status(200);
      const result = response.body as IOrganizationGroup;
      expect(result).to.exist;
      expect(result).to.haveOwnProperty('id', sensitiveGroup.id);
    });
  });
  // describe('GET /path/:path/hierarchyExistenceChecking', () => {});
  describe('GET /akaUnit/:akaUnit', () => {
    it('should return 401 unauthorized when trying to get sensitive group', async () => {
      const akaUnit = 'hth';
      await OrganizationGroup.createOrganizationGroup({ akaUnit, name: 'x' } as IOrganizationGroup, 
        sensitiveGroup.id);
      await chai.request(app).get(`${BASE_URL}/akaUnit/${akaUnit}`)
        .set(AUTH_HEADER, externalScope)
      .then(
        () => expect.fail(undefined, undefined, 'request should return error'),
        (err) => {
          expect(err).to.exist;
          expect(err).to.have.status(401);
        }
      );
    });
    it('should get sensitive group (privileged scope)', async () => {
      const akaUnit = 'hth';
      const underSensGroup = await OrganizationGroup.createOrganizationGroup(
        { akaUnit, name: 'x' } as IOrganizationGroup, 
        sensitiveGroup.id
      );
      const response = await chai.request(app).get(`${BASE_URL}/akaUnit/${akaUnit}`)
        .set(AUTH_HEADER, privilegedScope);
      expect(response).to.have.status(200);
      const result = response.body as IOrganizationGroup;
      expect(result).to.exist;
      expect(result).to.haveOwnProperty('id', underSensGroup.id);
    });
  });
  describe('GET /:id/children', () => {
    it('should get all except sensitive groups', async () => {
      const result = (await chai.request(app).get(`${BASE_URL}/${rootGroup.id}/children`)
        .set(AUTH_HEADER, externalScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('id', nonSensitiveGroup.id);
    });
    it('should not get the children of a sensitive group', async () => {
      await OrganizationGroup.createOrganizationGroup(
        { name: 'v' } as IOrganizationGroup,
        sensitiveGroup.id
      );
      const result = (await chai.request(app).get(`${BASE_URL}/${sensitiveGroup.id}/children`)
        .set(AUTH_HEADER, externalScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(0);
    });
    it('should get all including sensitive groups (privileged scope)', async () => {
      const result = (await chai.request(app).get(`${BASE_URL}/${rootGroup.id}/children`)
        .set(AUTH_HEADER, privilegedScope)).body as IOrganizationGroup[];
      expect(result).to.be.an('array').with.lengthOf(3);
    });
  });
});
