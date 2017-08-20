import * as express       from 'express';
import * as session       from 'express-session';
import * as bodyParser    from 'body-parser';
import * as dotenv        from 'dotenv';
import * as errorHandler  from 'errorhandler';
import * as logger        from 'morgan';
import * as path          from 'path';
import * as mongo         from 'connect-mongo';
import * as mongoose      from 'mongoose';
import * as passport      from 'passport';
import * as _             from 'lodash';

import * as swaggerTools  from 'swagger-tools';
import * as YAML          from 'yamljs';

const swaggerDoc = YAML.load('openapi.yaml');

swaggerTools.initializeMiddleware(swaggerDoc, (middleware: any) => {
    //  Serve the Swagger document and Swagger UI
    app.use(middleware.swaggerUi());
});

const MongoStore = mongo(session);

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env' });

const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);

mongoose.connection.on('error', () => {
  console.log('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

/**
 * Express configuration
 */
app.set('port', process.env.PORT || 3000);
app.use('/api', logger('dev')); // Morgan
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log(('  App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;