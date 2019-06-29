import * as express       from 'express';
import * as session       from 'express-session';
import * as bodyParser    from 'body-parser';
import * as cors          from 'cors';
import * as dotenv        from 'dotenv';
import * as errorHandler  from 'errorhandler';
import * as logger        from 'morgan';
import * as path          from 'path';
import * as mongo         from 'connect-mongo'; // ToUse?
import * as mongoose      from 'mongoose';
import * as _             from 'lodash';
import * as swaggerTools  from 'swagger-tools';
import * as YAML          from 'yamljs';
import * as auth from './auth/auth';
import * as personRouter from './person/person.route';
import * as organizationGroupRouter from './group/organizationGroup/organizationGroup.route';
import { ApplicationError } from './types/error';

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

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => console.log('successfully connected to the database'))
  .catch(err => console.error(err));
}

/**
 * Express configuration
 */
app.set('port', process.env.PORT || 3000);

// Don't log while testing
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', logger('dev')); // Morgan
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(auth.initialize());

// use the auth middleware
if (process.env.NODE_ENV !== 'test' && process.env.ENABLE_AUTH.toLowerCase() === 'true') {
  app.use('/api', auth.middlewares);
} else if (process.env.NODE_ENV === 'test') { // add auth test routes while testing
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
 * error handler: if the error was not thrown intentionally - returns unknown error,
 * otherwise - returns the error name and massage  
 */
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // convert any other error to application error (to hide the real error from the user) 
  const err = error instanceof ApplicationError ? error : new ApplicationError('unknownError');
  const status = err.status || 500;
  const message = err.message || 'oops something went wrong :|';
  const name = err.name || err.constructor.name || 'unknownError';
  // send response
  return res.status(status).json({
    message,
    name,
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
