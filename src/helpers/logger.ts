import * as os from 'os';
import * as winston from 'winston';
import * as winstonRotateFile from 'winston-daily-rotate-file';
const ESWinston = require('winston-elasticsearch');
const indexTemplateMapping = require('winston-elasticsearch/index-template-mapping.json');

const serviceName = process.env.SERVICE_NAME || 'kartoffel';
const indexPrefix = process.env.ES_INDEX_PREFIX || serviceName;
indexTemplateMapping.index_patterns = `${indexPrefix}-*`; 

// log levels
export enum LOG_LEVEL {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

const logger = winston.createLogger({
  defaultMeta: { service: serviceName, hostname: os.hostname() },
});

const format = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.json());

if (process.env.LOG_FILE_NAME) {
  logger.add(new winstonRotateFile({
    format,
    level: LOG_LEVEL.INFO,
    datePattern: 'YYYY-MM-DD',
    filename: process.env.LOG_FILE_NAME,
    dirname: process.env.LOG_FILE_DIR || '.',
  }));
} else if (process.env.ES_HOSTS) {
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
    format,
    level: 'silly',
  });
  logger.add(winstonConsole);
}


export const log = (severity: string, meta: any) => {
  const { message, ...other } = meta;
  logger.log(severity, message, other);
};
