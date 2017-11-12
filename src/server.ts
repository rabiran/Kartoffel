import * as express from 'express';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as errorHandler from 'errorhandler';
import * as logger from 'morgan';
import * as path from 'path';
import * as mongo from 'connect-mongo'; // ToUse?
import * as mongoose from 'mongoose';
import * as _ from 'lodash';
import * as swaggerTools from 'swagger-tools';
import * as YAML from 'yamljs';

// Passport related dependencies
import * as jwt from 'jsonwebtoken';
import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';

import * as userRouter from './user/user.route';
import * as kartoffelRouter from './group/kartoffel/kartoffel.route';

const app = express();

/**
 *  JWT middleware
 *  Everything is placed in server.ts until some of the general structure can be reworked
 */


var users = [
  {
    id: 1,
    name: 'test1',
    password: 'test1p'
  },
  {
    id: 2,
    name: 'test2',
    password: 'test2p'
  }
];


let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'secret-key-for-use';

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {


  
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  var user = users[_.findIndex(users, {
    id: jwt_payload.id
  })];

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);
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
dotenv.config({
  path: '.env'
});

/**
 * Connect to MongoDB.
 */
( < any > mongoose).Promise = Promise;

if (process.env.NODE_ENV != 'test') {
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
app.set('port', process.env.PORT || 3001);

// Don't log while testing
if (process.env.NODE_ENV != 'test') {
  app.use('/api', logger('dev')); // Morgan
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



// Passport sample routes
app.use(passport.initialize());

app.post("/login", function(req, res) {
  if(req.body.name && req.body.password){
    var name = req.body.name;
    var password = req.body.password;
  }
  // usually this would be a database call:
  var user = users[_.findIndex(users, {name: name})];
  if( ! user ){
    res.status(401).json({message:"no such user found"});
  }

  if(user.password === req.body.password) {
    // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
    var payload = {id: user.id};
    var token = jwt.sign(payload, jwtOptions.secretOrKey);
    res.json({message: "ok", token: token});
  } else {
    res.status(401).json({message:"passwords did not match"});
  }
});


app.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res){
  res.json("Success! You can not see this without a token");
});

app.get("/secretDebug",
  function(req, res, next){
    console.log(req.get('Authorization'));
    next();
  }, function(req, res){
    res.json("debugging");
});


app.use('/', function(req, res) {
  res.status(200).json({
    version: 1
  })
})

app.use('/api/user', userRouter);
app.use('/api/kartoffel', kartoffelRouter);

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

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