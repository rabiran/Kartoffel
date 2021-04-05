import * as mockery from 'mockery';
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

const mockGetKey = {
  getJWTPublicKey: async (request: any, rawJwtToken: string, done: (err: Error, pubKey: any) => void) => {
    done(null, certs.pemPublicKey); // immedietly return the public key
  },
};



describe('Person route with scope policy', () => {
  before(() => {
    mockery.registerMock('./personScopePolicyService', mockPersonPolicyService);
    mockery.registerMock('./getKey', mockGetKey);
    // enable the mock
    mockery.enable({ useCleanCache: true, warnOnUnregistered: false });

    // important to import after enabling the mock
    app = require('../server').app;
  });
  after(() => {
    // mockery.deregisterAll();
    // mockery.disable();
    rewiremock.disable();
  });
  beforeEach(async () => {
    rootGroup = await OrganizationGroup.createOrganizationGroup(createRootGroup);
    sensitiveGroup = await OrganizationGroup.createOrganizationGroup(createSensitiveGroup, rootGroup.id);
    sensitive2Group = await OrganizationGroup.createOrganizationGroup(createSensitive2Group, rootGroup.id);
    nonSensitiveGroup = await OrganizationGroup.createOrganizationGroup(createNonSensitiveGroup, rootGroup.id);
  });
  describe('/GET all', () => {
    it.only('should get all except under sensitive hierarchy', async () => {
      const nonSenPerson = await Person.createPerson({ ...createPersonDetails[0], directGroup: nonSensitiveGroup.id });
      await Person.createPerson({ ...createPersonDetails[1], directGroup: sensitiveGroup.id });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0]).to.haveOwnProperty('id', nonSenPerson.id);
    });
    it('should get all but without sensitive domainUsers', async () => {
      await Person.createPerson({ 
        ...createPersonDetails[0], 
        directGroup: nonSensitiveGroup.id,
        domainUsers: [
          { uniqueID: `aaa${legalDomain}`, dataSource: sensitiveDataSource },
          { uniqueID: `bbb${legalDomain}`, dataSource: nonSensitiveDataSource },
        ],
      });
      const result = (await chai.request(app).get(BASE_URL).set(AUTH_HEADER, externalScope)).body as IPerson[];
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers).to.be.an('array').with.lengthOf(1);
      expect(result[0].domainUsers[0]).to.haveOwnProperty('dataSource', nonSensitiveDataSource);

    });
    it('should get all but without job');
    it('should get all but without some fields for sensitive2 persons');
    it('should get all but without hierarchy of domainUsers for sensitive2 domainUsers');
  });
  describe('/GET by id', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('/GET by identifier', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('/GET by domainUser', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
  describe('/GET updated from', () => {
    it('should get the non sensitive person');
    it('should get the sensitive2 person without some fields');
    it('should return 403 forbidden when trying to get sensitive person');
    it('should get a person without its sensitive domain users');
    it('should get person without hierarchy field for sensitive2 domain users');
  });
});

