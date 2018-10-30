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
const BASE_URL = '/api/organizationGroups';

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
    it('Should get all the groups without group that delete', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' });

      await OrganizationGroup.hideGroup(group.id);

      await chai.request(server)
        .get(BASE_URL)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
        }).catch((err) => { throw err; });
    });
    it('Should get all the groups with group that delete', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' });

      await OrganizationGroup.hideGroup(group.id);

      await chai.request(server)
        .get(`${BASE_URL}?alsoDead=true`)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(3);
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET group by ID', () => {
    it('Should return 404 when group does not exist', (done) => {
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
    it('Should return a group', async () => {
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
  describe('/GET group by hierarchy', () => {
    it('Should return a group', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group4' }, group3.id);
      await chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4`)
        .then((res) => {
          expect(res.body).to.have.property(`name`, 'group4');
          expect(res.body.hierarchy).to.have.lengthOf(3);
          expect(res.body.hierarchy).to.include.members(['group1', 'group2', 'group3']);
          expect(res.body.ancestors).to.have.lengthOf(3);
          expect(res.body.ancestors).to.include.members([group3.id, group2.id, group1.id]);
        }).catch((err) => { throw err; });
    });
    it('Should return an 404 when given a path that all group not exsit', (done) => {
      chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4`)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(404);
          done();
        });
    });
    it('Should return an 404 when given a path that herarchy exist but group not exsit', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      await chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4`)
        .then(
          () => [expect.fail(undefined, undefined, 'Should not succeed!')],
          err => err.should.have.status(404)
          );
    });
  });
  describe('/GET Object with ID of groups by hierarchy', () => {
    it('Should return a object with all IDs', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group4' }, group3.id);
      await chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property('group1', group1.id);
          expect(res.body).to.have.property('group2', group2.id);
          expect(res.body).to.have.property('group3', group3.id);
          expect(res.body).to.have.property('group4', group4.id);        
        }).catch((err) => { throw err; });
    });
    it('Should return object that all value null because group not exsit', async () => {     
      await chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property('group1', null);
          expect(res.body).to.have.property('group2', null);
          expect(res.body).to.have.property('group3', null);
          expect(res.body).to.have.property('group4', null);        
        }).catch((err) => { throw err; });
    });
    it('Should return object that 3 value is ids because group exsit and the last value null', async () => { 
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);    
      await chai.request(server)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property('group1', group1.id);
          expect(res.body).to.have.property('group2', group2.id);
          expect(res.body).to.have.property('group3', group3.id);
          expect(res.body).to.have.property('group4', null);        
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
    it('should return error when trying to create group with unexpected fields', (done) => {
      chai.request(server).post(BASE_URL)
        .send({ name: 'fuckoff', blarg: 'dfg' })
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
        .send({ parentId: group.id })
        .then(
        () => expect.fail(undefined, undefined, 'Should not succeed!'),
        err => err.should.have.status(400)
        );
    });
    it('Should return 400 if group is not found', (done) => {
      chai.request(server)
        .put(BASE_URL + '/adoption')
        .send({ parentId: ID_EXAMPLE, childId: ID_EXAMPLE_2 })
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
        .send({ parentId: group.id, childId: group.id })
        .then(
        () => expect.fail(undefined, undefined, 'Should not succeed!'),
        err => err.should.have.status(400)
        );
    });
    it('Should adopt (simple)', async () => {
      let parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await chai.request(server)
        .put(BASE_URL + '/adoption')
        .send({ parentId: parent.id, childId: child.id })
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
          res.body.should.have.property('isAlive', false);
        }).catch((err) => { throw err; });
    });
  });
});

