import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';
import { UserModel } from './user.model';
import { KartoffelModel } from '../group/kartoffel/kartoffel.model';
import { IUser } from './user.interface';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { Kartoffel } from '../group/kartoffel/kartoffel.controller';
import { expectError } from '../helpers/spec.helper';
import { ObjectId } from 'mongodb';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));

const dbIdExample = ['5b50a76713ddf90af494de32', '5b56e5ca07f0de0f38110b9c'];

const userExamples: IUser[] = [
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
];

beforeEach(async () => {
  UserModel.remove({}, (err) => { });
  KartoffelModel.remove({}, (err) => { });
});

describe('Users', () => {
  describe('#getUsers', () => {
    it('Should be empty if there are no users', async () => {
      const users = await User.getUsers();
      users.should.be.a('array');
      users.should.have.lengthOf(0);
    });
    it('Should get all the users', async () => {
      await User.createUser(<IUser>{ ...userExamples[0] });

      let users = await User.getUsers();
      users.should.be.a('array');
      users.should.have.lengthOf(1);
      should.exist(users[0]);
      users[0].should.have.property('personalNumber', '2345671');


      await User.createUser(<IUser>{ ...userExamples[1] });
      await User.createUser(<IUser>{ ...userExamples[2] });

      users = await User.getUsers();
      users.should.be.a('array');
      users.should.have.lengthOf(3);
      users[0].should.have.property('firstName', 'Avi');
      users[1].should.exist;
      users[2].should.have.property('lastName', 'Kopter');
    });
  });
  describe('#get updated users a from given date', () => {
    it('Should get the current users', async () => {
      const clock = sinon.useFakeTimers();
      await User.createUser(<IUser>{ ...userExamples[0] });
      clock.tick(1000);
      const from = new Date();
      clock.tick(1000);
      await User.createUser(<IUser>{ ...userExamples[1] });
      await User.createUser(<IUser>{ ...userExamples[2] });
      clock.tick(1000);
      const to = new Date();
      clock.tick(1000);
      await User.createUser(<IUser>{ ...userExamples[3] });
      const users = await User.getUpdatedFrom(from, to);
      clock.restore();

      should.exist(users);
      users.should.have.lengthOf(2);
      users[0].should.have.property('personalNumber', '3456712');
      users[1].should.have.property('personalNumber', '4567123');

    });
  });
  describe('#createUser', () => {
    it('Should create a user with basic info', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[4] });
      should.exist(user);
      user.should.have.property('identityCard', '567891234');
      user.should.have.property('personalNumber', '1234567');
      user.should.have.property('primaryUser', 'yonatantal@development.sod');
      user.should.have.property('firstName', 'Yonatan');
      user.should.have.property('lastName', 'Tal');
      user.should.have.property('dischargeDay', userExamples[4].dischargeDay);
      user.should.have.property('hierarchy');
      user.hierarchy.should.have.ordered.members(['www', 'microsoft', 'github']);
      user.should.have.property('job', 'Programmer');
      user.should.have.property('rank', 'Newbie');
      user.should.have.property('responsibility', 'None');
      user.should.have.property('clearance', '0');
      user.should.have.property('alive', true);
    });
    it('Should create a user with more info', async () => {
      const newUser = <IUser>{
        ...userExamples[4],
        secondaryUsers: ['yonatantal@programer.sod', 'yonatantal@special.sod'],
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

      const user = await User.createUser(newUser);
      should.exist(user);
      user.should.have.property('identityCard', newUser.identityCard);
      user.should.have.property('personalNumber', newUser.personalNumber);
      user.should.have.property('primaryUser', newUser.primaryUser);
      user.should.have.property('secondaryUsers');
      user.secondaryUsers.should.have.members(newUser.secondaryUsers);
      user.should.have.property('serviceType', newUser.serviceType);
      user.should.have.property('firstName', newUser.firstName);
      user.should.have.property('lastName', newUser.lastName);
      user.should.have.property('currentUnit', newUser.currentUnit);
      user.should.have.property('dischargeDay', newUser.dischargeDay);
      user.should.have.property('hierarchy');
      user.hierarchy.should.have.ordered.members(newUser.hierarchy);
      user.should.have.property('job', newUser.job);
      user.should.have.property('mail', newUser.mail);
      user.should.have.property('phone');
      user.phone.should.have.members(newUser.phone);
      user.should.have.property('mobilePhone');
      user.mobilePhone.should.have.members(newUser.mobilePhone);
      user.should.have.property('rank', newUser.rank);
      user.should.have.property('address', newUser.address);
      user.should.have.property('responsibility', newUser.responsibility);
      user.should.have.property('clearance', newUser.clearance);
      user.should.have.property('alive', newUser.alive);
    });

    describe('User validation', () => {
      it('Should throw an error when User is undefined', async () => {
        await expectError(User.createUser, [undefined]);
      });
      it('Should throw an error when mandatory fields are missing', async () => {
        let user = { ...userExamples[1] };
        delete user.identityCard;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        user.personalNumber = '';
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.primaryUser;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.firstName;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.lastName;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.dischargeDay;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.hierarchy;
        await expectError(User.createUser, [user]);
        user = { ...userExamples[1] };
        delete user.job;
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when Identity Card is not valid', async () => {
        const user = { ...userExamples[1] };
        user.identityCard = '1234567890';
        await expectError(User.createUser, [user]);
        user.identityCard = '12345678a';
        await expectError(User.createUser, [user]);
        user.identityCard = '12345';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when personal number is not valid', async () => {
        const user = { ...userExamples[1] };
        user.personalNumber = '234567103';
        await expectError(User.createUser, [user]);
        user.personalNumber = '23456';
        await expectError(User.createUser, [user]);
        user.personalNumber = '234a567';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when primary user is not valid', async () => {
        const user = { ...userExamples[1] };
        user.primaryUser = 'aviron@secure.';
        await expectError(User.createUser, [user]);
        user.primaryUser = 'avironsecure.sod';
        await expectError(User.createUser, [user]);
        user.primaryUser = 'aviron@securesod';
        await expectError(User.createUser, [user]);
        user.primaryUser = '@secure.sod'; 
        await expectError(User.createUser, [user]);
        user.primaryUser = 'aviron@.sod';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when secondary users is not valid', async () => {
        const user = { ...userExamples[1] };
        user.secondaryUsers = ['avi@secure.sod', 'ron@.sod'];
        await expectError(User.createUser, [user]);
        user.secondaryUsers = ['@secure.sod', 'ron@secure.sod'];
        await expectError(User.createUser, [user]);
        user.secondaryUsers = ['avi@secure.sod', 'ron@secure'];
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when Name strings are empty', async () => {
        const user =  { ...userExamples[1] };
        user.firstName = '';
        await expectError(User.createUser, [user]);
        user.firstName = 'Avi';
        user.lastName = '';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when hierarchy are empty', async () => {
        const user = { ...userExamples[1] };
        user.hierarchy = [];
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when job is empty', async () => {
        const user = { ...userExamples[1] };
        user.job = '';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when responsibility is not valid', async () => {
        const user = { ...userExamples[1] };
        user.responsibility = 'HR';
        await expectError(User.createUser, [user]);
        user.responsibility = 'None';
        user.responsibilityLocation = new ObjectId();
        await expectError(User.createUser, [user]);
        delete user.responsibility;
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when mail string is invalid', async () => {
        const user = { ...userExamples[1] };
        user.mail = '@gmail.com';
        await expectError(User.createUser, [user]);
        user.mail = 'aviron@.com';
        await expectError(User.createUser, [user]);
        user.mail = 'avirongmail.com';
        await expectError(User.createUser, [user]);
        user.mail = 'aviron@gmailcom';
        await expectError(User.createUser, [user]);
        user.mail = 'aviron@.com';
        await expectError(User.createUser, [user]);
        user.mail = 'aviron@gmail.';
        await expectError(User.createUser, [user]);
      }); 
      it('Should throw an error when Phone is invalid', async () => {
        const user = { ...userExamples[1] };
        user.phone = ['BlaBla'];
        await expectError(User.createUser, [user]);
        user.phone = ['0212345678'];
        await expectError(User.createUser, [user]);
        user.phone = ['02-123645678'];
        await expectError(User.createUser, [user]);
        user.phone = ['0212-364567'];
        await expectError(User.createUser, [user]);
        user.phone = ['02-36456'];
        await expectError(User.createUser, [user]);
        user.phone = ['12364564'];
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when Mobile Phone is invalid', async () => {
        const user = { ...userExamples[1] };
        user.mobilePhone = ['BlaBla'];
        await expectError(User.createUser, [user]);
        user.mobilePhone = ['05412345678'];
        await expectError(User.createUser, [user]);
        user.mobilePhone = ['054-12345678'];
        await expectError(User.createUser, [user]);
        user.mobilePhone = ['054-123456'];
        await expectError(User.createUser, [user]);
        user.mobilePhone = ['0236456789'];
        await expectError(User.createUser, [user]);
        user.mobilePhone = ['1523645678'];
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when clearance is invalid', async () => {
        const user = { ...userExamples[1] };
        user.clearance = '-2';
        await expectError(User.createUser, [user]);
        user.clearance = '11';
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when existed identity card is given', async () => {
        await User.createUser(<IUser>{ ...userExamples[1] });
        const user = { ...userExamples[3] };
        user.identityCard = userExamples[1].identityCard;
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when existed personal number is given', async () => {
        await User.createUser(<IUser>{ ...userExamples[1] });
        const user = { ...userExamples[3] };
        user.personalNumber = userExamples[1].personalNumber;
        await expectError(User.createUser, [user]);
      });
      it('Should throw an error when existed primary user is given', async () => {
        await User.createUser(<IUser>{ ...userExamples[1] });
        const user = { ...userExamples[3] };
        user.primaryUser = userExamples[1].primaryUser;
        await expectError(User.createUser, [user]);
      });
    });
  });

  describe('#getUser', () => {
    it('Should throw an error when there is no matching user', async () => {
      await expectError(User.getUser, [dbIdExample[0]]);
    });
    it('Should find user when one exists', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      const returnedUser = await User.getUser(user._id);
      should.exist(returnedUser);
      user.should.have.property('identityCard', '123456789');
      user.should.have.property('firstName', 'Avi');
    });
  });
  describe('#removeUser', () => {
    it('Should throw an error when there is no user to remove', async () => {
      await expectError(User.removeUser, [dbIdExample[0]]);
    });
    it('Should remove a user successfully if existed', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      const res = await User.removeUser(user._id);
      should.exist(res);
      res.should.have.property('ok', 1);
      res.should.have.property('n', 1);
      await expectError(User.getUser, [user._id]);
    });
    it('Should update the user\'s group after that the user is removed', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await User.assign(user._id, group._id);

      group = await Kartoffel.getKartoffel(group._id, ['directMembers']);
      group.directMembers.should.have.lengthOf(1);

      await User.removeUser(user._id);

      group = await Kartoffel.getKartoffel(group._id, ['directMembers']);
      group.directMembers.should.have.lengthOf(0);
    });
  });
  describe('#discharge', () => {
    it('Should throw an error when there is no user to discharge', async () => {
      await expectError(User.discharge, [dbIdExample[0]]);
    });
    it('Should discharge a user successfully if existed', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      const res = await User.discharge(user._id);
      should.exist(res);
      res.should.have.property('alive', false);
    });
    it('Should update the user\'s group and manage group after that the user is discharged', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await User.assign(user._id, group._id);
      await User.manage(user._id, group._id);
      await User.discharge(user._id);

      group = await Kartoffel.getKartoffel(group._id, ['directMembers', 'directManagers']);
      group.directMembers.should.have.lengthOf(0);
      group.directManagers.should.have.lengthOf(0);
    });
    it('Should not get a "dead" user with the regular get', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      await User.discharge(user._id);

      const users = await User.getUsers();
      users.should.have.lengthOf(0);
    });
  });
  describe('#updateUser', () => {
    it('Should throw an error when the user does not exist', async () => {
      await expectError(User.updateUser, [{ ...userExamples[0] }]);
    });
    it('Should throw an error when updated data isn\'t valid', async () => {
      const user = <IUser>{ ...userExamples[0] };
      await User.createUser(user);

      user.firstName = '';

      await expectError(User.updateUser, [user]);
    });
    it('Should return the updated user', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });

      user.job = 'Programmer';
      user.rank = 'Skilled';
      user.responsibility = 'HR';
      user.responsibilityLocation = new ObjectId(dbIdExample[0]); 

      const updatedUser = await User.updateUser(user);
      should.exist(updatedUser);

      expect(updatedUser._id.toString() === user._id.toString()).to.be.ok;
      updatedUser.should.have.property('firstName', user.firstName);
      updatedUser.should.have.property('rank', user.rank);
      updatedUser.should.have.property('job', user.job);
      updatedUser.should.have.property('responsibility', user.responsibility);
      expect(updatedUser.responsibilityLocation.toString() === user.responsibilityLocation.toString()).to.be.ok;
    });
    it('Should not delete the unchanged props', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      const updatedUser = await User.updateUser(<IUser>{ _id: user._id, firstName: 'Danny' });
      updatedUser.should.have.property('lastName', 'Ron');
    });
    it('Should save the updated user correctly', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });

      user.job = 'Programmer';
      user.rank = 'Skilled';
      user.responsibility = 'SecurityOfficer';
      user.responsibilityLocation = new ObjectId(dbIdExample[0]); 

      await User.updateUser(user);
      const updatedUser = await User.getUser(user._id);

      should.exist(updatedUser);

      // Why can't I loop over the user's keys and values?? stupid typescript...

      expect(updatedUser._id.toString() === user._id.toString()).to.be.ok;
      updatedUser.should.have.property('firstName', user.firstName);
      updatedUser.should.have.property('rank', user.rank);
      updatedUser.should.have.property('job', user.job);
      updatedUser.should.have.property('responsibility', user.responsibility);
      expect(updatedUser.responsibilityLocation.toString() === user.responsibilityLocation.toString()).to.be.ok;
    });
  });
  describe('User Staffing', () => {
    it('Should throw an error if the user does not exist', async () => {
      await expectError(User.assign, [dbIdExample[0], dbIdExample[1]]);
      const group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await expectError(User.assign, [dbIdExample[0], group._id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      await expectError(User.assign, [user._id, dbIdExample[0]]);
    });
    it('Should assign user to group', async () => {
      let user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await User.assign(user._id, group._id);

      // Check in the user and group after the update
      user = await User.getUser(user._id);
      group = await Kartoffel.getKartoffel(group._id, ['directMembers']);
      should.exist(user);
      should.exist(group);
      expect(user.directGroup.toString() === group._id.toString()).to.be.ok;
      group.directMembers.should.have.lengthOf(1);
      expect(group.directMembers[0]._id.toString() === user._id.toString()).to.be.ok;
      (group.admins == null).should.be.true;
    });
    it('Should transfer a user from another group if he was assigned to one before', async () => {
      let user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group1 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group1' });
      let group2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group2' });
      await User.assign(user._id, group1._id);
      await User.assign(user._id, group2._id);

      user = await User.getUser(user._id);
      group1 = await Kartoffel.getKartoffel(group1._id, ['directMembers']);
      group2 = await Kartoffel.getKartoffel(group2._id, ['directMembers']);

      group1.directMembers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(1);
      expect(group2.directMembers[0]._id.toString() === user._id.toString()).to.be.ok;
      expect(user.directGroup.toString() === group2._id.toString()).to.be.ok;
    });
  });
  describe('Appoint as a leaf', () => {
    it('Should throw an error if the user does not exist', async () => {
      await expectError(User.manage, [dbIdExample[0], dbIdExample[1]]);
      const group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await expectError(User.manage, [dbIdExample[0], group._id]);
    });
    it('Should throw an error if the group does not exist', async () => {
      const user = await User.createUser(<IUser>{ ...userExamples[0] });
      await expectError(User.manage, [user._id, dbIdExample[0]]);
    });
    it('Should appoint as a manager', async () => {
      let user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group' });
      await User.assign(user._id, group._id);
      await User.manage(user._id, group._id);

      // Check in the user and group after the update
      user = await User.getUser(user._id);
      group = await Kartoffel.getKartoffel(group._id, ['directMembers', 'directManagers']);

      should.exist(user);
      should.exist(group);
      expect(user.directGroup.toString() === group._id.toString()).to.be.ok;
      group.directMembers.should.have.lengthOf(1);
      expect(group.directMembers[0]._id.toString() === user._id.toString()).to.be.ok;
      group.directManagers.should.have.lengthOf(1);
      expect(group.directManagers[0]._id.toString() === user._id.toString()).to.be.ok;
    });
    it('Should not transfer if in another group', async () => {
      let user = await User.createUser(<IUser>{ ...userExamples[0] });
      let group1 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group1' });
      let group2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group2' });
      await expectError(User.manage, [user._id, group2._id]);
      await User.assign(user._id, group1._id);
      await expectError(User.manage, [user._id, group2._id]);

      user = await User.getUser(user._id);
      group1 = await Kartoffel.getKartoffel(group1._id, ['directMembers', 'directManagers']);
      group2 = await Kartoffel.getKartoffel(group2._id, ['directMembers', 'directManagers']);

      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(0);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
      expect(group1.directMembers[0]._id.toString() === user._id.toString()).to.be.ok;
      expect(user.directGroup.toString() === group1._id.toString()).to.be.ok;


      await User.manage(user._id, group1._id);
      await expectError(User.manage, [user._id, group2._id]);

      user = await User.getUser(user._id);
      group1 = await Kartoffel.getKartoffel(group1._id, ['directMembers', 'directManagers']);
      group2 = await Kartoffel.getKartoffel(group2._id, ['directMembers', 'directManagers']);
      group1.directMembers.should.have.lengthOf(1);
      group1.directManagers.should.have.lengthOf(1);
      group2.directMembers.should.have.lengthOf(0);
      group2.directManagers.should.have.lengthOf(0);
    });
  });

});

async function bigTree() {
  const seldag = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Seldag' });
  const ariandel = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Ariandel' });

  const parent_1 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Sheep' });
  const parent_2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'A sheep' });
  const parent_3 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'And a sheep' });

  const child_11 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 1.1' });
  const child_21 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 2.1' });
  const child_22 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 2.2' });
  const child_31 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 3.1' });
  const child_32 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 3.2' });
  const child_33 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 3.3' });

  await Kartoffel.childrenAdoption(seldag._id, [parent_1._id, parent_2._id, parent_3._id]);
  await Kartoffel.childrenAdoption(parent_1._id, [child_11._id]);
  await Kartoffel.childrenAdoption(parent_2._id, [child_21._id, child_22._id]);
  await Kartoffel.childrenAdoption(parent_3._id, [child_31._id, child_32._id, child_33._id]);

  const user_11 = await User.createUser(<IUser>{ _id: '0000011', firstName: 'A', lastName: 'A' });
  const user_12 = await User.createUser(<IUser>{ _id: '0000012', firstName: 'B', lastName: 'A' });
  const user_21 = await User.createUser(<IUser>{ _id: '0000021', firstName: 'A', lastName: 'B' });
  const user_111 = await User.createUser(<IUser>{ _id: '0000111', firstName: 'A', lastName: 'AA' });
  const user_221 = await User.createUser(<IUser>{ _id: '0000221', firstName: 'A', lastName: 'BB' });
  const user_311 = await User.createUser(<IUser>{ _id: '0000311', firstName: 'A', lastName: 'CA' });
  const user_312 = await User.createUser(<IUser>{ _id: '0000312', firstName: 'B', lastName: 'CA' });
  const user_331 = await User.createUser(<IUser>{ _id: '0000331', firstName: 'A', lastName: 'CC' });

  const friede = await User.createUser(<IUser>{ _id: '1000001', firstName: 'Sister', lastName: 'Friede' });
  const gale = await User.createUser(<IUser>{ _id: '1000002', firstName: 'Uncle', lastName: 'Gale' });

  await User.assign(user_11._id, parent_1._id);
  await User.assign(user_12._id, parent_1._id);
  await User.assign(user_21._id, parent_2._id);
  await User.assign(user_111._id, child_11._id);
  await User.assign(user_221._id, child_22._id);
  await User.assign(user_311._id, child_31._id);
  await User.assign(user_312._id, child_31._id);
  await User.assign(user_331._id, child_33._id);

  await User.assign(friede._id, ariandel._id);
  await User.assign(gale._id, ariandel._id);

  return seldag;
}

async function printTreeHeavy(sourceID: string, deep = 0) {
  const source = await Kartoffel.getKartoffelOld(sourceID);
  let pre = '';
  for (let i = 0; i < deep; i++) {
    pre += '  ';
  }
  console.log(pre + source.name);
  const children = source.children;
  if (children.length === 0) return;
  for (const child of children) await printTreeHeavy(<string>child, deep + 1);
}
