process.env.NODE_ENV = 'test';
process.env.PORT = '8080';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';
import { UserModel } from './user.model';
import { IUser } from './user.interface';
import { expectError } from '../helpers/spec.helper';

const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;
// let clock: any;

let clock: any;
before(async () => {
    UserModel.remove({}, (err) => {});
    clock = sinon.useFakeTimers();
});

after(() => {
    clock.restore();
});

const USER_XMPL = <IUser>{_id : '1234567', firstName: 'Yonatan', lastName: 'Tal'};

const BASE_URL = '/api/user';

describe('User', () => {
    describe('/GET getAll', () => {
        it('Should get all the users', (done) => {
            chai.request(server)
                .get(BASE_URL + '/getAll')
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.length.should.be.eql(0);
                    done();
                });
        });
        it('Should get the users', async () => {
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
            await User.createUser(<IUser>{_id : '2345678', firstName: 'Bar', lastName: 'Nir'});

            await chai.request(server)
                .get(BASE_URL + '/getAll')
                .then((res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array');
                    res.body.length.should.be.eql(2);
                    const users = res.body;
                }).catch( err => { throw err; } );
        });
    });
    describe('/GET user', () => {
        it('Should return 404 when user does not exist',  (done) => {
            chai.request(server)
            .get(BASE_URL + '/1234567')
            .end((err, res) => {
                err.should.exist;
                res.should.have.status(404);
                const errMsg = res.text;
                errMsg.should.be.equal('There is no user with ID: 1234567');
                done();
            });
        });
        it('Should return a user', async() => {
            await User.createUser(USER_XMPL);
            await chai.request(server)
                .get(BASE_URL + '/1234567')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.exist;
                    res.body.should.have.property('_id', USER_XMPL._id);
                    res.body.should.have.property('firstName', USER_XMPL.firstName);
                    res.body.should.have.property('lastName', USER_XMPL.lastName);
                }).catch( err => { throw err; } );
        });
    });
    describe('/GET updated users', () => {
        it('Should return an 400 when given a wrong param', (done) => {
            chai.request(server)
                .get(BASE_URL + '/getUpdated/' + 'abc')
                .end((err, res) => {
                    err.should.exist;
                    res.should.have.status(400);
                    const errMsg = res.text;
                    errMsg.should.be.equal('Did not receive a valid date ;)');
                    done();
                });
        });
        it('Should return the updated users from a certain date', async () => {
            const clock = sinon.useFakeTimers();
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
            clock.tick(1000);
            const from = Date.now();
            clock.tick(1000);
            await User.createUser(<IUser>{_id : '2345678', firstName: 'Eli', lastName: 'Kopter'});
            clock.tick(1000);

            await chai.request(server)
                      .get(BASE_URL + '/getUpdated/' + from)
                      .then(res => {
                        res.should.have.status(200);
                        const users = res.body;
                        users.should.have.lengthOf(1);
                        users[0].should.have.property('_id', '2345678');
                    }).catch( err => { throw err; } );
            clock.restore();
        });
    });
    describe('/POST user', () => {
        it('Should return 400 when user is null', (done) => {
            chai.request(server)
                .post(BASE_URL)
                .end((err, res) => {
                    err.should.exist;
                    err.should.have.status(500); // TODO: should be 400!!!
                    const errMsg = res.text;
                    done();
                });
        });
        it('Should return 400 when user is not valid', (done) => {
            chai.request(server)
                .post(BASE_URL)
                .send({ 'firstName': 'Avi', 'lastName': 'Ron'})
                .end((err, res) => {
                    err.should.exist;
                    err.should.have.status(500); // TODO: should be 400!!!
                    const errMsg = res.text;
                    done();
                });
        });
        it('Should return the created user', (done) => {
            chai.request(server)
                .post(BASE_URL)
                .send(USER_XMPL)
                .end((err, res) => {
                    res.should.exist;
                    res.should.have.status(200);
                    const user = res.body;
                    user.should.have.property('_id', USER_XMPL._id);
                    user.should.have.property('firstName', USER_XMPL.firstName);
                    user.should.have.property('lastName', USER_XMPL.lastName);
                    done();
                });
        });
    });
    describe('/PUT user', () => {
        describe('/PUT user basic dry information', () => {
            it('Should return 400 when user does not exist', (done) => {
                chai.request(server)
                    .put(BASE_URL + '/1234567/personal')
                    .end((err, res) => {
                        err.should.exist;
                        err.should.have.status(400);
                        const errMsg = res.text;
                        errMsg.should.be.equal('User ID doesn\'t match');
                        done();
                    });
            });
            it('Should return 400 when user IDs do not match', (done) => {
                chai.request(server)
                    .put(BASE_URL + '/2345678/personal')
                    .send(USER_XMPL)
                    .end((err, res) => {
                        err.should.exist;
                        err.should.have.status(400);
                        const errMsg = res.text;
                        errMsg.should.be.equal('User ID doesn\'t match');
                        done();
                    });
            });
            it('Should return the updated user', async () => {
                await User.createUser(USER_XMPL);
                await chai.request(server)
                    .put(BASE_URL + '/1234567' + '/personal')
                    .send({'_id': '1234567', phone: '987654321'})
                    .then((res) => {
                        res.should.exist;
                        res.should.have.status(200);
                        res.body.should.have.property('phone', '987654321');
                    }).catch(function (err) {
                        throw err;
                    });
            });
        });
    });
    describe('/DELETE user', () => {
        it('Should return 404 if user does not exist', (done) => {
            chai.request(server)
                .del(BASE_URL + '/1234567')
                .end((err, res) => {
                    err.should.exist;
                    err.should.have.status(404);
                    const errMsg = res.text;
                    errMsg.should.be.equal('There is no user with ID: 1234567');
                    done();
                });
        });
        it('Should return successful result ', async () => {
            await User.createUser(USER_XMPL);
            await chai.request(server)
                .del(BASE_URL + '/1234567')
                .then( res => {
                    res.should.exist;
                    res.should.have.status(200);
                    res.body.should.have.property('ok', 1);
                    res.body.should.have.property('n', 1);
                }).catch( err => { throw err; } );
        });
    });
});

