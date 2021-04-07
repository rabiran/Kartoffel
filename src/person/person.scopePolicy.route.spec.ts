import { rewiremock } from '../helpers/rewiremock';
import * as chai from 'chai';
import { Express } from 'express';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { IPerson } from './person.interface';
import { Person } from './person.controller';
import { generateCertificates, generateToken } from '../helpers/spec.helper';
import { CURRENT_UNIT, ENTITY_TYPE, SERVICE_TYPE, SEX, RANK, DATA_SOURCE } from '../config/db-enums';
import { ScopePolicyService } from '../scopes/ScopePolicyService';
import { PersonExcluderQuery } from './person.excluder.query';
import { Scope } from '../auth/auth';
import { AUTH_HEADER } from '../auth/jwt/jwtStrategy';


chai.use(require('chai-http'));
const expect = chai.expect;

const BASE_URL = '/api/persons';
const GROUP_BASE_URL = '/api/organizationGroups';

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

const sensitiveDataSource = DATA_SOURCE[0];
const sensitive2DataSource = DATA_SOURCE[1];
const nonSensitiveDataSource = DATA_SOURCE[3];

const legalDomain = 'rabiran.com';
const createPersonDetails = [
  <IPerson>{
    identityCard: '234567899',
    personalNumber: '3456712',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    job: 'parent',
    entityType: ENTITY_TYPE[1],
    currentUnit: CURRENT_UNIT[0],
    serviceType: SERVICE_TYPE[0],
    sex: SEX.Female,
    rank: RANK[2],
    birthDate: new Date(1994, 4),
  },
  <IPerson>{ // person that requires rank
    identityCard: '123456782',
    personalNumber: '2345671',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    job: 'Pilot 1',
    entityType: ENTITY_TYPE[1],
    currentUnit: CURRENT_UNIT[0],
    rank: RANK[1],
    serviceType: SERVICE_TYPE[0],
  },
  <IPerson>{
    identityCard: '123456782',
    personalNumber: '2345671',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    job: 'Pilot 1',
    entityType: ENTITY_TYPE[1],
    rank: RANK[2],
  },
];

let rootGroup: IOrganizationGroup, 
  sensitiveGroup: IOrganizationGroup, 
  sensitive2Group: IOrganizationGroup,
  nonSensitiveGroup: IOrganizationGroup;

const sensitive2HierarchyCondition = {
  className: 'HierarchyCondition',
  field: 'hierarchy',
  value: `${createRootGroup.name}/${createSensitive2Group.name}`,
};

const mockPersonPolicyService = new ScopePolicyService<IPerson, PersonExcluderQuery>(
  { 
    filters: [
      {
        name: 'hideSensitivePersons',
        field: 'hierarchy',
        values: `${createRootGroup.name}/${createSensitiveGroup.name}`,
      },
    ],
    transformers: [
      {
        name: 'removeSensitiveDomainUsers',
        className: 'ArrayFilter',
        targetField: 'domainUsers',
        conditions: [{
          className: 'SimpleValueCondition',
          field: 'dataSource',
          value: `${sensitiveDataSource}`,
        }],
      },
      {
        name: 'removeJob',
        className: 'FieldExclude',
        targetField: 'job',
      },
      {
        name: 'removeSensitive2DomainUsersHierarchy',
        className: 'ArrayMapper',
        targetField: 'domainUsers',
        transformer: {
          className: 'FieldExclude',
          targetField: 'hierarchy',
          conditions: [{
            className: 'SimpleValueCondition',
            field: 'dataSource',
            value: `${sensitive2DataSource}`,
          }],
        },
      },
      {
        name: 'removeSensitive2Hierarchy',
        className: 'FieldExclude',
        targetField: 'hierarchy',
        conditions: [sensitive2HierarchyCondition],
      },
      {
        name: 'removeSensitive2DirectGroup',
        className: 'FieldExclude',
        targetField: 'directGroup',
        conditions: [sensitive2HierarchyCondition],
      },
    ],
  },
  {
    externalScope: [
      'hideSensitivePersons', 'removeSensitiveDomainUsers', 'removeJob', 'removeSensitive2DomainUsersHierarchy',
      'removeSensitive2Hierarchy', 'removeSensitive2DirectGroup',
    ],
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

describe('Person route with scope policy', () => {
  before(() => {
    // configure the mock
    rewiremock<typeof mockGetKey>(() => require('../auth/jwt/getKey')).with(mockGetKey);
    rewiremock(() => require('./scopePolicy/personScopePolicyService')).withDefault(mockPersonPolicyService);
    // enable the interceptor
    rewiremock.enable();
    // important to import after enabling the mock
    app = require('../server').app;
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
  describe('GET all', () => {
    it('should get all except under sensitive hierarchy', async () => {
      const nonSenPerson = await Person.createPerson({ ...createPersonDetails[0], directGroup: nonSensitiveGroup.id });
      await Person.createPerson({ ...createPersonDetails[1], directGroup: sensitiveGroup.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('id', nonSenPerson.id);
    });
    it('should get all except under sensitive hierarchy (nested sensitive hierarchy)', async () => {
      const nonSenPerson = await Person.createPerson({ ...createPersonDetails[0], directGroup: nonSensitiveGroup.id });
      const nestedSensitiveGroup = await OrganizationGroup
        .createOrganizationGroup({ name: 'tttt' } as IOrganizationGroup, sensitiveGroup.id);
      await Person.createPerson({ ...createPersonDetails[1], directGroup: nestedSensitiveGroup.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('id', nonSenPerson.id);
    });
    it('should get all but without sensitive domainUsers', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: nonSensitiveGroup.id,
        domainUsers: [
          { uniqueID: `aaa@${legalDomain}`, dataSource: sensitiveDataSource },
          { uniqueID: `bbb@${legalDomain}`, dataSource: nonSensitiveDataSource },
        ],
      });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers[0]).to.haveOwnProperty('dataSource', nonSensitiveDataSource);

    });
    it('should get all but without job', async () => {
      const person = await Person.createPerson({ ...createPersonDetails[0], directGroup: nonSensitiveGroup.id });
      expect(person).to.haveOwnProperty('job');
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.not.haveOwnProperty('job');
    });
    it('should get all but without some fields for sensitive2 persons', async () => {
      await Person.createPerson({ ...createPersonDetails[0], directGroup: sensitive2Group.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.not.haveOwnProperty('hierarchy');
      expect(result[0]).to.not.haveOwnProperty('directGroup');
    });
    it('should get all but without hierarchy of domainUsers for sensitive2 domainUsers', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: sensitive2Group.id,
        domainUsers: [
          { uniqueID: `aa@${legalDomain}`, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `bb@${legalDomain}`, dataSource: sensitive2DataSource, hierarchy: ['a','c'] },
        ],
      });
      await Person.createPerson({ 
        ...createPersonDetails[1], 
        directGroup: nonSensitiveGroup.id,
        domainUsers: [
          { uniqueID: `cc@${legalDomain}`, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `dd@${legalDomain}`, dataSource: sensitive2DataSource, hierarchy: ['a','y'] },
        ],
      });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(2);
      for (const person of result) {
        expect(person).to.haveOwnProperty('domainUsers');
        expect(person.domainUsers).to.be.an('array').with.lengthOf(2);
        let sensitive2DSCount = 0, nonSensitiveDSCount = 0;
        for (const du of person.domainUsers) {
          if (du.dataSource !== sensitive2DataSource) {
            expect(du).to.have.ownProperty('hierarchy');
            nonSensitiveDSCount++;
          } else {
            expect(du).to.not.have.ownProperty('hierarchy');
            sensitive2DSCount++;
          }
        }
        expect(nonSensitiveDSCount).to.equal(1);
        expect(sensitive2DSCount).to.equal(1);
      }
    });
    it('should get also under sensitive hierarchy (privileged scope)', async () => {
      await Person.createPerson({ ...createPersonDetails[1], directGroup: sensitiveGroup.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, privilegedScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
    });
    it('should get all with sensitive domainUsers (privileged scope)', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: nonSensitiveGroup.id,
        domainUsers: [
          { uniqueID: `aaa@${legalDomain}`, dataSource: sensitiveDataSource },
          { uniqueID: `bbb@${legalDomain}`, dataSource: nonSensitiveDataSource },
        ],
      });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, privilegedScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers).to.be.an('array').with.lengthOf(2);
    });
    it('should get all with sesnsitive fields of sensitive2 persons (privileged scope)', async () => {
      await Person.createPerson({ ...createPersonDetails[0], directGroup: sensitive2Group.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, privilegedScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('hierarchy');
      expect(result[0]).to.haveOwnProperty('directGroup');
      expect(result[0]).to.haveOwnProperty('job');
    });
    it('should get all with hierarchy of domainUsers for sensitive2 domainUsers (privileged scope)', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: sensitive2Group.id,
        domainUsers: [
          { uniqueID: `aa@${legalDomain}`, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `bb@${legalDomain}`, dataSource: sensitive2DataSource, hierarchy: ['a','c'] },
        ],
      });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, privilegedScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers).to.be.an('array').with.lengthOf(2);
      let sensitive2DSCount = 0;
      for (const du of result[0].domainUsers) {
        expect(du).to.have.ownProperty('hierarchy');
        if (du.dataSource === sensitive2DataSource) {
          sensitive2DSCount++;
        }
      }
      expect(sensitive2DSCount).to.equal(1);
    });
  });
  describe('GET /:id', () => {
    it('should get the non sensitive person', async () => {
      const nonSenPerson = await Person.createPerson({ ...createPersonDetails[0], directGroup: nonSensitiveGroup.id });
      const response = await chai.request(app).get(`${BASE_URL}/${nonSenPerson.id}`).set(AUTH_HEADER, externalScope);
      expect(response).to.have.status(200);
      const result = response.body as IPerson;
      expect(result).to.haveOwnProperty('id', nonSenPerson.id);
    });
    it('should get the sensitive2 person without some fields', async () => {
      const person = await Person.createPerson({ ...createPersonDetails[0], directGroup: sensitive2Group.id });
      const response = await chai.request(app).get(`${BASE_URL}/${person.id}`).set(AUTH_HEADER, externalScope);
      expect(response).to.have.status(200);
      const result = response.body as IPerson;
      expect(result).to.not.haveOwnProperty('hierarchy');
      expect(result).to.not.haveOwnProperty('directGroup');
    });
    it('should return 401 unauthorized when trying to get sensitive person', async () => {
      const person = await Person.createPerson({ ...createPersonDetails[0], directGroup: sensitiveGroup.id });
      await chai.request(app).get(`${BASE_URL}/${person.id}`).set(AUTH_HEADER, externalScope)
      .then(
        () => expect.fail(undefined, undefined, 'request should return error'),
        (err) => {
          expect(err).to.exist;
          expect(err).to.have.status(401);
        }
      );
    });
    it('should get the sensitive person (privileged scope)', async () => {
      const person = await Person.createPerson({ ...createPersonDetails[0], directGroup: sensitiveGroup.id });
      const response = await chai.request(app).get(`${BASE_URL}/${person.id}`).set(AUTH_HEADER, privilegedScope);
      expect(response).to.have.status(200);
      const result = response.body as IPerson;
      expect(result).to.exist;
      expect(result).to.haveOwnProperty('id', person.id);
    });
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('GET /:identifier', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('GET /:domainUser', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 401 unauthorized when trying to get sensitive person', async () => {
      const userUniqueId = `aa@${legalDomain}`;
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: sensitiveGroup.id,
        domainUsers: [
          { uniqueID: userUniqueId, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `bb@${legalDomain}`, dataSource: sensitive2DataSource, hierarchy: ['a','c'] },
        ],
      });
      await chai.request(app).get(`${BASE_URL}/domainUser/${userUniqueId}`).set(AUTH_HEADER, externalScope)
      .then(
        () => expect.fail(undefined, undefined, 'request should return error'),
        (err) => {
          expect(err).to.exist;
          expect(err).to.have.status(401);
        }
      );
    });
    it('should get a person without its sensitive domain users', async () => {
      const useruniqueId = `aa@${legalDomain}`;
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: sensitive2Group.id,
        domainUsers: [
          { uniqueID: useruniqueId, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `bb@${legalDomain}`, dataSource: sensitiveDataSource, hierarchy: ['a','c'] },
        ],
      });
      const response = await chai.request(app).get(`${BASE_URL}/domainUser/${useruniqueId}`).set(AUTH_HEADER, externalScope);
      expect(response).to.have.status(200);
      const result = response.body as IPerson;
      expect(result).to.exist;
      expect(result.domainUsers).to.be.an('array').with.lengthOf(1);
      expect(result.domainUsers[0]).to.haveOwnProperty('dataSource', nonSensitiveDataSource);
    });
    it('should get a sensitive person (privileged scope)', async () => {
      const useruniqueId = `aa@${legalDomain}`;
      const person = await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: sensitiveGroup.id,
        domainUsers: [
          { uniqueID: useruniqueId, dataSource: nonSensitiveDataSource, hierarchy: ['a','b'] },
          { uniqueID: `bb@${legalDomain}`, dataSource: sensitive2DataSource, hierarchy: ['a','c'] },
        ],
      });
      const response = await chai.request(app).get(`${BASE_URL}/domainUser/${useruniqueId}`).set(AUTH_HEADER, privilegedScope);
      expect(response).to.have.status(200);
      const result = response.body as IPerson;
      expect(result).to.exist;
      expect(result).to.haveOwnProperty('id', person.id);
    });
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('GET updated from', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('GET /organizationGroups/:id/members', () => {
    it('should return all members except of sensitive group', async () => {
      const nonSensitivePerson = await Person.createPerson({ ...createPersonDetails[0], directGroup: rootGroup.id });
      await Person.createPerson({ ...createPersonDetails[1], directGroup: sensitiveGroup.id });
      const result = (await chai.request(app).get(`${GROUP_BASE_URL}/${rootGroup.id}/members`)
        .set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('id', nonSensitivePerson.id);
    });
    it('should get all but without sensitive domainUsers', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: nonSensitiveGroup.id,
        domainUsers: [
          { uniqueID: `aaa@${legalDomain}`, dataSource: sensitiveDataSource },
          { uniqueID: `bbb@${legalDomain}`, dataSource: nonSensitiveDataSource },
        ],
      });
      const result = (await chai.request(app).get(`${GROUP_BASE_URL}/${nonSensitiveGroup.id}/members`)
        .set(AUTH_HEADER, externalScope)).body as IPerson[];        
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers[0]).to.haveOwnProperty('dataSource', nonSensitiveDataSource);
    });
  });
  describe('GET /:identifier/pictures/profile', () => {

  });
});

