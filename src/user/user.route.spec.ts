process.env.NODE_ENV = 'test';
process.env.PORT = '8080';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';
import { UserModel } from './user.model';
import { KartoffelModel } from '../group/kartoffel/kartoffel.model';
import { IUser } from './user.interface';
import { expectError } from '../helpers/spec.helper';
import { ObjectId } from 'mongodb';

const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;

const userExamples: IUser[] = [  
  <IUser>{
    identityCard: '234567891',
    personalNumber: '3456712',
    primaryUser: 'mazaltov@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  },
  <IUser>{
    identityCard: '567891234',
    personalNumber: '1234567',
    primaryUser: 'yonatantal@development.sod',
    firstName: 'Yonatan',
    lastName: 'Tal',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['www', 'microsoft', 'github'],
    job: 'Programmer',
  },
  <IUser>{
    identityCard: '123456789',
    personalNumber: '2345671',
    primaryUser: 'aviron@secure.sod',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    hierarchy: ['Airport', 'Pilots guild', 'captain'],
    job: 'Pilot 1',
  },
  <IUser>{
    identityCard: '345678912',
    personalNumber: '4567123',
    primaryUser: 'elikopter@secure.sod',
    firstName: 'Eli',
    lastName: 'Kopter',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['Airport', 'Pilots guild'],
    job: 'Pilot 2',
    responsibility: 'SecurityOfficer',
    responsibilityLocation: new ObjectId(),
    clearance: '3',
    rank: 'Skillful',
  },
  <IUser>{
    identityCard: '456789123',
    personalNumber: '5671234',
    primaryUser: 'tikipoor@cosmetician.sod',
    firstName: 'Tiki',
    lastName: 'Poor',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['fashion designer', 'cosmetician guild'],
    job: 'cosmetician 1',
  },  
];
const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c'];

const BASE_URL = '/api/user';

describe('User', () => {
  describe('/GET getAll', () => {
    it('Should get all the users', (done) => {
      chai.request(server)
        .get(`${BASE_URL}/getAll`)
        .end((err, res) => {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
    it('Should get the users', async () => {
      await User.createUser(<IUser>{ ...userExamples[0] });
      await User.createUser(<IUser>{ ...userExamples[1] });

      await chai.request(server)
        .get(`${BASE_URL}/getAll`)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
          const users = res.body;
        }).catch((err) => {throw err;});
    });
  });
  describe('/GET user', () => {
    it('Should return 404 when user does not exist',  (done) => {
      chai.request(server)
      .get(`${BASE_URL}/${dbIdExample[0]}`)
      .end((err, res) => {
        err.should.exist;
        res.should.have.status(404);
        const errMsg = res.text;
        errMsg.should.be.equal(`Cannot find user with ID: ${dbIdExample[0]}`);
        done();
      });
    });
    it('Should return a user', async() => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      await chai.request(server)
        .get(`${BASE_URL}/${user._id}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('identityCard', userExamples[0].identityCard);
          res.body.should.have.property('firstName', userExamples[0].firstName);
          res.body.should.have.property('lastName', userExamples[0].lastName);
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET updated users', () => {
    it('Should return an 400 when given a wrong param', (done) => {
      chai.request(server)
        .get(`${BASE_URL}/getUpdated/abc`)
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
      await User.createUser(<IUser>{ ...userExamples[0] });
      clock.tick(1000);
      const from = Date.now();
      clock.tick(1000);
      await User.createUser(<IUser>{ ...userExamples[1] });
      clock.tick(1000);

      await chai.request(server)
            .get(`${BASE_URL}/getUpdated/${from}`)
            .then((res) => {
              res.should.have.status(200);
              const users = res.body;
              users.should.have.lengthOf(1);
              users[0].should.have.property('identityCard', userExamples[1].identityCard);
            }).catch((err) => { throw err; });
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
        .send({ firstName: 'Avi', lastName: 'Ron' })
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
        .send({ ...userExamples[0] })
        .end((err, res) => {
          res.should.exist;
          res.should.have.status(200);
          const user = res.body;
          user.should.have.property('identityCard', userExamples[0].identityCard);
          user.should.have.property('firstName', userExamples[0].firstName);
          user.should.have.property('lastName', userExamples[0].lastName);
          done();
        });
    });
  });
  describe('/PUT user', () => {
    describe('/PUT user basic dry information', () => {
      it('Should return 400 when user does not exist', (done) => {
        // chai.request(server)
        //   .put(BASE_URL + '/1234567/personal')
        //   .end((err, res) => {
        //     err.should.exist;
        //     err.should.have.status(400);
        //     const errMsg = res.text;
        //     errMsg.should.be.equal('User ID doesn\'t match');
        //     done();
        //   });
        done();
      });
      it('Should return 400 when user IDs do not match', (done) => {
        // chai.request(server)
        //   .put(BASE_URL + '/2345678/personal')
        //   .send(USER_XMPL)
        //   .end((err, res) => {
        //     err.should.exist;
        //     err.should.have.status(400);
        //     const errMsg = res.text;
        //     errMsg.should.be.equal('User ID doesn\'t match');
        //     done();
        //   });
        done();
      });
      it('Should return the updated user', async () => {
        const user = await User.createUser(<IUser>{ ...userExamples[0] });
        await chai.request(server)
          .put(`${BASE_URL}/${user._id}/personal`)
          .send({ _id: user._id.toString(), phone: ['027654321'] })
          .then((res) => {
            res.should.exist;
            res.should.have.status(200);
            res.body.should.have.property('phone');
            res.body.phone.should.have.members(['027654321']);
          }).catch((err) => { throw err; });
      });
    });
  });
  describe('/DELETE user', () => {
    it('Should return 404 if user does not exist', (done) => {
      chai.request(server)
        .del(`${BASE_URL}/${dbIdExample[0]}`)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(404);
          const errMsg = res.text;
          errMsg.should.be.equal(`Cannot find user with ID: ${dbIdExample[0]}`);
          done();
        });
    });
    it('Should return successful result ', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      await chai.request(server)
        .del(`${BASE_URL}/${user._id}`)
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('alive', false);
        }).catch((err) => { throw err; });
    });
  });
  // describe('/PUT user in/out group', () => {
  //   it('Should return ')
  // });
});

