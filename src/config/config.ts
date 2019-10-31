import * as dotenv from 'dotenv';
import * as path  from 'path';
import * as fs from 'fs';

/**
 * Returns true if the given environment variable name exists and contain 
 * the value 'true' (case-insensitive), otherwise returns false
 * @param envVariable environment variable name to check
 */
function envAsBool(envVariable: string): Boolean {
  return !!process.env[envVariable] && process.env[envVariable].toLowerCase() === 'true';
}

dotenv.config({ path: '.env' });
console.log('certs path:', path.resolve(`../certs/${process.env.ELASTICSEARCH_CA_FILE}`));
const serviceName = process.env.SERVICE_NAME || 'kartoffel';
export const config = {
  serviceName,
  elasticSearch: {
    nodes: process.env.ELASTICSEARCH_HOSTS ? process.env.ELASTICSEARCH_HOSTS.split(',') : null,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
    ssl: {
      enabled: envAsBool('ELASTICSEARCH_SSL_ENABLED'),
      ca: envAsBool('ELASTICSEARCH_SSL_ENABLED') && !envAsBool('ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED') ? 
        fs.readFileSync(path.resolve(`../certs/${process.env.ELASTICSEARCH_CA_FILE}`)) : '',
      rejectUnauthorized: envAsBool('ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED'),
    },
    defaultResultLimit: 20,
    personsIndexName: 'kartoffel.people',
  },
  logger : {
    fileName: process.env.LOG_FILE_NAME,
    directoryPath: process.env.LOG_DIRECTORY_PATH || '.',
    elasticSearch: {
      hosts: (process.env.LOGGER_ES_HOSTS || '').split(','),
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
  },
  server: {
    port: +(process.env.port || 3000),
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  },
};
