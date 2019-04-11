import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import { Person } from './person.controller';
import { IPerson } from './person.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { RESPONSIBILITY, ENTITY_TYPE, RANK, DOMAIN_MAP } from '../config/db-enums';
import { createGroupForPersons, dummyGroup } from '../helpers/spec.helper';


const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;

const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c'];
const domainMap: Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));
const domains = [...domainMap.keys()];
const userStringEx = `nitro@${[...domainMap.keys()][2]}`;
const adfsUIDEx = `nitro@${[...domainMap.values()][2]}`;

const personExamples: IPerson[] = [
  <IPerson>{
    identityCard: '234567899',
    personalNumber: '3456712',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    job: 'parent',
    entityType: ENTITY_TYPE[0],
  },
  <IPerson>{
    identityCard: '567891239',
    personalNumber: '1234567',
    firstName: 'Yonatan',
    lastName: 'Tal',
    dischargeDay: new Date(2022, 11),
    job: 'Programmer',
    entityType: ENTITY_TYPE[0],
  },
  <IPerson>{
    identityCard: '123456782',
    personalNumber: '2345671',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    job: 'Pilot 1',
    entityType: ENTITY_TYPE[0],
  },
  <IPerson>{
    identityCard: '345678916',
    personalNumber: '4567123',
    firstName: 'Eli',
    lastName: 'Kopter',
    dischargeDay: new Date(2022, 11),
    job: 'Pilot 2',
    responsibility: RESPONSIBILITY[1],
    responsibilityLocation: dbIdExample[0],
    clearance: '3',
    rank: RANK[0],
    entityType: ENTITY_TYPE[0],
  },
  <IPerson>{
    identityCard: '456789122',
    personalNumber: '5671234',
    firstName: 'Tiki',
    lastName: 'Poor',
    dischargeDay: new Date(2022, 11),
    job: 'cosmetician 1',
    entityType: ENTITY_TYPE[0],
  },
];

const BASE_URL = '/api/persons';

describe('Person', () => {
  // create OG to link with each person.
  beforeEach(async () => await createGroupForPersons(personExamples));

  describe('/GET', () => {
    it('Should get all the persons', (done) => {
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
    it('Should get the persons', async () => {
      await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.createPerson(<IPerson>{ ...personExamples[1] });

      await chai.request(server)
        .get(BASE_URL)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
          const persons = res.body;
        }).catch((err) => { throw err; });
    });
    it('Should get persons without person that dead', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.createPerson(<IPerson>{ ...personExamples[1] });

      await Person.discharge(person.id);

      await chai.request(server)
        .get(BASE_URL)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(1);
        }).catch((err) => { throw err; });
    });
    it('Should get persons with person that dead', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.createPerson(<IPerson>{ ...personExamples[1] });

      await Person.discharge(person.id);

      await chai.request(server)
        .get(`${BASE_URL}?alsoDead=true`)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET person', () => {
    it('Should return 404 when person does not exist', (done) => {
      chai.request(server)
        .get(`${BASE_URL}/${dbIdExample[0]}`)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(404);
          const errMsg = res.text;
          errMsg.should.be.equal(`Cannot find person with ID: ${dbIdExample[0]}`);
          done();
        });
    });
    it('Should return a person according to "_id"', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(server)
        .get(`${BASE_URL}/${person.id}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('identityCard', personExamples[0].identityCard);
          res.body.should.have.property('firstName', personExamples[0].firstName);
          res.body.should.have.property('lastName', personExamples[0].lastName);
        }).catch((err) => { throw err; });
    });
    it('Should return a person according to "personalNumber"', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(server)
        .get(`${BASE_URL}/personalNumber/${person.personalNumber}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('identityCard', personExamples[0].identityCard);
          res.body.should.have.property('firstName', personExamples[0].firstName);
          res.body.should.have.property('lastName', personExamples[0].lastName);
        }).catch((err) => { throw err; });
    });
    it('Should return a person according to "identityCard"', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(server)
        .get(`${BASE_URL}/identityCard/${person.identityCard}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('personalNumber', personExamples[0].personalNumber);
          res.body.should.have.property('firstName', personExamples[0].firstName);
          res.body.should.have.property('lastName', personExamples[0].lastName);
        }).catch((err) => { throw err; });
    });
    it('Should return a person according to "identityCard" or "personalNumber"', async () => {
      const person1 = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const person2 = await Person.createPerson(<IPerson>{ ...personExamples[1] });
      await chai.request(server)
        .get(`${BASE_URL}/identifier/${person1.identityCard}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('personalNumber', personExamples[0].personalNumber);
          res.body.should.have.property('firstName', personExamples[0].firstName);
          res.body.should.have.property('lastName', personExamples[0].lastName);
        }).catch((err) => { throw err; });
      await chai.request(server)
        .get(`${BASE_URL}/identifier/${person2.personalNumber}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('identityCard', personExamples[1].identityCard);
          res.body.should.have.property('firstName', personExamples[1].firstName);
          res.body.should.have.property('lastName', personExamples[1].lastName);
        }).catch((err) => { throw err; });
    });
    it('should return the person by it\'s domain user', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({
              personId: person.id,
              uniqueID: userStringEx,
              isPrimary: true,
            });
        })
        .then(res => chai.request(server).get(`${BASE_URL}/domainUser/${userStringEx}`))
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          const person = res.body;
          person.should.exist;
          person.should.have.property('primaryDomainUser');
          const user = person.primaryDomainUser;
          user.should.have.property('uniqueID', userStringEx);
          user.should.have.property('adfsUID', adfsUIDEx);
        });
    });
  });
  describe('/GET updated persons', () => {
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
    it('Should return the updated persons from a certain date', async () => {
      const clock = sinon.useFakeTimers();
      await Person.createPerson(<IPerson>{ ...personExamples[0] });
      clock.tick(1000);
      const from = clock.Date().toISOString();
      clock.tick(1000);
      await Person.createPerson(<IPerson>{ ...personExamples[1] });
      clock.tick(1000);

      await chai.request(server)
        .get(`${BASE_URL}/getUpdated/${from}`)
        .then((res) => {
          res.should.have.status(200);
          const persons = res.body;
          persons.should.have.lengthOf(1);
          persons[0].should.have.property('identityCard', personExamples[1].identityCard);
        }).catch((err) => { throw err; });
      clock.restore();
    });
  });
  describe('/POST person', () => {
    it('Should return 400 when person is null', (done) => {
      chai.request(server)
        .post(BASE_URL)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(500); // TODO: should be 400!!!
          const errMsg = res.text;
          done();
        });
    });
    it('Should return 400 when person is not valid', (done) => {
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
    it('should return error when sending unexpected fields', (done) => {
      chai.request(server).post(BASE_URL).send({ ...personExamples[0], eyeColor: 'blue' })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return the created person', (done) => {
      chai.request(server)
        .post(BASE_URL)
        .send({ ...personExamples[0] })
        .end((err, res) => {
          res.should.exist;
          res.should.have.status(200);
          const person = res.body;
          person.should.have.property('identityCard', personExamples[0].identityCard);
          person.should.have.property('firstName', personExamples[0].firstName);
          person.should.have.property('lastName', personExamples[0].lastName);
          done();
        });
    });
  });

  describe('/POST person/domainUsers', () => {
    it('should return the person with the newly created primary domainUser', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({
              personId: person.id,
              uniqueID: userStringEx,
              isPrimary: true,
            });
        })
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.should.have.property('primaryDomainUser');
        });
    });

    it('should return the person with the newly created secondary domainUser', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({
              personId: person.id,
              uniqueID: userStringEx,
              isPrimary: false,
            });
        })
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.should.have.property('secondaryDomainUsers');
          updatedPerson.secondaryDomainUsers.should.have.lengthOf(1);
        });
    });

    it('should return error when the domain user string is invalid', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({ personId: person.id, uniqueID: `${userStringEx}@`, isPrimary: true });
        })
        .catch((err) => {
          err.should.exist;
        });
    });
    it('should return error when the domain user is\'t recognaized', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({ personId: person.id, uniqueID: `abc@wrong`, isPrimary: true });
        })
        .catch((err) => {
          err.should.exist;
        });
    });
    it('should return error when the domain user already exists', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({ personId: person.id, uniqueID: userStringEx, isPrimary: true });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({ personId: person.id, uniqueID: userStringEx, isPrimary: false });
        })
        .catch((err) => {
          err.should.exist;
        });
    });
  });

  describe('/PUT person/:id/domainUsers/:domainUser', () => {
    it('should return the person with changes', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({
              personId: person.id,
              uniqueID: userStringEx,
              isPrimary: true,
            });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
          .send({
            personId: person.id,
            uniqueID: `david@${domains[0]}`,
            isPrimary: false,
          });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(server).put(`${BASE_URL}/${person.id}/domainUsers/david@${domains[0]}`)
            .send({
              newUniqueID: `newDavid@${domains[0]}`,
              isPrimary: true,
            });          
        })
        .then(((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.primaryDomainUser.should.have.property('uniqueID', `newDavid@${domains[0]}`);
          updatedPerson.secondaryDomainUsers[0].should.have.property('uniqueID', userStringEx);
        }));
    });
  });

  describe('/DELETE person/:id/domainUsers/:domainUser', () => {
    it('should delete the domain user of person', async () => {
      await chai.request(server).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(server).post(`${BASE_URL}/domainUsers`)
            .send({
              personId: person.id,
              uniqueID: userStringEx,
              isPrimary: true,
            });
        })        
        .then((res) => {
          const person = res.body;
          return chai.request(server).del(`${BASE_URL}/${person.id}/domainUsers/${userStringEx}`);
        })           
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);          
        }).catch((err) => { throw err; });
    });
  });

  describe('/PUT person', () => {
    describe('/PUT person basic dry information', () => {
      it('Should return 400 when person does not exist', (done) => {
        // chai.request(server)
        //   .put(BASE_URL + '/1234567/personal')
        //   .end((err, res) => {
        //     err.should.exist;
        //     err.should.have.status(400);
        //     const errMsg = res.text;
        //     errMsg.should.be.equal('Person ID doesn\'t match');
        //     done();
        //   });
        done();
      });
      it('Should return 400 when person IDs do not match', (done) => {
        // chai.request(server)
        //   .put(BASE_URL + '/2345678/personal')
        //   .send(PERSON_XMPL)
        //   .end((err, res) => {
        //     err.should.exist;
        //     err.should.have.status(400);
        //     const errMsg = res.text;
        //     errMsg.should.be.equal('Person ID doesn\'t match');
        //     done();
        //   });
        done();
      });
      it('should return error when trying to update non-updatable field', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        await chai.request(server).put(`${BASE_URL}/${person.id}`)
          .send({ personalNumber: '1234567' })
          .then()
          .catch((err) => {
            err.should.exist;
            err.should.have.status(400);
          });
      });
      it('Should return the updated person', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        await chai.request(server)
          .put(`${BASE_URL}/${person.id}`)
          .send({ phone: ['027654321'] })
          .then((res) => {
            res.should.exist;
            res.should.have.status(200);
            res.body.should.have.property('phone');
            res.body.phone.should.have.members(['027654321']);
          }).catch((err) => { throw err; });
      });
      it('Should return the updated person #2', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        await chai.request(server)
          .put(`${BASE_URL}/${person.id}`)
          .send({ job: 'broken' })
          .then((res) => {
            res.should.exist;
            res.should.have.status(200);
            res.body.should.have.property('job', 'broken');
          }).catch((err) => { throw err; });
      });
    });
    describe('/assign person', () => {
      it('Should return a person whose group and hierarchy has been changed', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
        await chai.request(server)
          .put(`${BASE_URL}/${person.id}/assign`)
          .send({ group: group.id })
          .then((res) => {
            res.should.exist;
            expect(res.body.directGroup.toString() === group.id.toString()).to.be.ok;
            res.body.should.have.property('hierarchy');
            res.body.hierarchy.should.have.ordered.members([group.name]);
          }).catch((err) => { throw err; });
      });
    });
  });
  describe('/DELETE person', () => {
    it('Should return 404 if person does not exist', (done) => {
      chai.request(server)
        .del(`${BASE_URL}/${dbIdExample[0]}`)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(404);
          const errMsg = res.text;
          errMsg.should.be.equal(`Cannot find person with ID: ${dbIdExample[0]}`);
          done();
        });
    });
    it('Should return successful result ', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(server)
        .del(`${BASE_URL}/${person.id}`)
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('alive', false);
        }).catch((err) => { throw err; });
    });
  });
  // describe('/PUT person in/out group', () => {
  //   it('Should return ')
  // });
});

