import * as os from 'os';
import * as winston from 'winston';
const ESWinston = require('winston-elasticsearch');
const indexTemplateMapping = require('winston-elasticsearch/index-template-mapping.json');

const serviceName = process.env.SERVICE_NAME || 'kartoffel';
const indexPrefix = process.env.ES_INDEX_PREFIX || serviceName;
indexTemplateMapping.index_patterns = `${indexPrefix}-*`; 

const logger = winston.createLogger({
  defaultMeta: { service: serviceName, hostname: os.hostname() },
});

if (process.env.ES_HOSTS) {
  const esClientOpts = {
    hosts: process.env.ES_HOSTS.split(','),
  };
  const esTransport = new ESWinston({
    indexPrefix,
    level: 'info',
    clientOpts: esClientOpts,
    bufferLimit: 100,
    ensureMappingTemplate: true,
    mappingTemplate: indexTemplateMapping,
  });
  logger.add(esTransport);
} else {
  const winstonConsole = new winston.transports.Console({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.json()
    ),
  });
  logger.add(winstonConsole);
}

export const log = (severity: string, meta: any) => {
  const { message, ...other } = meta;
  logger.log(severity, message, other);
};

export enum LOG_LEVEL {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

