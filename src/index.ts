import { config } from './config/config';
// need to be the first import and that the env variables are already loaded
import * as apm from 'elastic-apm-node';
apm.start({
  serviceName: config.serviceName,
  serverUrl: config.apm.host,
  secretToken: config.apm.secretToken,
  active: config.apm.active,
});
import promiseRetry = require('promise-retry');
import server from './server';
import * as mongoose from 'mongoose';
import { log, LOG_LEVEL } from './helpers/logger';
import { initIndex, initEsClient } from './search/elasticsearch';

(async () => {
  (<any>mongoose).Promise = Promise;
  mongoose.set('useUnifiedTopology', true);
  /* setup event listeners on mongo connection */
  mongoose.connection.on('connecting', () => {
    console.log('[MongoDB] connecting...');
  });
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] connected');
  });
  mongoose.connection.on('error', (error) => {
    log(LOG_LEVEL.ERROR, error);
  });
  mongoose.connection.on('disconnected', () => {
    console.log('[MongoDB] disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] reconnected');
  });
  /* Connect to MongoDB - with retries */
  try {
    await promiseRetry((retry, num) => {
      console.log('[MongoDB] connection attempt number', num);
      return mongoose.connect(config.db.connectionString,  
        { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true })
        .catch(retry);
    }, { retries: config.db.firstConnectionRetries });
    console.log('successfully connected to the database');
  } catch (err) {
    log(LOG_LEVEL.ERROR, err);
  }
  /* Initiallize the ES client */
  initEsClient();
  /* Initiallize the ES index */
  try {
    await promiseRetry((retry, num) => {
      return initIndex().catch(retry);
    }, { retries: config.elasticSearch.indexInitRetries });
    console.log('[ES] initiallized index successfully');
  } catch (err) {
    log(LOG_LEVEL.ERROR, err);
  }
  // disconnect from DB when closing
  server.app.on('close', () => {
    mongoose.disconnect();
  });
  // start the http server
  server.start();

})();
