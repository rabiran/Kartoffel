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
import * as passport      from 'passport';
import * as _             from 'lodash';
import * as swaggerTools  from 'swagger-tools';
import * as YAML          from 'yamljs';

import * as userRouter from './user/user.route';
import * as kartoffelRouter from './group/kartoffel/kartoffel.route';

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
  mongoose.connect(process.env.MONGODB_URI, (err: any) => {
    if (err) {
      console.log(err);
      throw err;
    } else {
      console.log('successfully connected to the database');
    }
  });
}
mongoose.connection.on('error', () => {
  console.log('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

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

app.use('/api/user', userRouter);
app.use('/api/kartoffel', kartoffelRouter);

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

app.get('/status', (req, res, next) => {
  res.json({ name: 'App Name' });
});

app.get('/ruok', (req, res, next) => {
  res.status(204).send();
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
