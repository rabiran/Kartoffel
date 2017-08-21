import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
// import * as mocha from 'mocha';

dotenv.config({ path: '.env' });

(<any>mongoose).Promise = Promise;

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

before(async () => {
    mongoose.connect(process.env.MONGODB_TEST_URI);
});

after(done => {
    mongoose.disconnect();
    done();
});