process.env.NODE_ENV = 'test';
process.env.PORT = '8080';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../../server';
import * as organizationGroupRouter from './organizationGroup.route';
import { OrganizationGroup } from './organizationGroup.controller';
import { OrganizationGroupModel } from './organizationGroup.model';
import { IOrganizationGroup } from './organizationGroup.interface';
import { expectError } from '../../helpers/spec.helper';

const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;

const ID_EXAMPLE = '59a56d577bedba18504298df';
const ID_EXAMPLE_2 = '59a56d577bedba18504298de';
const BASE_URL = '/api/organizationGroup';

describe('OrganizationGroup API', () => {
  describe('/GET all groups', () => {
    it('Should get all the groups', (done) => {
      chai.request(server)
        .get(BASE_URL)
        .end((err, res) => {
          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
    it('Should get the groups', async () => {
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'yourGroup' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'hisGroup' });

      await chai.request(server)
        .get(BASE_URL)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
          const persons = res.body;
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET group by ID', () => {
    it('Should return 404 when group does not exist',  (done) => {
      chai.request(server)
        .get(BASE_URL + '/' + ID_EXAMPLE)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(404);
          const errMsg = res.text;
          errMsg.should.be.equal('Cannot find group with ID: ' + ID_EXAMPLE);
          done();
        });
    });
    it('Should return a group', async() => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      await chai.request(server)
        .get(BASE_URL + '/' + organizationGroup.id)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('name', organizationGroup.name);
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET updated groups', () => {
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
    it('Should return the updated groups from a certain date', async () => {
      const clock = sinon.useFakeTimers();
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_1' });
      clock.tick(1000);
      const from = Date.now();
      clock.tick(1000);
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2' });

      await chai.request(server)
            .get(BASE_URL + '/getUpdated/' + from)
            .then((res) => {
              res.should.have.status(200);
              const groups = res.body;
              groups.should.have.lengthOf(1);
              groups[0].should.have.property('name', 'group_2');
            }).catch((err) => { throw err; });
      clock.restore();
    });
  });
  describe('/POST group', () => {
    it('Should return 400 when group is null', (done) => {
      chai.request(server)
        .post(BASE_URL)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return 400 when group is not valid', (done) => {
      chai.request(server)
        .post(BASE_URL)
        .send({ type: 'Group' })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return the created group', (done) => {
      chai.request(server)
        .post(BASE_URL)
        .send({ name: 'Biran' })
        .end((err, res) => {
          res.should.exist;
          res.should.have.status(200);
          const person = res.body;
          person.should.have.property('name', 'Biran');
          done();
        });
    });
  });
  describe('Update group', () => {
  });
  describe('/PUT adoption', () => {
    it('Should return 400 if null is sent', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'MyGroup' });
      await chai.request(server)
        .put(BASE_URL + '/adoption')
        .send({ parentID: group.id })
        .then(
          () => expect.fail(undefined, undefined, 'Should not succeed!'),
          err => err.should.have.status(400)
        );
    });
    it('Should return 400 if group is not found', (done) => {
      chai.request(server)
        .put(BASE_URL + '/adoption')
        .send({ parentID: ID_EXAMPLE, childID: ID_EXAMPLE_2 })
        .then(
          () => expect.fail(undefined, undefined, 'Should not succeed!'),
          (err) => {
            err.should.have.status(400);
            done();
          }
        );
    });
    it('Should fail if parent and child are the same', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'MyGroup' });
      await chai.request(server)
        .put(BASE_URL + '/adoption')
        .send({ parentID: group.id, childID: group.id })
        .then(
          () => expect.fail(undefined, undefined, 'Should not succeed!'),
          err => err.should.have.status(400)
        );
    });
    it('Should adopt (simple)', async() => {
      let parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await chai.request(server)
            .put(BASE_URL + '/adoption')
            .send({ parentID: parent.id, childID: child.id })
            .then((res) => {
              res.should.have.status(200);
            }).catch((err) => {
              expect.fail(undefined, undefined, err.message);
            });
      parent = await OrganizationGroup.getOrganizationGroupOld(parent.id);
      child = await OrganizationGroup.getOrganizationGroupOld(child.id);

      parent.should.exist;
      parent.children.should.exist;
      expect(parent.children[0].toString() === child.id.toString()).to.be.ok;
      child.should.exist;
      child.ancestors.should.exist;
      expect(child.ancestors[0].toString() === parent.id.toString()).to.be.ok;
    });
  });
  describe('/DELETE group', () => {
    it('Should return 400 if group does not exist', (done) => {
      chai.request(server)
        .del(BASE_URL + '/' + ID_EXAMPLE)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          errMsg.should.be.equal('Cannot find group with ID: ' + ID_EXAMPLE);
          done();
        });
    });
    it('Should return 400 if group cannot be removed', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await OrganizationGroup.childrenAdoption(group.id, [child.id]);
      await chai.request(server)
        .del(BASE_URL + '/' + group.id)
        .then(() => expect.fail(undefined, undefined, 'Should not succeed!'))
        .catch((err) => {
          err.status.should.be.equal(400);
          err.response.text.should.be.equal('Can not delete a group with sub groups!');
        });
    });
    it('Should return successful result ', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ id: ID_EXAMPLE, name: 'group' });
      await chai.request(server)
        .del(BASE_URL + '/' + group.id)
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('ok', 1);
          res.body.should.have.property('n', 1);
        }).catch((err) => { throw err; });
    });
  });
});

