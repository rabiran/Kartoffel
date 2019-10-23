import { config } from './config/config';
// need to be the first import and that the env variables are already loaded
import * as apm from 'elastic-apm-node';
apm.start({
  serviceName: config.serviceName,
  serverUrl: config.apm.host,
  secretToken: config.apm.secretToken,
  active: config.apm.active,
});
import * as express       from 'express';
import * as session       from 'express-session';
import * as bodyParser    from 'body-parser';
import * as cors          from 'cors';
import * as dotenv        from 'dotenv';
import * as errorHandler  from 'errorhandler';
import * as logger        from 'morgan';
import * as mongoose      from 'mongoose';
import * as _             from 'lodash';
import * as swaggerTools  from 'swagger-tools';
import * as YAML          from 'yamljs';
import * as auth from './auth/auth';
import * as personRouter from './person/person.route';
import * as organizationGroupRouter from './group/organizationGroup/organizationGroup.route';
import { ApplicationError } from './types/error';
import { log, LOG_LEVEL } from './helpers/logger';

const app = express();

/**
 *  Swagger configuration
 */

const swaggerDoc = YAML.load('openapi.yaml');

swaggerTools.initializeMiddleware(swaggerDoc, (middleware: any) => {
    //  Serve the Swagger document and Swagger UI
  app.use(middleware.swaggerUi());
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env' });

/**
 * Connect to MongoDB.
 */
(<any>mongoose).Promise = Promise;

if (config.server.nodeEnv !== 'test') {
  mongoose.connect(config.db.connectionString, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => console.log('successfully connected to the database'))
  .catch(err => log(LOG_LEVEL.ERROR, err));
}


/**
 * Express configuration
 */
app.set('port', config.server.port);

// Don't log while testing
if (config.server.nodeEnv !== 'test') {
  app.use('/api', logger('dev')); // Morgan
}
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(auth.initialize());

// use the auth middleware
if (config.server.nodeEnv !== 'test' && config.auth.enabled) {
  app.use('/api', auth.middlewares);
} else if (config.server.nodeEnv === 'test') { // add auth test routes while testing
  console.log('app configured in test env - api routes do not require authentication, added auth test route at /test/auth');
  app.all('/test/auth/', auth.middlewares, (req: express.Request, res: express.Response, 
    next: express.NextFunction) => {
    res.sendStatus(200);
  });
}

app.use('/api/persons', personRouter);
app.use('/api/organizationGroups', organizationGroupRouter);

app.get('/status', (req, res, next) => {
  res.json({ name: 'App Name' });
});

app.get('/ruok', (req, res, next) => {
  res.status(204).send();
});

/**
 * error logger
 */
if (config.server.nodeEnv !== 'test') {
  app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const severity = error instanceof ApplicationError ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;
    log(severity, error);
    next(error);
  });
}

/**
 * error handler: if the error was not thrown intentionally - returns unknown error,
 * otherwise - returns the error name and massage  
 */
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // convert any other error to application error (to hide the real error from the user) 
  const err = error instanceof ApplicationError ? error : new ApplicationError('unknownError');
  // send response
  return res.status(err.status).json({
    message: err.message,
    name: err.name,
  });
});

/**
 * Start Express server.
 */
if (!module.parent) {
  app.listen(app.get('port'), () => {
    console.log(('  App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
  });
}

module.exports = app;
