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

async function cleanDatabase(modelNames: string[]) {
  await mongoose.connection.dropDatabase();
  await Promise.all(modelNames.map(modelName =>
    mongoose.model(modelName).ensureIndexes()));
}

async function removeAllDocuments(modelNames: string[]) {
  await Promise.all(modelNames.map(modelName =>
    mongoose.model(modelName).remove({}).exec()));
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI, { useMongoClient: true });
  const modelNames: string[] = mongoose.modelNames();
  await cleanDatabase(modelNames);
});

beforeEach(async () => {
  const modelNames: string[] = mongoose.modelNames();
  // await cleanDatabase(modelNames);
  await removeAllDocuments(modelNames);
});

after((done) => {
  mongoose.disconnect();
  done();
});
