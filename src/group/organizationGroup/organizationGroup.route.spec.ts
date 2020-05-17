import * as chai from 'chai';
import * as sinon from 'sinon';
import { app } from '../../server';
import * as organizationGroupRouter from './organizationGroup.route';
import { OrganizationGroup } from './organizationGroup.controller';
import { OrganizationGroupModel } from './organizationGroup.model';
import { IOrganizationGroup } from './organizationGroup.interface';
import { expectError } from '../../helpers/spec.helper';
import { Person } from '../../person/person.controller';
import { IPerson } from '../../person/person.interface';
import { ENTITY_TYPE } from '../../config/db-enums';

const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;

const ID_EXAMPLE = '59a56d577bedba18504298df';
const ID_EXAMPLE_2 = '59a56d577bedba18504298de';
const BASE_URL = '/api/organizationGroups';
const CHILDREN_ROUTE = 'children';

describe('OrganizationGroup API', () => {
  describe('/GET all groups', () => {
    it('Should get all the groups', (done) => {
      chai.request(app)
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

      await chai.request(app)
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

      await chai.request(app)
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

      await chai.request(app)
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
      chai.request(app)
        .get(BASE_URL + '/' + ID_EXAMPLE)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(404);
          const errCode = res.body.code;
          errCode.should.be.equal(11); // cant find group
          done();
        });
    });
    it('Should return a group', async () => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      await chai.request(app)
        .get(BASE_URL + '/' + organizationGroup.id)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('name', organizationGroup.name);
        }).catch((err) => { throw err; });
    });
    it('Should return a group populated', async () => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      await Person.createPerson({
        identityCard: '000000315',
        personalNumber: '1000003',
        firstName: 'tipesh',
        lastName: 'meod',
        entityType: ENTITY_TYPE[0],
        dischargeDay: new Date(2022, 11),
        directGroup: organizationGroup.id,
        job: 'horse',
      });

      await chai.request(app)
        .get(BASE_URL + '/' + organizationGroup.id + '/?populate=directMembers')
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('name', organizationGroup.name);
          res.body.should.have.property('directMembers');
          res.body.directMembers.should.have.lengthOf(1);
          const member = res.body.directMembers[0];
          member.should.have.property('firstName', 'tipesh');
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET group by hierarchy', () => {
    it('Should return a group', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group4' }, group3.id);
      await chai.request(app)
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
      chai.request(app)
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
      await chai.request(app)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4`)
        .then(
          () => [expect.fail(undefined, undefined, 'Should not succeed!')],
          err => err.should.have.status(404)
          );
    });
  });
  describe('/GET Object with ID of groups by hierarchy', () => {
    it('Should return a object with all IDs and that duplicate names of the group', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Abraham' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Itzhak' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Jacob' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Abraham' }, group3.id);
      await chai.request(app)
        .get(`${BASE_URL}/path/Abraham%2fItzhak%2fJacob%2fAbraham/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property(group1.name, group1.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}`, group2.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}/${group3.name}`, group3.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}/${group3.name}/${group4.name}`, group4.id);        
        }).catch((err) => { throw err; });
    });
    it('Should return object that all value null because group not exsit', async () => {     
      await chai.request(app)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property('group1', null);
          expect(res.body).to.have.property('group1/group2', null);
          expect(res.body).to.have.property('group1/group2/group3', null);
          expect(res.body).to.have.property('group1/group2/group3/group4', null);        
        }).catch((err) => { throw err; });
    });
    it('Should return object that 3 value is ids because group exsit and the last value null', async () => { 
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);    
      await chai.request(app)
        .get(`${BASE_URL}/path/group1%2fgroup2%2fgroup3%2fgroup4/hierarchyExistenceChecking`)
        .then((res) => {
          expect(res.body).to.have.property(group1.name, group1.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}`, group2.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}/${group3.name}`, group3.id);
          expect(res.body).to.have.property(`${group1.name}/${group2.name}/${group3.name}/group4`, null);        
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET updated groups', () => {
    it('Should return an 400 when given a wrong param', (done) => {
      chai.request(app)
        .get(BASE_URL + '/getUpdated/' + 'abc')
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(400);
          const errCode = res.body.code;
          expect(errCode).to.equal(103); // invalid date
          done();
        });
    });
    it('Should return the updated groups from a certain date', async () => {
      const clock = sinon.useFakeTimers();     
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_1' });
      clock.tick(1000);
      const from = clock.Date().toISOString();      
      clock.tick(1000);
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2' });

      await chai.request(app)
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

  describe('/GET group offsprings', () => {
    it('should return all group offsprings', async () => {
      const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' }, parent.id);
      const offspring = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'offspring' }, child.id);

      const res = (await chai.request(app).get(`${BASE_URL}/${parent.id}/${CHILDREN_ROUTE}`));
      expect(res).to.have.status(200);
      const allOffsprings = res.body as IOrganizationGroup[];
      expect(allOffsprings).to.have.lengthOf(2);
      const ids = allOffsprings.map(group => group.id);
      expect(ids).to.have.members([child.id, offspring.id]);
    });

    it('should return all group offsprings with maximum depth of 2', async () => {
      const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' }, parent.id);
      const offspring = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'offspring' }, child.id);
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'tooDeep' }, offspring.id);

      const res = (await chai.request(app).get(`${BASE_URL}/${parent.id}/${CHILDREN_ROUTE}?maxDepth=2`));
      expect(res).to.have.status(200);
      const depthOffsprings = res.body as IOrganizationGroup[];
      expect(depthOffsprings).to.have.lengthOf(2);
      const ids = depthOffsprings.map(group => group.id);
      expect(ids).to.have.members([child.id, offspring.id]);
    });

    it('should throw an error if the maxDepth parameter is too big', async() => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      chai.request(app).get(`${BASE_URL}/${group.id}/${CHILDREN_ROUTE}?maxDepth=11`).then(
        () => expect.fail(null, null, 'request should fail'),
        (err) => {
          expect(err).to.have.status(400);
        });
    });

  });

  describe('/GET group with akaUnit as given by param', () => {
    it('Should return 200 when finding by akaUnit', async () => {
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_3', akaUnit: 'coolunit2' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2' });
      chai.request(app)
        .get(BASE_URL + '/akaUnit/' + 'coolunit2')
        .then((res) => {
          res.should.have.status(200);
          const group = res.body;
          group.should.have.property('akaUnit', 'coolunit2');
        }).catch((err) => { throw err; });
    });
  });
  describe('/POST group', () => {
    it('Should return 400 when group is null', (done) => {
      chai.request(app)
        .post(BASE_URL)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('should return error when trying to create group with unexpected fields', (done) => {
      chai.request(app).post(BASE_URL)
        .send({ name: 'fuckoff', blarg: 'dfg' })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return the created group', (done) => {
      chai.request(app)
        .post(BASE_URL)
        .send({ name: 'Biran', akaUnit: 'haha4' })
        .end((err, res) => {
          res.should.exist;
          res.should.have.status(200);
          const group = res.body;
          group.should.have.property('name', 'Biran');
          group.should.have.property('akaUnit', 'haha4');
          done();
        });
    });
  });
  describe('/PUT group', () => {
    it('should return error when trying to update non-updatable field', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2' });
      await chai.request(app).put(`${BASE_URL}/${group.id}`)
        .send({ ancestors: ['haha'] })
        .then()
        .catch((err) => {
          err.should.exist;
          err.should.have.status(400);
        });
    });
    it('Should return the updated group', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2', akaUnit: 'haha5' });
      await chai.request(app)
        .put(`${BASE_URL}/${group.id}`)
        .send({ akaUnit: 'haha6' })
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('akaUnit','haha6');
        }).catch((err) => { throw err; });
    });


  });
  describe('/PUT adoption', () => {
    it('Should return 400 if null is sent', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'MyGroup' });
      await chai.request(app)
        .put(BASE_URL + '/adoption')
        .send({ parentId: group.id })
        .then(
        () => expect.fail(undefined, undefined, 'Should not succeed!'),
        err => err.should.have.status(400)
        );
    });
    it('Should return 404 if group is not found', (done) => {
      chai.request(app)
        .put(BASE_URL + '/adoption')
        .send({ parentId: ID_EXAMPLE, childIds: [ID_EXAMPLE_2] })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(404);
          done();
        });
    });
    it('Should fail if parent and child are the same', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'MyGroup' });
      await chai.request(app)
        .put(BASE_URL + '/adoption')
        .send({ parentId: group.id, childIds: [group.id] })
        .then(
          () => expect.fail(undefined, undefined, 'Should not succeed!'),
          err => err.should.have.status(400)
        );
    });
    it('Should adopt (simple)', async () => {
      let parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
      let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await chai.request(app)
        .put(BASE_URL + '/adoption')
        .send({ parentId: parent.id, childIds: [child.id] })
        .then((res) => {
          res.should.have.status(200);
        }).catch((err) => {
          expect.fail(undefined, undefined, err.message);
        });
      parent = await OrganizationGroup.getOrganizationGroup(parent.id);
      child = await OrganizationGroup.getOrganizationGroup(child.id);

      parent.should.exist;
      parent.children.should.exist;
      expect(parent.children[0].toString() === child.id.toString()).to.be.ok;
      child.should.exist;
      child.ancestors.should.exist;
      expect(child.ancestors[0].toString() === parent.id.toString()).to.be.ok;
    });
  });
  describe('/DELETE group', () => {
    it('Should return 404 if group does not exist', (done) => {
      chai.request(app)
        .del(BASE_URL + '/' + ID_EXAMPLE)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(404);
          const errCode = res.body.code;
          expect(errCode).to.equal(11); // group not found
          done();
        });
    });
    it('Should return 400 if group cannot be removed', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await OrganizationGroup.childrenAdoption(group.id, [child.id]);
      await chai.request(app)
        .del(BASE_URL + '/' + group.id)
        .then(() => expect.fail(undefined, undefined, 'Should not succeed!'))
        .catch((err) => {
          err.status.should.be.equal(400);
          err.response.body.code.should.be.equal(106); // cannot delete with subgroups
        });
    });
    it('Should return successful result ', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ id: ID_EXAMPLE, name: 'group' });
      await chai.request(app)
        .del(BASE_URL + '/' + group.id)
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('isAlive', false);
        }).catch((err) => { throw err; });
    });
  });
});

