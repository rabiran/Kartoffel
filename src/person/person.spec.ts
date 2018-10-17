import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import * as personRouter from './person.route';
import { Person } from './person.controller';
import { PersonModel } from './person.model';
import { OrganizationGroupModel } from '../group/organizationGroup/organizationGroup.model';
import { IPerson } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { expectError, createGroupForPersons, dummyGroup } from '../helpers/spec.helper';
import * as mongoose from 'mongoose';
import { IDomainUser } from '../domainUser/domainUser.interface';
import { RESPONSIBILITY, RANK, SERVICE_TYPE } from '../../db-enums'; 
const Types = mongoose.Types;
const RESPONSIBILITY_DEFAULT = RESPONSIBILITY[0];

const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));

const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c', '5b50a76713ddf90af494de33', '5b50a76713ddf90af494de34','5b50a76713ddf90af494de35','5b50a76713ddf90af494de36', '5b50a76713ddf90af494de37'];

const personExamples: IPerson[] = [
  <IPerson>{
    identityCard: '123456789',
    personalNumber: '2345671',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    job: 'Pilot 1',
    serviceType: SERVICE_TYPE[0],
  },
  <IPerson>{
    identityCard: '234567891',
    personalNumber: '3456712',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    job: 'parent',
    serviceType: SERVICE_TYPE[0],  
  },
  <IPerson>{
    identityCard: '345678912',
    personalNumber: '4567123',
    firstName: 'Eli',
    lastName: 'Kopter',
    dischargeDay: new Date(2022, 11),
    job: 'Pilot 2',
    responsibility: RESPONSIBILITY[1],
    responsibilityLocation: dbIdExample[1],
    clearance: '3',
    rank: RANK[0],
    serviceType: SERVICE_TYPE[0],
  },
  <IPerson>{
    identityCard: '456789123',
    personalNumber: '5671234',
    firstName: 'Tiki',
    lastName: 'Poor',
    dischargeDay: new Date(2022, 11),
    job: 'cosmetician 1',
    serviceType: SERVICE_TYPE[0],
  },
  <IPerson>{
    identityCard: '567891234',
    personalNumber: '1234567',
    firstName: 'Yonatan',
    lastName: 'Tal',
    dischargeDay: new Date(2022, 11),
    job: 'Programmer',
    serviceType: SERVICE_TYPE[0],
  },
];

describe('Persons', () => {
  // create OG to link with each person.
  beforeEach(async () => await createGroupForPersons(personExamples));

  describe('#getPersons', () => {
    it('Should be empty if there are no persons', async () => {
      const persons = await Person.getPersons();
      persons.should.be.a('array');
      persons.should.have.lengthOf(0);
    });
    it('Should get all the persons', async () => {
      await Person.createPerson(personExamples[0]);
      let persons = await Person.getPersons();
      persons.should.be.a('array');
      persons.should.have.lengthOf(1);
      should.exist(persons[0]);
      persons[0].should.have.property('personalNumber', '2345671');


      await Person.createPerson(<IPerson>{ ...personExamples[1] });
      await Person.createPerson(<IPerson>{ ...personExamples[2] });

      persons = await Person.getPersons();
      persons.should.be.a('array');
      persons.should.have.lengthOf(3);
      persons[0].should.have.property('firstName', 'Avi');
      persons[1].should.exist;
      persons[2].should.have.property('lastName', 'Kopter');
    });
  });
  describe('#get updated persons a from given date', () => {
    it('Should get the current persons', async () => {
      const clock = sinon.useFakeTimers();
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      clock.tick(1000);
      const from = new Date();
      clock.tick(1000);
      await Person.createPerson(<IPerson>{ ...personExamples[1] });
      await Person.createPerson(<IPerson>{ ...personExamples[2] });
      await Person.updatePerson(person.id, person);
      clock.tick(1000);
      const to = new Date();
      clock.tick(1000);
      await Person.createPerson(<IPerson>{ ...personExamples[3] });
      const persons = await Person.getUpdatedFrom(from, to);
      clock.restore();

      should.exist(persons);
      persons.should.have.lengthOf(3);
      persons[0].should.have.property('personalNumber', '2345671');
      persons[1].should.have.property('personalNumber', '3456712');
      persons[2].should.have.property('personalNumber', '4567123');
    });
  });
  describe('#createPerson', () => {
    it('Should create a person with basic info', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[4] });
      should.exist(person);
      person.should.have.property('identityCard', '567891234');
      person.should.have.property('personalNumber', '1234567');
      // person.should.have.property('primaryDomainUser');
      // expect(String(person.primaryDomainUser) === personExamples[4].primaryDomainUser).to.be.true;
      person.should.have.property('firstName', 'Yonatan');
      person.should.have.property('lastName', 'Tal');
      person.should.have.property('dischargeDay', personExamples[4].dischargeDay);
      person.should.have.property('hierarchy');
      person.hierarchy.should.have.ordered.members([dummyGroup.name]);
      person.should.have.property('job', 'Programmer');
      person.should.have.property('responsibility', RESPONSIBILITY_DEFAULT);
      person.should.have.property('clearance', '0');
      person.should.have.property('alive', true);
    });
    it('should create a person with more complex hierarchy', async () => {
      const parent = await OrganizationGroup.createOrganizationGroup(<any>{ name: 'group0' });
      const p = personExamples[0];
      await OrganizationGroup.childrenAdoption(parent.id, [<string>p.directGroup]);
      const newPerson = await Person.createPerson(p);
      newPerson.should.have.property('hierarchy');
      newPerson.hierarchy.should.have.ordered.members([parent.name, dummyGroup.name]);
    });
    it('Should create a person with more info', async () => {
      const newPerson = <IPerson>{
        ...personExamples[4],
        primaryDomainUser: dbIdExample[3],
        secondaryDomainUsers: [dbIdExample[0], dbIdExample[1]],
        serviceType: SERVICE_TYPE[0],
        mail: 'yonatan@work.com',
        phone: ['023456789', '02-3456389'],
        mobilePhone: ['054-9754999', '0541234567'],
        rank: RANK[0],
        address: 'I live here',
        responsibility: RESPONSIBILITY[1],
        responsibilityLocation: new Types.ObjectId(dbIdExample[3]),
        clearance: '5',
        alive: true,
      };

      const person = await Person.createPerson(newPerson);
      should.exist(person);
      person.should.have.property('identityCard', newPerson.identityCard);
      person.should.have.property('personalNumber', newPerson.personalNumber);
      person.should.have.property('serviceType', newPerson.serviceType);
      person.should.have.property('firstName', newPerson.firstName);
      person.should.have.property('lastName', newPerson.lastName);
      person.should.have.property('currentUnit', newPerson.currentUnit);
      person.should.have.property('dischargeDay', newPerson.dischargeDay);
      person.should.have.property('hierarchy');
      person.hierarchy.should.have.ordered.members([dummyGroup.name]);
      person.should.have.property('job', newPerson.job);
      person.should.have.property('mail', newPerson.mail);
      person.should.have.property('phone');
      person.phone.should.have.members(newPerson.phone);
      person.should.have.property('mobilePhone');
      person.mobilePhone.should.have.members(newPerson.mobilePhone);
      person.should.have.property('rank', newPerson.rank);
      person.should.have.property('address', newPerson.address);
      person.should.have.property('responsibility', newPerson.responsibility);
      person.should.have.property('clearance', newPerson.clearance);
      person.should.have.property('alive', newPerson.alive);
    });

    describe('Person validation', () => {
      it('Should throw an error when Person is undefined', async () => {
        await expectError(Person.createPerson, [undefined]);
      });
      it('Should throw an error when mandatory fields are missing', async () => {
        let person = { ...personExamples[1] };
        delete person.identityCard;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        person.personalNumber = '';
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.firstName;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.lastName;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.dischargeDay;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.job;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.directGroup;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.serviceType;
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when Identity Card is not valid', async () => {
        const person = { ...personExamples[1] };
        person.identityCard = '1234567890';
        await expectError(Person.createPerson, [person]);
        person.identityCard = '12345678a';
        await expectError(Person.createPerson, [person]);
        person.identityCard = '12345';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when personal number is not valid', async () => {
        const person = { ...personExamples[1] };
        person.personalNumber = '234567103';
        await expectError(Person.createPerson, [person]);
        person.personalNumber = '23456';
        await expectError(Person.createPerson, [person]);
        person.personalNumber = '234a567';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when Name strings are empty', async () => {
        const person = { ...personExamples[1] };
        person.firstName = '';
        await expectError(Person.createPerson, [person]);
        person.firstName = 'Avi';
        person.lastName = '';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when job is empty', async () => {
        const person = { ...personExamples[1] };
        person.job = '';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when responsibility is not valid', async () => {
        const person = { ...personExamples[1] };
        person.responsibility = RESPONSIBILITY[1];
        await expectError(Person.createPerson, [person]);
        person.responsibility = RESPONSIBILITY_DEFAULT;
        person.responsibilityLocation = '';
        await expectError(Person.createPerson, [person]);
        delete person.responsibility;
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when mail string is invalid', async () => {
        const person = { ...personExamples[1] };
        person.mail = '@gmail.com';
        await expectError(Person.createPerson, [person]);
        person.mail = 'aviron@.com';
        await expectError(Person.createPerson, [person]);
        person.mail = 'avirongmail.com';
        await expectError(Person.createPerson, [person]);
        person.mail = 'aviron@gmailcom';
        await expectError(Person.createPerson, [person]);
        person.mail = 'aviron@.com';
        await expectError(Person.createPerson, [person]);
        person.mail = 'aviron@gmail.';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when Phone is invalid', async () => {
        const person = { ...personExamples[1] };
        person.phone = ['BlaBla'];
        await expectError(Person.createPerson, [person]);
        person.phone = ['0212345678'];
        await expectError(Person.createPerson, [person]);
        person.phone = ['02-123645678'];
        await expectError(Person.createPerson, [person]);
        person.phone = ['0212-364567'];
        await expectError(Person.createPerson, [person]);
        person.phone = ['02-36456'];
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when Mobile Phone is invalid', async () => {
        const person = { ...personExamples[1] };
        person.mobilePhone = ['BlaBla'];
        await expectError(Person.createPerson, [person]);
        person.mobilePhone = ['05412345678'];
        await expectError(Person.createPerson, [person]);
        person.mobilePhone = ['054-12345678'];
        await expectError(Person.createPerson, [person]);
        person.mobilePhone = ['054-123456'];
        await expectError(Person.createPerson, [person]);      
        person.mobilePhone = ['1523645'];
        await expectError(Person.createPerson, [person]);
      });
      it('should throw error when service type is invalid', async () => {
        const person = { ...personExamples[1] };
        person.serviceType = SERVICE_TYPE[0] + '_bullshit';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when clearance is invalid', async () => {
        const person = { ...personExamples[1] };
        person.clearance = '-2';
        await expectError(Person.createPerson, [person]);
        person.clearance = '11';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when existed identity card is given', async () => {
        await Person.createPerson(<IPerson>{ ...personExamples[1] });
        const person = { ...personExamples[3] };
        person.identityCard = personExamples[1].identityCard;
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when existed personal number is given', async () => {
        await Person.createPerson(<IPerson>{ ...personExamples[1] });
        const person = { ...personExamples[3] };
        person.personalNumber = personExamples[1].personalNumber;
        await expectError(Person.createPerson, [person]);
      });
    });
  });

  describe('#getPerson', () => {
    it('Should throw an error when there is no matching person', async () => {
      await expectError(Person.getPersonById, [dbIdExample[0]]);
    });
    it('Should find person when one exists', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const returnedPerson = await Person.getPersonById(person.id);
      should.exist(returnedPerson);
      person.should.have.property('identityCard', '123456789');
      person.should.have.property('firstName', 'Avi');
    });
  });

  describe('#removePerson', () => {
    it('Should throw an error when there is no person to remove', async () => {
      await expectError(Person.removePerson, [dbIdExample[0]]);
    });
    it('Should remove a person successfully if existed', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const res = await Person.removePerson(person.id);
      should.exist(res);
      res.should.have.property('ok', 1);
      res.should.have.property('n', 1);
      await expectError(Person.getPerson, [person.id]);
    });
    it('Should update the person\'s group after that the person is removed', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person.id, group.id);

      group = await OrganizationGroup.getOrganizationGroup(group.id, ['directMembers']);
      group.directMembers.should.have.lengthOf(1);

      await Person.removePerson(person.id);

      group = await OrganizationGroup.getOrganizationGroup(group.id, ['directMembers']);
      group.directMembers.should.have.lengthOf(0);
    });
  });
  describe('#discharge', () => {
    it('Should throw an error when there is no person to discharge', async () => {
      await expectError(Person.discharge, [dbIdExample[0]]);
    });
    it('Should discharge a person successfully if existed', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const res = await Person.discharge(person.id);
      should.exist(res);
      res.should.have.property('alive', false);
      res.should.have.property('directGroup');
    });
    it('Should update the person\'s group and manage group after that the person is discharged', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person.id, group.id);
      await Person.manage(person.id, group.id);
      await Person.discharge(person.id);

      group = await OrganizationGroup.getOrganizationGroup(group.id, ['directMembers', 'directManagers']);
      group.directMembers.should.have.lengthOf(0);
      group.directManagers.should.have.lengthOf(0);
    });
    it('Should not get a "dead" person with the regular get', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.discharge(person.id);

      const persons = await Person.getPersons();
      persons.should.have.lengthOf(0);
    });
  });
  describe('#updatePerson', () => {
    it('Should throw an error when the person does not exist', async () => {
      await expectError(Person.updatePerson, [{ ...personExamples[0] }]);
    });
    it('Should throw an error when updated data isn\'t valid', async () => {
      const person = <IPerson>{ ...personExamples[0] };
      await Person.createPerson(person);

      person.firstName = '';

      await expectError(Person.updatePerson, [person]);
    });
    it('Should return the updated person', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });

      person.job = 'Programmer';
      person.rank = RANK[0];
      person.responsibility = RESPONSIBILITY[1];
      person.responsibilityLocation = new Types.ObjectId(dbIdExample[0]);

      const updatedPerson = await Person.updatePerson(person.id, person);
      should.exist(updatedPerson);
      expect(updatedPerson.id === person.id).to.be.true;
      updatedPerson.should.have.property('firstName', person.firstName);
      updatedPerson.should.have.property('rank', person.rank);
      updatedPerson.should.have.property('job', person.job);
      updatedPerson.should.have.property('responsibility', person.responsibility);
      expect(String(updatedPerson.responsibilityLocation) === 
        String(person.responsibilityLocation)).to.be.true;
    });
    it('Should not delete the unchanged props', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const updatedPerson = await Person.updatePerson(person.id, { firstName: 'Danny' });
      updatedPerson.should.have.property('lastName', 'Ron');
    });
    it('Should save the updated person correctly', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });

      person.job = 'Programmer';
      person.rank = RANK[0];
      person.responsibility = RESPONSIBILITY[1];
      person.responsibilityLocation = new Types.ObjectId(dbIdExample[0]);

      await Person.updatePerson(person.id, person);
      const updatedPerson = await Person.getPersonById(person.id);

      should.exist(updatedPerson);

      // Why can't I loop over the person's keys and values?? stupid typescript...

      expect(updatedPerson.id === person.id).to.be.true;
      updatedPerson.should.have.property('firstName', person.firstName);
      updatedPerson.should.have.property('rank', person.rank);
      updatedPerson.should.have.property('job', person.job);
      updatedPerson.should.have.property('responsibility', person.responsibility);
      expect(String(updatedPerson.responsibilityLocation) ===
        String(person.responsibilityLocation)).to.be.true;
    });
  });
  describe('Person Staffing', () => {
    it('Should throw an error if the person does not exist', async () => {
      await expectError(Person.assign, [dbIdExample[0], dbIdExample[1]]);
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await expectError(Person.assign, [dbIdExample[0], group.id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await expectError(Person.assign, [person.id, dbIdExample[0]]);
    });
    it('Should assign person to group', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person.id, group.id);

      // Check in the person and group after the update
      person = await Person.getPersonById(person.id);
      group = await OrganizationGroup.getOrganizationGroup(group.id, ['directMembers']);
      should.exist(person);
      should.exist(group);
      expect(person.directGroup.toString() === group.id.toString()).to.be.ok;
      group.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group.directMembers[0]).id === person.id).to.be.true;
    });
    it('Should transfer a person from another group if he was assigned to one before', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      let group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await Person.assign(person.id, group1.id);
      await Person.assign(person.id, group2.id);

      person = await Person.getPersonById(person.id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1.id, ['directMembers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2.id, ['directMembers']);

      group1.directMembers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group2.directMembers[0]).id === person.id).to.be.true;
      expect(person.directGroup.toString() === group2.id.toString()).to.be.ok;
    });
  });
  describe('Appoint as a leaf', () => {
    it('Should throw an error if the person does not exist', async () => {
      await expectError(Person.manage, [dbIdExample[0], dbIdExample[1]]);
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await expectError(Person.manage, [dbIdExample[0], group.id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await expectError(Person.manage, [person.id, dbIdExample[0]]);
    });
    it('Should appoint as a manager', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person.id, group.id);
      await Person.manage(person.id, group.id);

      // Check in the person and group after the update
      person = await Person.getPersonById(person.id);
      group = await OrganizationGroup.getOrganizationGroup(group.id, ['directMembers', 'directManagers']);

      should.exist(person);
      should.exist(group);
      expect(person.directGroup.toString() === group.id.toString()).to.be.true;
      group.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group.directMembers[0]).id === person.id).to.be.true;
      group.directManagers.should.have.lengthOf(1);
      expect((<IPerson>group.directManagers[0]).id === person.id).to.be.true;
    });
    it('Should not transfer if in another group', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      let group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await expectError(Person.manage, [person.id, group2.id]);
      await Person.assign(person.id, group1.id);
      await expectError(Person.manage, [person.id, group2.id]);

      person = await Person.getPersonById(person.id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1.id, ['directMembers', 'directManagers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2.id, ['directMembers', 'directManagers']);

      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
      expect((<IPerson>group1.directMembers[0]).id === person.id).to.be.true;
      expect(person.directGroup.toString() === group1.id.toString()).to.be.true;


      await Person.manage(person.id, group1.id);
      await expectError(Person.manage, [person.id, group2.id]);

      person = await Person.getPersonById(person.id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1.id, ['directMembers', 'directManagers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2.id, ['directMembers', 'directManagers']);
      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(1);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
    });
  });
  describe('#addDomainUser', () => {
    it('should add new primary domain user to the person', async () => {
      const person = await Person.createPerson(personExamples[3]);
      const updatedPerson = await Person.addNewUser(person.id, 'nitro@jello', true);
      updatedPerson.should.exist;
      updatedPerson.should.have.property('primaryDomainUser');
      const populatedPerson = await Person.getPersonById(person.id);
      const user = <IDomainUser>populatedPerson.primaryDomainUser;
      user.id.should.exist;
      user.should.have.property('personId');
      user.should.have.property('fullString', 'nitro@jello');
      expect(String(user.personId) === person.id).to.be.true;
    });

    it('should add new user with object as parameter', async () => {
      const person = await Person.createPerson(personExamples[3]);
      const userObj: IDomainUser = {
        name: 'elad',
        domain: 'ex',
      };
      const updatedPerson = await Person.addNewUser(person.id, userObj, true);
      updatedPerson.should.exist;
      updatedPerson.should.have.property('primaryDomainUser');
      const populatedPerson = await Person.getPersonById(person.id);
      const user = <IDomainUser>populatedPerson.primaryDomainUser;
      user.id.should.exist;
      user.should.have.property('personId');
      expect(String(user.personId) === person.id).to.be.true;
    });

    it('should throw error when trying to create illegal primary domain user', async () => {
      const person = await Person.createPerson(personExamples[3]);
      expectError(Person.addNewUser, [person.id, 'fff@', true]);
    });
    
    it('should throw error when trying to add existing user', async () => {
      const person = await Person.createPerson(personExamples[3]);
      await Person.addNewUser(person.id, 'nitro@jello', true);
      expectError(Person.addNewUser, ['nitro@jello']);
    });

    it('should add new secondary domain users to the person', async () => {
      const person = await Person.createPerson(personExamples[3]);
      let updatedPerson = await Person.addNewUser(person.id, 'nitro@jello', false);
      updatedPerson.should.exist;
      updatedPerson.should.have.property('secondaryDomainUsers');
      updatedPerson.secondaryDomainUsers.should.have.lengthOf(1);
      // add another secondary user
      updatedPerson = await Person.addNewUser(person.id, 'nitro2@jello', false);
      updatedPerson.secondaryDomainUsers.should.have.lengthOf(2);
      // check that it was populated correctly 
      const populatedPerson = await Person.getPersonById(person.id);
      const secUser = <IDomainUser>populatedPerson.secondaryDomainUsers[1];
      secUser.id.should.exist;
      secUser.should.have.property('personId');
      expect(String(secUser.personId) === person.id).to.be.true; // hate to convert objectId :\
      secUser.should.have.property('fullString', 'nitro2@jello');
    });

    it('should replace the primary user and make the previous secondaries', async () => {
      const person = await Person.createPerson(personExamples[3]);
      let updatedPerson = await Person.addNewUser(person.id, 'nitro@jello', true);
      updatedPerson =  await Person.addNewUser(person.id, 'nitro2@jello', true);
      updatedPerson =  await Person.addNewUser(person.id, 'nitro3@jello', true);
      updatedPerson.should.exist;
      // check that the person have both primary & secondary domain users
      updatedPerson.should.have.property('primaryDomainUser');
      updatedPerson.should.have.property('secondaryDomainUsers');
      updatedPerson.secondaryDomainUsers.should.have.lengthOf(2);
      // check that the primary & secondary users are the correct ones
      const populatedPerson = await Person.getPersonById(person.id);
      const primaryUser = <IDomainUser>populatedPerson.primaryDomainUser;
      primaryUser.should.exist;
      primaryUser.should.have.property('fullString', 'nitro3@jello');
      const secUser = <IDomainUser>populatedPerson.secondaryDomainUsers[0];
      secUser.should.exist;
      secUser.should.have.property('fullString', 'nitro@jello');
    });
  });

  describe('#getByDomainUserString', () => {
    it('should get the person by it\'s domain user string', async () => {
      const createdPerson = await Person.createPerson(personExamples[3]);
      await Person.addNewUser(createdPerson.id, 'nitro@jello', true);
      const person = await Person.getByDomainUserString('nitro@jello');
      person.should.exist;
      person.should.have.property('primaryDomainUser');
      // the person should be populated
      const user = <IDomainUser>person.primaryDomainUser;
      user.id.should.exist;
      user.should.have.property('personId');
      expect(String(user.personId) === person.id).to.be.true;
    });
    it('should throw error when the there is no matching user', async () => {
      const createdPerson = await Person.createPerson(personExamples[3]);
      await Person.addNewUser(createdPerson.id, 'nitro@jello', true);
      expectError(Person.getByDomainUserString, ['other@jello']);
    });
  });

});

async function printTreeHeavy(sourceID: string, deep = 0) {
  const source = await OrganizationGroup.getOrganizationGroupOld(sourceID);
  let pre = '';
  for (let i = 0; i < deep; i++) {
    pre += '  ';
  }
  console.log(pre + source.name);
  const children = source.children;
  if (children.length === 0) return;
  for (const child of children) await printTreeHeavy(<string>child, deep + 1);
}
