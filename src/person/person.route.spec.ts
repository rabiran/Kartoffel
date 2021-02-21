import * as chai from 'chai';
import * as sinon from 'sinon';
import { app } from '../server';
import { Person } from './person.controller';
import { IPerson, IDomainUser, ProfilePictureDTO } from './person.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { RESPONSIBILITY, ENTITY_TYPE, RANK, CURRENT_UNIT, SERVICE_TYPE, DATA_SOURCE, STATUS, SEX } from '../config/db-enums';
import { config } from '../config/config';
import { createGroupForPersons, dummyGroup } from '../helpers/spec.helper';
import { domainMap } from '../utils';

const should = chai.should();
chai.use(require('chai-http'));
const expect = chai.expect;

const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c'];
const domains = [...domainMap.keys()];
const userStringEx = `nitro@${[...domainMap.keys()][2]}`;
const adfsUIDEx = `nitro@${[...domainMap.values()][2]}`;
const dataSourceExample = DATA_SOURCE[0];
const newUserExample = { uniqueID: userStringEx, dataSource: dataSourceExample, mail: 'asda@ffff.cob', hierarchy: ['a', 'b'] };

const DomainUserExamples: Partial<IDomainUser>[] = [
  {
    uniqueID: `matanel@rabiran.com`,
    dataSource: `dataSource1`,
  },
  {
    uniqueID: `biran@rabiran.com`,
    dataSource: `dataSource1`,
  },
  {
    uniqueID: `shaked@somedomain.com`,
    dataSource: `dataSource2`,
  },
  {
    uniqueID: `micha@jello.com`,
    dataSource: `dataSource2`,
  },
  {
    uniqueID: `david@jello2.com`,
    dataSource: `dataSource2`,
  },
  {
    uniqueID: `eli@yuda.sw`, // without adfsuid
    dataSource: `dataSource1`,
  },
];
const personExamples: IPerson[] = [
  <IPerson>{
    identityCard: '234567899',
    personalNumber: '3456712',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    job: 'parent',
    entityType: ENTITY_TYPE[1],
    currentUnit: CURRENT_UNIT[0],
    serviceType: SERVICE_TYPE[0],
    sex: SEX.Female,
    birthDate: new Date(1994, 4),
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
  <IPerson>{
    status: STATUS.INCOMPLETE,
    personalNumber: '3456711',
    firstName: 'Tipesh',
    lastName: 'Tov',
    dischargeDay: new Date(2025, 11),
    job: 'horse',
    entityType: ENTITY_TYPE[1],
    currentUnit: CURRENT_UNIT[0],
    serviceType: SERVICE_TYPE[0],
  },
];

const BASE_URL = '/api/persons';

describe('Person', () => {
  // create OG to link with each person.
  beforeEach(async () => await createGroupForPersons(personExamples));

  describe('/GET', () => {
    it('Should get all the persons', (done) => {
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
    it('Should get the persons', async () => {
      await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.createPerson(<IPerson>{ ...personExamples[1] });

      await chai.request(app)
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

      await chai.request(app)
        .get(BASE_URL)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(1);
        }).catch((err) => { throw err; });
    });
    it('Should get persons including person with status inactive', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.createPerson(<IPerson>{ ...personExamples[1] });

      await Person.discharge(person.id);

      await chai.request(app)
        .get(`${BASE_URL}?status=all`)  // all
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
        }).catch((err) => { throw err; });
    });
    it('Should get only persons which one datasource`s domainUsers is eql to query', async () => {
      const person1 = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const person2 = await Person.createPerson(<IPerson>{ ...personExamples[1] });
      const person3 = await Person.createPerson(<IPerson>{ ...personExamples[2] });
      await Person.addNewUser(person1.id, { ...DomainUserExamples[0] });
      await Person.addNewUser(person2.id, { ...DomainUserExamples[1] });
      await Person.addNewUser(person2.id, { ...DomainUserExamples[2] });
      await Person.addNewUser(person3.id, { ...DomainUserExamples[3] }); 
      await chai.request(app)
        .get(`${BASE_URL}?domainUsers.dataSource=dataSource1`)
        .then((res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.to.be.eql(2);
          res.body[0].should.to.have.property('identityCard',  person1.identityCard);
          res.body[1].should.to.have.property('identityCard',  person2.identityCard);          
        }).catch((err) => { throw err; });
    });
  });
  describe('/GET person', () => {
    it('Should return 404 when person does not exist', (done) => {
      chai.request(app)
        .get(`${BASE_URL}/${dbIdExample[0]}`)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(404);
          const errMsg = res.body.message;
          errMsg.should.be.equal(`Cannot find person with ID: ${dbIdExample[0]}`);
          done();
        });
    });
    it('Should return a person according to "_id"', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(app)
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
      await chai.request(app)
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
      await chai.request(app)
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
      await chai.request(app)
        .get(`${BASE_URL}/identifier/${person1.identityCard}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          res.body.should.have.property('personalNumber', personExamples[0].personalNumber);
          res.body.should.have.property('firstName', personExamples[0].firstName);
          res.body.should.have.property('lastName', personExamples[0].lastName);
        }).catch((err) => { throw err; });
      await chai.request(app)
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
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({
              uniqueID: userStringEx,
              dataSource: dataSourceExample,
            });
        })
        .then(res => chai.request(app).get(`${BASE_URL}/domainUser/${userStringEx}`))
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          const person = res.body;
          person.should.exist;
          person.should.have.property('domainUsers');
          person.domainUsers.should.have.lengthOf(1);
          const user = person.domainUsers[0];
          user.should.have.property('uniqueID', userStringEx);
          user.should.have.property('adfsUID', adfsUIDEx);
        });
    });
    it('should return the person by it\'s name of domainUser', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.addNewUser(person.id, { uniqueID: userStringEx, dataSource: dataSourceExample });
      await chai.request(app).get(`${BASE_URL}/domainUser/${'nitro'}`)
        .then((res) => {
          res.should.have.status(200);
          res.should.exist;
          const person = res.body;
          person.should.exist;
          person.should.have.property('domainUsers');
          person.domainUsers.should.have.lengthOf(1);
          const user = person.domainUsers[0];
          user.should.have.property('uniqueID', userStringEx);
          user.should.have.property('adfsUID', adfsUIDEx);
        });
    });    
  });
  describe('/GET updated persons', () => {
    it('Should return an 400 when given a wrong param', (done) => {
      chai.request(app)
        .get(`${BASE_URL}/getUpdated/abc`)
        .end((err, res) => {
          err.should.exist;
          res.should.have.status(400);
          const errMsg = res.body.message;
          errMsg.should.be.equal('Did not receive a valid date');
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

      await chai.request(app)
        .get(`${BASE_URL}/getUpdated/${from}`)
        .then((res) => {
          res.should.have.status(200);
          const persons = res.body;
          persons.should.have.lengthOf(1);
          persons[0].should.have.property('identityCard', personExamples[1].identityCard);
        }).catch((err) => { throw err; });
      clock.restore();
    });

    it('should return updated person from certain date and with entityType[0]', async () => {
      const clock = sinon.useFakeTimers();
      // person with EntityType[0]
      await Person.createPerson({ ...personExamples[1] });
      clock.tick(1000);
      const from = clock.Date().toISOString();
      // person with EntityType[1]
      await Person.createPerson({ ...personExamples[0] });
      // person with EntityType[0]
      const expectedPerson = await Person.createPerson({ ...personExamples[2] });
      clock.tick(1000);
      clock.restore();
      const res = await chai.request(app).get(`${BASE_URL}/getUpdated/${from}?entityType=${ENTITY_TYPE[0]}`);
      expect(res).to.have.status(200);
      const persons = res.body;
      expect(persons).to.have.lengthOf(1);
      expect(persons[0]).to.have.property('id', expectedPerson.id);
    });
  });
  describe('/POST person', () => {
    it('Should return 400 when person is null', (done) => {
      chai.request(app)
        .post(BASE_URL)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return 400 when person is not valid', (done) => {
      chai.request(app)
        .post(BASE_URL)
        .send({ firstName: 'Avi', lastName: 'Ron' })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('should return error when sending unexpected fields', (done) => {
      chai.request(app).post(BASE_URL).send({ ...personExamples[0], eyeColor: 'blue' })
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(400);
          const errMsg = res.text;
          done();
        });
    });
    it('Should return the created person', (done) => {
      chai.request(app)
        .post(BASE_URL)
        .send({ ...personExamples[0] })
        .end((err, res) => {
          res.should.exist;
          res.should.have.status(200);
          const person = res.body;
          person.should.have.property('identityCard', personExamples[0].identityCard);
          person.should.have.property('firstName', personExamples[0].firstName);
          person.should.have.property('lastName', personExamples[0].lastName);
          person.should.have.property('status', STATUS.ACTIVE);
          expect(person).to.have.property('sex', personExamples[0].sex);
          expect(person).to.have.property('birthDate', personExamples[0].birthDate.toISOString());
          done();
        });
    });
    it('should create a person with domain users', async () => {
      const person = { ...personExamples[0] };
      person.domainUsers = [newUserExample];
      const createdPerson = (await chai.request(app).post(BASE_URL).send(person)).body as IPerson;
      createdPerson.should.exist;
      createdPerson.domainUsers.should.have.lengthOf(1);
      const user = createdPerson.domainUsers[0] as IDomainUser;
      user.uniqueID.should.be.equal(userStringEx);
      expect(user.mail).to.equal(newUserExample.mail);
      expect(user.hierarchy).to.be.an('array').with.ordered.members(newUserExample.hierarchy);
    });
    it('should create a person with incomplete status', async () => {
      const person = { ...personExamples[5] };
      const createdPerson = (await chai.request(app).post(BASE_URL).send(person)).body as IPerson;
      createdPerson.should.exist;
      createdPerson.should.have.property('status', STATUS.INCOMPLETE);
    });
    it('should create a person with profile picture field', async () => {
      const pictures = {
        profile: {
          path: 'yuuu',
          takenAt: '2020-02-15',
          format: 'jpg',
        },
      };
      const takenAtIsoDateString = new Date(pictures.profile.takenAt).toISOString();
      const person = { ...personExamples[0], pictures };
      const result = (await chai.request(app).post(BASE_URL).send(person)).body as IPerson;
      expect(result.pictures).to.exist;
      expect(result.pictures.profile).to.exist;
      const profile = result.pictures.profile as any;
      expect(profile.url).to.exist;
      expect(profile.meta).to.exist;
      expect(profile.meta.format).to.equal(pictures.profile.format);
      expect(profile.meta.takenAt).to.equal(takenAtIsoDateString);
      expect(profile.meta.path).to.not.exist;
    });

  });

  describe('/POST person/:id/domainUsers', () => {
    it('should return the person with the newly created domainUser', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({              
              uniqueID: userStringEx,
              dataSource: dataSourceExample,
            });
        })
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.should.have.property('domainUsers');
          updatedPerson.domainUsers.should.have.lengthOf(1);
        });
    });

    it('should return the person with the newly created domainUser with mail and hierarchy', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({              
              uniqueID: userStringEx,
              dataSource: dataSourceExample,
              mail: newUserExample.mail,
              hierarchy: newUserExample.hierarchy,
            });
        })
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.should.have.property('domainUsers');
          updatedPerson.domainUsers.should.have.lengthOf(1);
          expect(updatedPerson.domainUsers[0].mail).to.equal(newUserExample.mail);
        });
    });

    it('should return error when the domain user string is invalid', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({ uniqueID: `${userStringEx}@`, dataSource: dataSourceExample });
        })
        .catch((err) => {
          err.should.exist;
        });
    });
    it('should return error when the domain user is\'t recognaized', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({ uniqueID: `abc@wrong`, dataSource: dataSourceExample });
        })
        .catch((err) => {
          err.should.exist;
        });
    });
    it('should return error when the domain user already exists', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({ uniqueID: userStringEx, dataSource: dataSourceExample });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({ uniqueID: userStringEx, dataSource: dataSourceExample });
        })
        .catch((err) => {
          err.should.exist;
        });
    });

    it('should return an error when the domain user dataSource is invalid', async () => {
      const person = await Person.createPerson({ ...personExamples[0] });
      await chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
      .send({ uniqueID: userStringEx, dataSource: 'ttrtr' })
        .then(
          () => expect.fail(undefined, undefined, 'request should fail'),
          (err) => {
            err.should.exist;
            err.should.have.status(400);
          }
        );
    });
  });

  describe('/PUT person/:id/domainUsers/:domainUser', () => {
    it('should return the person with changes', async () => {
      await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
            .send({   
              uniqueID: userStringEx,
              dataSource: dataSourceExample,
            });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`)
          .send({            
            uniqueID: `david@${domains[0]}`,
            dataSource: dataSourceExample,
          });
        })
        .then((res) => {
          const person = res.body;
          return chai.request(app).put(`${BASE_URL}/${person.id}/domainUsers/david@${domains[0]}`)
            .send({
              uniqueID: `newDavid@${domains[0]}`,
            });          
        })
        .then(((res) => {
          res.should.exist;
          res.should.have.status(200);
          const updatedPerson = res.body;
          updatedPerson.domainUsers.should.have.lengthOf(2);
          const updatedUser = updatedPerson.domainUsers[1];
          updatedUser.should.have.property('uniqueID', `newDavid@${domains[0]}`);
        }));
    });
    it('should add mail and hierarchy to domain user', async () => {
      const person = await Person.createPerson(<IPerson>{ 
        ...personExamples[0],
        domainUsers: [{ ...DomainUserExamples[0] }],
      });
      const updatedPerson = (await chai.request(app)
        .put(`${BASE_URL}/${person.id}/domainUsers/${DomainUserExamples[0].uniqueID}`)
        .send({
          mail: 'aaa@ggg.gg',
          hierarchy: ['ff', 'e'],
        })).body;
     
      expect(updatedPerson.domainUsers).to.be.an('array').with.lengthOf(1);
      expect(updatedPerson.domainUsers[0].mail).to.equal('aaa@ggg.gg');
      expect(updatedPerson.domainUsers[0].hierarchy).to.be.an('array').with.lengthOf(2);
      expect(updatedPerson.domainUsers[0].hierarchy).to.be.an('array').with.ordered.members(['ff', 'e']);
    });
  });

  describe('/DELETE person/:id/domainUsers/:domainUser', () => {
    it('should delete the domain user of person', async () => {
      const person = (await chai.request(app).post(BASE_URL).send({ ...personExamples[0] })).body;      
      let updatePerson = (await chai.request(app).post(`${BASE_URL}/${person.id}/domainUsers`).send({            
        uniqueID: userStringEx,
        dataSource: dataSourceExample,
      })).body;
      updatePerson.domainUsers[0].should.have.property('uniqueID', userStringEx);
      await chai.request(app).del(`${BASE_URL}/${person.id}/domainUsers/${userStringEx}`);
      updatePerson = (await chai.request(app).get(`${BASE_URL}/${person.id}`)).body;                 
      expect(updatePerson.domainUsers).to.have.lengthOf(0);    
    });
  });

  describe('/PUT person', () => {
    describe('/PUT person basic dry information', () => {
      it('should return error when trying to update non-updatable field', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        await chai.request(app).put(`${BASE_URL}/${person.id}`)
          .send({ directGroup: dbIdExample[0] })
          .then(
            () => expect.fail(undefined, undefined, 'request should not succeed'),
            (err) => {
              err.should.exist;
              err.should.have.status(400);
            }
          );
      });
      it('Should return the updated person', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        await chai.request(app)
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
        await chai.request(app)
          .put(`${BASE_URL}/${person.id}`)
          .send({ job: 'broken' })
          .then((res) => {
            res.should.exist;
            res.should.have.status(200);
            res.body.should.have.property('job', 'broken');
          }).catch((err) => { throw err; });
      });
    });
    it('should add the profile picture field to a person', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const pictures = {
        profile: {
          path: 'yuuu',
          takenAt: '2020-02-15',
          format: 'jpg',
        },
      };
      const takenAtIsoDateString = new Date(pictures.profile.takenAt).toISOString();
      const result = (await chai.request(app).put(`${BASE_URL}/${person.id}`)
        .send({ pictures })).body;
      expect(result.pictures).to.exist;
      expect(result.pictures.profile).to.exist;
      const profile = result.pictures.profile as any;
      expect(profile.url).to.exist;
      expect(profile.meta).to.exist;
      expect(profile.meta.format).to.equal(pictures.profile.format);
      expect(profile.meta.takenAt).to.equal(takenAtIsoDateString);
      expect(profile.meta.path).to.not.exist;
    });
    describe('/assign person', () => {
      it('Should return a person whose group and hierarchy has been changed', async () => {
        const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
        const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
        await chai.request(app)
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
      chai.request(app)
        .del(`${BASE_URL}/${dbIdExample[0]}`)
        .end((err, res) => {
          err.should.exist;
          err.should.have.status(404);
          const errMsg = res.body.message;
          errMsg.should.be.equal(`Cannot find person with ID: ${dbIdExample[0]}`);
          done();
        });
    });
    it('Should return successful result ', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await chai.request(app)
        .del(`${BASE_URL}/${person.id}`)
        .then((res) => {
          res.should.exist;
          res.should.have.status(200);
          res.body.should.have.property('status', STATUS.INACTIVE);
        }).catch((err) => { throw err; });
    });
  });
  // describe('/PUT person in/out group', () => {
  //   it('Should return ')
  // });
});

