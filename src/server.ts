import { config } from './config/config';
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
import { ApplicationError, ResourceNotFoundError } from './types/error';
import { log, LOG_LEVEL } from './helpers/logger';
import { proxyCaseInsensitive } from './utils';
import { getDocsMiddleware } from './helpers/swaggerMiddleware';

class Server {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.configureSwagger();
    this.configureMiddlewares();
    this.configureApiRoutes();
    this.configureErrorHandlers();
  }

  public start() {
    this.app.listen(config.server.port, () => {
      console.log(('  App is running at http://localhost:%d in %s mode'), config.server.port, config.server.nodeEnv);
      console.log('  Press CTRL-C to stop\n');
    });
  }

  private configureSwagger() {
    this.app.use(getDocsMiddleware());
  }

  private configureMiddlewares() {
    if (config.server.nodeEnv !== 'test') {
      this.app.use('/api', logger('dev')); // Morgan
    }
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(auth.initialize()); // todo: maybe check env
    // make query case insensitive 
    this.app.use((req, res, next) => {
      req.query = proxyCaseInsensitive(req.query);
      next();
    });
    // 'isAlive" route
    this.app.get('/ruok', (req, res, next) => {
      res.status(204).send();
    });
    // use the auth middleware
    if (config.auth.enabled) {
      this.app.use('/api', auth.middlewares);
    } 
    if (config.server.nodeEnv === 'test') { // add auth test routes while testing
      console.log('app configured in test env - api routes do not require authentication, added auth test route at /test/auth');
      this.app.all('/test/auth/', auth.middlewares, (req: express.Request, res: express.Response, 
        next: express.NextFunction) => {
        res.sendStatus(200);
      });
    }
  }

  private configureApiRoutes() {
    this.app.use('/api/persons', personRouter);
    this.app.use('/api/organizationGroups', organizationGroupRouter);
  }

  private configureErrorHandlers() {
    /* handle all non-existing routes - without logging */
    this.app.all('*', (req, res) => {
      const err = new ResourceNotFoundError(`Route: ${req.originalUrl} not found`);
      return res.status(err.status).json({
        message: err.message,
        name: err.name,
      });
    });
    /* error logger */
    if (config.server.nodeEnv !== 'test') {
      this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        const severity = error instanceof ApplicationError ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;
        log(severity, error);
        next(error);
      });
    }
    /* error handler: if the error was not thrown intentionally - returns unknown error,
     * otherwise - returns the error name and massage */
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      // convert any other error to application error (to hide the real error from the user) 
      const err = error instanceof ApplicationError ? error : new ApplicationError('unknownError');
      // send response
      return res.status(err.status).json({
        message: err.message,
        name: err.name,
      });
    });
  }
}

const server = new Server();

export default server;
export const app = server.app;
