import * as dotenv from 'dotenv';
import * as path  from 'path';
import * as fs from 'fs';

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
    defaultResultLimit: 20,
    personsIndexName: 'kartoffel.people',
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
  },
  server: {
    port: +(process.env.PORT || 3000),
    sessionSecret: process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  },
};
