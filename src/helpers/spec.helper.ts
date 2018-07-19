import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
// import * as mocha from 'mocha';

dotenv.config({ path: '.env' });

(<any>mongoose).Promise = Promise;

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

const mochaAsync = (func: Function) => {
  return async (done: Function) => {
    try {
      await func();
      done();
    } catch (err) {
      done(err);
    }
  };
};

export const expectError = async (func: Function, params: any[]) => {
  let isError = false;
  try {
    await func(...params);
  } catch (err) {
    err.should.exist;
    isError = true;
  }
  isError.should.be.true;
};

before(async () => {
  mongoose.connect(process.env.MONGODB_TEST_URI, { useMongoClient: true });
});

beforeEach(async () => {

  const removeCollectionPromises = [];

  for (const i in mongoose.connection.collections) {
    removeCollectionPromises.push(mongoose.connection.collections[i].remove({}));
  }

  await Promise.all(removeCollectionPromises);
});

after((done) => {
  mongoose.disconnect();
  done();
});
