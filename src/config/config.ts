import * as dotenv from 'dotenv';
import * as path  from 'path';
import * as fs from 'fs';
import { DATA_SOURCE, STATUS } from './db-enums';
import { allStatuses } from '../utils';

/**
 * Returns true if the given environment variable name exists and contain 
 * the value 'true' (case-insensitive), otherwise returns false
 * @param envVariable environment variable name to check
 */
function envAsBool(envVariable: string): boolean {
  return !!process.env[envVariable] && process.env[envVariable].toLowerCase() === 'true';
}

dotenv.config({ path: '.env' });
const serviceName = process.env.SERVICE_NAME || 'kartoffel';
export const config = {
  serviceName,
  elasticSearch: {
    indexInitRetries: 3,
    nodes: process.env.ELASTICSEARCH_HOSTS ? process.env.ELASTICSEARCH_HOSTS.split(',') : null,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    ssl: {
      enabled: envAsBool('ELASTICSEARCH_SSL_ENABLED'),
      ca: envAsBool('ELASTICSEARCH_SSL_ENABLED') && envAsBool('ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED') 
        && process.env.ELASTICSEARCH_SSL_CA_FILE ? 
        fs.readFileSync(path.resolve(`${process.env.ELASTICSEARCH_SSL_CA_FILE}`)) : null,
      rejectUnauthorized: envAsBool('ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED'),
      cert: envAsBool('ELASTICSEARCH_SSL_ENABLED') && process.env.ELASTICSEARCH_SSL_CERT_FILE 
        && process.env.ELASTICSEARCH_SSL_KEY_FILE ? 
        fs.readFileSync(path.resolve(`${process.env.ELASTICSEARCH_SSL_CERT_FILE}`)) : null,
      key: envAsBool('ELASTICSEARCH_SSL_ENABLED') && process.env.ELASTICSEARCH_SSL_CERT_FILE 
        && process.env.ELASTICSEARCH_SSL_KEY_FILE
        ? fs.readFileSync(path.resolve(`${process.env.ELASTICSEARCH_SSL_KEY_FILE}`)) : null,
      pfx: envAsBool('ELASTICSEARCH_SSL_ENABLED') && process.env.ELASTICSEARCH_SSL_PFX_FILE ? 
        fs.readFileSync(path.resolve(`${process.env.ELASTICSEARCH_SSL_PFX_FILE}`)) : null,
      passphrase: envAsBool('ELASTICSEARCH_SSL_ENABLED') && process.env.ELASTICSEARCH_SSL_PASSPHRASE 
        ? process.env.ELASTICSEARCH_SSL_PASSPHRASE : null,
      disableServerIdenityCheck: envAsBool('ELASTICSEARCH_SSL_DISABLE_SERVER_IDENTITY_CHECK'),

    },
    indexNames: {
      persons: 'kartoffel.people',
    },
    defaultResultLimit: 20,
    fullTextFieldName: 'autocomplete',
    fullTextFieldMinLength: 2,
    defaultFuzzy: 'AUTO',
  },
  logger : {
    fileName: process.env.LOG_FILE_NAME,
    directoryPath: process.env.LOG_DIRECTORY_PATH || '.',
    elasticSearch: {
      hosts: process.env.LOGGER_ES_HOSTS ? 
        process.env.LOGGER_ES_HOSTS.split(',') : null,
      indexPrefix: process.env.LOGGER_ES_INDEX_PREFIX || serviceName,
    },
  },
  apm: {
    host: process.env.ELASTIC_APM_SERVER_URL,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN || '',
    active: process.env.NODE_ENV === 'production' || envAsBool('ELASTIC_APM_ACTIVE'),
  },
  auth: {
    enabled: envAsBool('ENABLE_AUTH'),
    jwt: {
      audience: process.env.JWT_AUDIENCE || 'testAudience',
      issuer: process.env.JWT_ISSUER || 'testIssuer',
      publicKey: {
        // host url + port
        baseUrl: `${process.env.JWT_PUBLIC_KEY_BASE_URL}:${process.env.JWT_PUBLIC_KEY_PORT}`,
        // path in the host to get the public key
        urlPath: process.env.JWT_PUBLIC_KEY_PATH,
      },
    },
  },
  db: {
    connectionString: process.env.MONGODB_URI,
    firstConnectionRetries: 3,
  },
  server: {
    port: +(process.env.PORT || 3000),
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  },
  queries: {
    aliases: {
      persons: {
        status: {
          all: allStatuses,
        },
        'domainUsers.dataSource': {
          nonExternals: DATA_SOURCE.slice(0, DATA_SOURCE.length - 1),
        },
      },
    },
    defaults: {
      persons: {
        status: STATUS.ACTIVE,
      },
    },
  },
  errors: [
    {
      name: 'UnauthorizedError', code: 401, errors: [
          { code: 0, message: 'Unauthorized' },
      ],
    },
    {
      name: 'ValidationError', code: 400, errors: [
          { code: 100, message: 'invalid id: {param}' },
          { code: 101, message: 'Cannot receive identical parameters!' },
          { code: 102, message: 'Did not receive a valid date' },
          { code: 103, message: 'unexpected fields: {param}' },
          { code: 104, message: 'missing required fields: {param}' },
          { code: 105, message: '{param}' },
          { code: 106, message: 'duplicate key error' }, // ValidationError.CustomError
          { code: 107, message: 'The parentId need to be type of string' }, // groups, ValidationError.TypeError
          { code: 108, message: 'The childrenIds need to be array' }, // ValidationError.TypeError
          { code: 109, message: 'maxDepth must be positive integer in range: 1 - {param}' }, // ValidationError.CustomError
          { code: 110, message: 'The group with name: {param} and hierarchy: {param} exist' }, // ValidationError.ResourceExists
          { code: 111, message: 'The parentId includes in childrenIDs, Cannot insert organizationGroup itself' }, // ValidationError.CustomError
          { code: 112, message: 'Can not delete a group with sub groups!' }, // ValidationError.DeleteError
          { code: 113, message: 'Can not delete a group with members!' }, // ValidationError.DeleteError
          { code: 114, message: '{param} is illegal user representation' }, // persons  , ValidationError.CustomError
          { code: 115, message: 'The system needs a personId to create a domain user {param}' }, // ValidationError.MissingFields
          { code: 116, message: 'The system needs a user name and domain to create a domain user for a personId {param}' }, // ValidationError.MissingFields
          { code: 117, message: 'uniqueID must be supplied when creating domain user' }, // ValidationError.MissingFields
          { code: 118, message: 'dataSource must be supplied when creating domain user' }, // ValidationError.MissingFields
          { code: 119, message: 'The "{param}" is not a recognized domain' },
          { code: 120, message: 'domain user: {param} already exists' }, // ValidationError.ResourceExists
          { code: 121, message: 'The domain user: {param} doesnt belong to person with id: {param}' }, // ValidationError.CustomError
          { code: 122, message: 'entityType: {param} requires at leat 1 domainuser' }, // ValidationError.CustomError
          { code: 123, message: 'Cant change domain of user' }, // ValidationError.CustomError
          { code: 124, message: 'a person must have a direct group' }, // ValidationError.MissingFields
          { code: 125, message: 'The personal number and identity card with the same value' }, // ValidationError.CustomError
          { code: 126, message: 'The personal number or identity card exists' }, // ValidationError.CustomError
          { code: 127, message: 'This person is not a member in this group, hence can not be appointed as a leaf' }, // ValidationError.CustomError
      ],
    },
    {
      name: 'ResourceNotFoundError', code: 404, errors: [
          { code: 1, message: 'Route: {param} not found' }, // ResourceNotFoundError.Route
          { code: 2, message: 'Cannot find group with name: {param} and hierarchy: {param}' }, // ResourceNotFoundError.ByFields
          { code: 3, message: 'Cannot find group with akaUnit: {param}' }, // ResourceNotFoundError.ByFields
          { code: 4, message: 'Group with id: {param} does not exist' }, // ResourceNotFoundError.ByFields
          { code: 5, message: 'An unexpected error occurred while fetching people' }, // ResourceNotFoundError.CustomError
          { code: 6, message: 'Cannot find person with ID: {param}' }, // ResourceNotFoundError.ByFields
          { code: 7, message: 'Cannot find person with {param}: \'{param}\'' }, // ResourceNotFoundError.ByFields
          { code: 8, message: 'Cannot find person with identityValue: {param}' }, // ResourceNotFoundError.ByFields
          { code: 9, message: 'person with domainUser: {param} does not exist' }, // ResourceNotFoundError.PersonByDomainUser
      ],
    },
  ],
};

export enum ERS {
  UNAUTHORIZED = 0,                       // 404 enums
  ROUTE_NOT_FOUND =  1,
  GROUP_BY_HIERARCHY_NOT_FOUND =  2,
  GROUP_BY_AKAUNIT_NOT_FOUND = 3,
  GROUP_NOT_FOUND = 4,
  ERROR_GETTING_PEOPLE = 5,
  PERSON_NOT_FOUND = 6,
  PERSON_BY_FIELD_NOT_FOUND = 7,
  PERSON_BY_MULTIFIELDS_NOT_FOUND = 8,
  PERSON_BY_DOMAINUSER_NOT_FOUND = 9, 
  INVALID_ID = 100,                        // 400 enums.
  SAME_PARAMS = 101,
  INVALID_DATE = 102,
  UNEXPECTED_FIELDS = 103,
  MISSING_FIELDS = 104,
  PARAM = 105,
  DUPLICATE_KEY = 106,
  PARENTID_NOT_STRING = 107,
  CHILDRENIDS_NOT_ARRAY = 108,
  INCORRECT_MAXDEPTH = 109,
  GROUP_EXISTS = 110,
  INSERTING_GROUP_IN_ITSELF = 111,
  DELETING_GROUP_WITH_SUB_GROUPS = 112,
  DELETING_GROUP_WITH_MEMBERS = 113,
  ILLEGAL_PERSON_ID = 114,
  MISSING_PERSONID = 115,
  MISSING_DOMAINUSER = 116,
  MISSING_UNIQUEID = 117,
  MISSING_DATASOURCE = 118,
  UNRECOGNIZED_DOMAIN = 119,
  DOMAIN_EXISTS = 120,
  DOMAINUSER_DOESNT_BELONGS_TO_PERSON = 121,
  INCORRECT_AMOUNT_OF_DOMAINUSERS = 122,
  CANT_CHANGE_DOMAINUSER = 123,
  PERSON_NEEDS_GROUP = 124,
  PERSONALNUMBER_EQUALS_IDENTITYCARD = 125,
  PERSONALNUMBER_OR_IDENTITYCARD_EXISTS = 126,
  PERSON_NOT_MEMBER_OF_THIS_GROUP = 127,
}
