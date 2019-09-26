import * as os from 'os';
import * as winston from 'winston';
import * as winstonRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/config';
const ESWinston = require('winston-elasticsearch');
const indexTemplateMapping = require('winston-elasticsearch/index-template-mapping.json');

const serviceName = config.serviceName;
const indexPrefix = config.logger.elasticSearch.indexPrefix || serviceName;
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

if (config.logger.fileName) {
  logger.add(new winstonRotateFile({
    format,
    level: LOG_LEVEL.INFO,
    datePattern: 'YYYY-MM-DD',
    filename: config.logger.fileName,
    dirname: config.logger.directoryPath,
  }));
} else if (config.logger.elasticSearch.hosts) {
  const esClientOpts = {
    hosts: config.logger.elasticSearch.hosts,
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
