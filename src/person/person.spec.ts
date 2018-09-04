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
import { expectError } from '../helpers/spec.helper';
import { ObjectId } from 'mongodb';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));

const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c'];

const personExamples: IPerson[] = [
  <IPerson>{
    identityCard: '123456789',
    personalNumber: '2345671',
    primaryDomainUser: 'aviron@secure.sod',
    firstName: 'Avi',
    lastName: 'Ron',
    dischargeDay: new Date(2022, 11),
    mail: 'avi.ron@gmail.com',
    hierarchy: ['Airport', 'Pilots guild', 'captain'],
    job: 'Pilot 1',
  },
  <IPerson>{
    identityCard: '234567891',
    personalNumber: '3456712',
    primaryDomainUser: 'mazaltov@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  },
  <IPerson>{
    identityCard: '345678912',
    personalNumber: '4567123',
    primaryDomainUser: 'elikopter@secure.sod',
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
  <IPerson>{
    identityCard: '456789123',
    personalNumber: '5671234',
    primaryDomainUser: 'tikipoor@cosmetician.sod',
    firstName: 'Tiki',
    lastName: 'Poor',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['fashion designer', 'cosmetician guild'],
    job: 'cosmetician 1',
  },
  <IPerson>{
    identityCard: '567891234',
    personalNumber: '1234567',
    primaryDomainUser: 'yonatantal@development.sod',
    firstName: 'Yonatan',
    lastName: 'Tal',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['www', 'microsoft', 'github'],
    job: 'Programmer',
  },
];

describe('Persons', () => {
  describe('#getPersons', () => {
    it('Should be empty if there are no persons', async () => {
      const persons = await Person.getPersons();
      persons.should.be.a('array');
      persons.should.have.lengthOf(0);
    });
    it('Should get all the persons', async () => {
      await Person.createPerson(<IPerson>{ ...personExamples[0] });

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
      await Person.createPerson(<IPerson>{ ...personExamples[0] });
      clock.tick(1000);
      const from = new Date();
      clock.tick(1000);
      await Person.createPerson(<IPerson>{ ...personExamples[1] });
      await Person.createPerson(<IPerson>{ ...personExamples[2] });
      clock.tick(1000);
      const to = new Date();
      clock.tick(1000);
      await Person.createPerson(<IPerson>{ ...personExamples[3] });
      const persons = await Person.getUpdatedFrom(from, to);
      clock.restore();

      should.exist(persons);
      persons.should.have.lengthOf(2);
      persons[0].should.have.property('personalNumber', '3456712');
      persons[1].should.have.property('personalNumber', '4567123');

    });
  });
  describe('#createPerson', () => {
    it('Should create a person with basic info', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[4] });
      should.exist(person);
      person.should.have.property('identityCard', '567891234');
      person.should.have.property('personalNumber', '1234567');
      person.should.have.property('primaryDomainUser', 'yonatantal@development.sod');
      person.should.have.property('firstName', 'Yonatan');
      person.should.have.property('lastName', 'Tal');
      person.should.have.property('dischargeDay', personExamples[4].dischargeDay);
      person.should.have.property('hierarchy');
      person.hierarchy.should.have.ordered.members(['www', 'microsoft', 'github']);
      person.should.have.property('job', 'Programmer');
      person.should.have.property('rank', 'Newbie');
      person.should.have.property('responsibility', 'None');
      person.should.have.property('clearance', '0');
      person.should.have.property('alive', true);
    });
    it('Should create a person with more info', async () => {
      const newPerson = <IPerson>{
        ...personExamples[4],
        secondaryDomainUsers: ['yonatantal@programer.sod', 'yonatantal@special.sod'],
        serviceType: 'standing army',
        mail: 'yonatan@work.com',
        phone: ['023456789', '02-3456389'],
        mobilePhone: ['054-9754999', '0541234567'],
        rank: 'Skillful',
        address: 'I live here',
        responsibility: 'HR',
        responsibilityLocation: new ObjectId(dbIdExample[0]),
        clearance: '5',
        alive: true,
      };

      const person = await Person.createPerson(newPerson);
      should.exist(person);
      person.should.have.property('identityCard', newPerson.identityCard);
      person.should.have.property('personalNumber', newPerson.personalNumber);
      person.should.have.property('primaryDomainUser', newPerson.primaryDomainUser);
      person.should.have.property('secondaryDomainUsers');
      person.secondaryDomainUsers.should.have.members(newPerson.secondaryDomainUsers);
      person.should.have.property('serviceType', newPerson.serviceType);
      person.should.have.property('firstName', newPerson.firstName);
      person.should.have.property('lastName', newPerson.lastName);
      person.should.have.property('currentUnit', newPerson.currentUnit);
      person.should.have.property('dischargeDay', newPerson.dischargeDay);
      person.should.have.property('hierarchy');
      person.hierarchy.should.have.ordered.members(newPerson.hierarchy);
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
        delete person.primaryDomainUser;
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
        delete person.hierarchy;
        await expectError(Person.createPerson, [person]);
        person = { ...personExamples[1] };
        delete person.job;
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
      it('Should throw an error when primary person is not valid', async () => {
        const person = { ...personExamples[1] };
        person.primaryDomainUser = 'aviron@secure.';
        await expectError(Person.createPerson, [person]);
        person.primaryDomainUser = 'avironsecure.sod';
        await expectError(Person.createPerson, [person]);
        person.primaryDomainUser = 'aviron@securesod';
        await expectError(Person.createPerson, [person]);
        person.primaryDomainUser = '@secure.sod';
        await expectError(Person.createPerson, [person]);
        person.primaryDomainUser = 'aviron@.sod';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when secondary persons is not valid', async () => {
        const person = { ...personExamples[1] };
        person.secondaryDomainUsers = ['avi@secure.sod', 'ron@.sod'];
        await expectError(Person.createPerson, [person]);
        person.secondaryDomainUsers = ['@secure.sod', 'ron@secure.sod'];
        await expectError(Person.createPerson, [person]);
        person.secondaryDomainUsers = ['avi@secure.sod', 'ron@secure'];
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
      it('Should throw an error when hierarchy are empty', async () => {
        const person = { ...personExamples[1] };
        person.hierarchy = [];
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when job is empty', async () => {
        const person = { ...personExamples[1] };
        person.job = '';
        await expectError(Person.createPerson, [person]);
      });
      it('Should throw an error when responsibility is not valid', async () => {
        const person = { ...personExamples[1] };
        person.responsibility = 'HR';
        await expectError(Person.createPerson, [person]);
        person.responsibility = 'None';
        person.responsibilityLocation = new ObjectId();
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
        person.phone = ['12364564'];
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
        person.mobilePhone = ['0236456789'];
        await expectError(Person.createPerson, [person]);
        person.mobilePhone = ['1523645678'];
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
      it('Should throw an error when existed primary person is given', async () => {
        await Person.createPerson(<IPerson>{ ...personExamples[1] });
        const person = { ...personExamples[3] };
        person.primaryDomainUser = personExamples[1].primaryDomainUser;
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
      const returnedPerson = await Person.getPersonById(person._id);
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
      const res = await Person.removePerson(person._id);
      should.exist(res);
      res.should.have.property('ok', 1);
      res.should.have.property('n', 1);
      await expectError(Person.getPersonById, [person._id]);
    });
    it('Should update the person\'s group after that the person is removed', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person._id, group._id);

      group = await OrganizationGroup.getOrganizationGroup(group._id, ['directMembers']);
      group.directMembers.should.have.lengthOf(1);

      await Person.removePerson(person._id);

      group = await OrganizationGroup.getOrganizationGroup(group._id, ['directMembers']);
      group.directMembers.should.have.lengthOf(0);
    });
  });
  describe('#discharge', () => {
    it('Should throw an error when there is no person to discharge', async () => {
      await expectError(Person.discharge, [dbIdExample[0]]);
    });
    it('Should discharge a person successfully if existed', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const res = await Person.discharge(person._id);
      should.exist(res);
      res.should.have.property('alive', false);
    });
    it('Should update the person\'s group and manage group after that the person is discharged', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person._id, group._id);
      await Person.manage(person._id, group._id);
      await Person.discharge(person._id);

      group = await OrganizationGroup.getOrganizationGroup(group._id, ['directMembers', 'directManagers']);
      group.directMembers.should.have.lengthOf(0);
      group.directManagers.should.have.lengthOf(0);
    });
    it('Should not get a "dead" person with the regular get', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await Person.discharge(person._id);

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
      person.rank = 'Skilled';
      person.responsibility = 'HR';
      person.responsibilityLocation = new ObjectId(dbIdExample[0]);

      const updatedPerson = await Person.updatePerson(person);
      should.exist(updatedPerson);

      expect(updatedPerson._id.toString() === person._id.toString()).to.be.ok;
      updatedPerson.should.have.property('firstName', person.firstName);
      updatedPerson.should.have.property('rank', person.rank);
      updatedPerson.should.have.property('job', person.job);
      updatedPerson.should.have.property('responsibility', person.responsibility);
      expect(updatedPerson.responsibilityLocation.toString() === person.responsibilityLocation.toString()).to.be.ok;
    });
    it('Should not delete the unchanged props', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      const updatedPerson = await Person.updatePerson(<IPerson>{ _id: person._id, firstName: 'Danny' });
      updatedPerson.should.have.property('lastName', 'Ron');
    });
    it('Should save the updated person correctly', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });

      person.job = 'Programmer';
      person.rank = 'Skilled';
      person.responsibility = 'SecurityOfficer';
      person.responsibilityLocation = new ObjectId(dbIdExample[0]);

      await Person.updatePerson(person);
      const updatedPerson = await Person.getPersonById(person._id);

      should.exist(updatedPerson);

      // Why can't I loop over the person's keys and values?? stupid typescript...

      expect(updatedPerson._id.toString() === person._id.toString()).to.be.ok;
      updatedPerson.should.have.property('firstName', person.firstName);
      updatedPerson.should.have.property('rank', person.rank);
      updatedPerson.should.have.property('job', person.job);
      updatedPerson.should.have.property('responsibility', person.responsibility);
      expect(updatedPerson.responsibilityLocation.toString() === person.responsibilityLocation.toString()).to.be.ok;
    });
  });
  describe('Person Staffing', () => {
    it('Should throw an error if the person does not exist', async () => {
      await expectError(Person.assign, [dbIdExample[0], dbIdExample[1]]);
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await expectError(Person.assign, [dbIdExample[0], group._id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await expectError(Person.assign, [person._id, dbIdExample[0]]);
    });
    it('Should assign person to group', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person._id, group._id);

      // Check in the person and group after the update
      person = await Person.getPersonById(person._id);
      group = await OrganizationGroup.getOrganizationGroup(group._id, ['directMembers']);
      should.exist(person);
      should.exist(group);
      expect(person.directGroup.toString() === group._id.toString()).to.be.ok;
      group.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group.directMembers[0])._id.toString() === person._id.toString()).to.be.ok;
    });
    it('Should transfer a person from another group if he was assigned to one before', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      let group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await Person.assign(person._id, group1._id);
      await Person.assign(person._id, group2._id);

      person = await Person.getPersonById(person._id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1._id, ['directMembers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2._id, ['directMembers']);

      group1.directMembers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group2.directMembers[0])._id.toString() === person._id.toString()).to.be.ok;
      expect(person.directGroup.toString() === group2._id.toString()).to.be.ok;
    });
  });
  describe('Appoint as a leaf', () => {
    it('Should throw an error if the person does not exist', async () => {
      await expectError(Person.manage, [dbIdExample[0], dbIdExample[1]]);
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await expectError(Person.manage, [dbIdExample[0], group._id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      await expectError(Person.manage, [person._id, dbIdExample[0]]);
    });
    it('Should appoint as a manager', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      await Person.assign(person._id, group._id);
      await Person.manage(person._id, group._id);

      // Check in the person and group after the update
      person = await Person.getPersonById(person._id);
      group = await OrganizationGroup.getOrganizationGroup(group._id, ['directMembers', 'directManagers']);

      should.exist(person);
      should.exist(group);
      expect(person.directGroup.toString() === group._id.toString()).to.be.ok;
      group.directMembers.should.have.lengthOf(1);
      expect((<IPerson>group.directMembers[0])._id.toString() === person._id.toString()).to.be.ok;
      group.directManagers.should.have.lengthOf(1);
      expect((<IPerson>group.directManagers[0])._id.toString() === person._id.toString()).to.be.ok;
    });
    it('Should not transfer if in another group', async () => {
      let person = await Person.createPerson(<IPerson>{ ...personExamples[0] });
      let group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      let group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await expectError(Person.manage, [person._id, group2._id]);
      await Person.assign(person._id, group1._id);
      await expectError(Person.manage, [person._id, group2._id]);

      person = await Person.getPersonById(person._id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1._id, ['directMembers', 'directManagers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2._id, ['directMembers', 'directManagers']);

      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
      expect((<IPerson>group1.directMembers[0])._id.toString() === person._id.toString()).to.be.ok;
      expect(person.directGroup.toString() === group1._id.toString()).to.be.ok;


      await Person.manage(person._id, group1._id);
      await expectError(Person.manage, [person._id, group2._id]);

      person = await Person.getPersonById(person._id);
      group1 = await OrganizationGroup.getOrganizationGroup(group1._id, ['directMembers', 'directManagers']);
      group2 = await OrganizationGroup.getOrganizationGroup(group2._id, ['directMembers', 'directManagers']);
      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(1);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
    });
  });

});

async function bigTree() {
  const seldag = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Seldag' });
  const ariandel = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Ariandel' });

  const parent_1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Sheep' });
  const parent_2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'A sheep' });
  const parent_3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'And a sheep' });

  const child_11 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 1.1' });
  const child_21 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 2.1' });
  const child_22 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 2.2' });
  const child_31 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 3.1' });
  const child_32 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 3.2' });
  const child_33 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 3.3' });

  await OrganizationGroup.childrenAdoption(seldag._id, [parent_1._id, parent_2._id, parent_3._id]);
  await OrganizationGroup.childrenAdoption(parent_1._id, [child_11._id]);
  await OrganizationGroup.childrenAdoption(parent_2._id, [child_21._id, child_22._id]);
  await OrganizationGroup.childrenAdoption(parent_3._id, [child_31._id, child_32._id, child_33._id]);

  const person_11 = await Person.createPerson(<IPerson>{
    identityCard: '000000011',
    personalNumber: '0000011',
    primaryDomainUser: 'person_11@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_12 = await Person.createPerson(<IPerson>{
    identityCard: '000000012',
    personalNumber: '0000012',
    primaryDomainUser: 'person_12@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_21 = await Person.createPerson(<IPerson>{
    identityCard: '000000021',
    personalNumber: '0000021',
    primaryDomainUser: 'person_21@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_111 = await Person.createPerson(<IPerson>{
    identityCard: '000000111',
    personalNumber: '0000111',
    primaryDomainUser: 'person_111@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_221 = await Person.createPerson(<IPerson>{
    identityCard: '000000221',
    personalNumber: '0000221',
    primaryDomainUser: 'person_221@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_311 = await Person.createPerson(<IPerson>{
    identityCard: '000000311',
    personalNumber: '0000311',
    primaryDomainUser: 'person_311@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_312 = await Person.createPerson(<IPerson>{
    identityCard: '000000312',
    personalNumber: '0000312',
    primaryDomainUser: 'person_312@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const person_331 = await Person.createPerson(<IPerson>{
    identityCard: '000000331',
    personalNumber: '0000331',
    primaryDomainUser: 'person_331@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });

  const friede = await Person.createPerson(<IPerson>{
    identityCard: '100000001',
    personalNumber: '1000001',
    primaryDomainUser: '100001@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });
  const gale = await Person.createPerson(<IPerson>{
    identityCard: '100000002',
    personalNumber: '1000002',
    primaryDomainUser: '1000002@surprise.sod',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
  });

  await Person.assign(person_11._id, parent_1._id);
  await Person.assign(person_12._id, parent_1._id);
  await Person.assign(person_21._id, parent_2._id);
  await Person.assign(person_111._id, child_11._id);
  await Person.assign(person_221._id, child_22._id);
  await Person.assign(person_311._id, child_31._id);
  await Person.assign(person_312._id, child_31._id);
  await Person.assign(person_331._id, child_33._id);

  await Person.assign(friede._id, ariandel._id);
  await Person.assign(gale._id, ariandel._id);

  return seldag;
}

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
