const serviceName = process.env.SERVICE_NAME || 'kartoffel';
export const config = {
  serviceName,
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
    active: process.env.NODE_ENV === 'production' || 
      (!!process.env.ELASTIC_APM_ACTIVE && process.env.ELASTIC_APM_ACTIVE.toLocaleLowerCase() === 'true'),
  },
  auth: {
    enabled: process.env.ENABLE_AUTH.toLocaleLowerCase() === 'true',
    jwt: {
      audience: process.env.JWT_AUDIENCE || '',
      issuer: process.env.JWT_ISSUER || '',
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
