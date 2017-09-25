import * as chai from 'chai';
import * as sinon from 'sinon';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';
import { UserModel } from './user.model';
import { IUser } from './user.interface';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { Kartoffel } from '../group/kartoffel/kartoffel.controller';
import { expectError } from '../helpers/spec.helper';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));

const DB_ID_EXAMPLE = '59a56d577bedba18504298df';

const userExamples: Array<IUser> = [
    <IUser>{
        _id : '1234567',
        firstName: 'Avi',
        lastName: 'Ron',
        mail: 'avi.ron@gmail.com'
    },
    <IUser>{
        _id : '234567',
        firstName: 'Mazal',
        lastName: 'Tov'
    },
    <IUser>{
        _id : '345678',
        firstName: 'Eli',
        lastName: 'Kopter',
        isSecurityOfficer: true,
        clearance: 3,
        rank: 'Skillful'
    },
    <IUser>{
        _id : '456789',
        firstName: 'Tiki',
        lastName: 'Poor'
    }
];

before(async () => {
    UserModel.remove({}, (err) => {});
});

describe('Users', () => {
    describe('#getUsers', () => {
        it('Should be empty if there are no users', async () => {
            const users = await User.getUsers();
            users.should.be.a('array');
            users.should.have.lengthOf(0);
        });
        it('Should get all the users', async () => {
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Yonatan', lastName: 'Tal'});

            let users = await User.getUsers();
            users.should.be.a('array');
            users.should.have.lengthOf(1);
            should.exist(users[0]);
            users[0].should.have.property('id', '1234567');


            await User.createUser(<IUser>{_id : '2345678', firstName: 'Avi', lastName: 'Ron'});
            await User.createUser(<IUser>{_id : '3456789', firstName: 'Bar', lastName: 'Nir'});

            users = await User.getUsers();
            users.should.be.a('array');
            users.should.have.lengthOf(3);
            users[0].should.have.property('firstName', 'Yonatan');
            users[1].should.exist;
            users[2].should.have.property('lastName', 'Nir');
        });
    });
    describe('#get updated users a from given date', () => {
        it('Should throw an error when date is undefined', async() => {
            expectError(User.getUpdatedFrom, []);
        });
        it('Should get the current users', async () => {
            const clock = sinon.useFakeTimers();
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
            clock.tick(1000);
            const from = new Date();
            clock.tick(1000);
            await User.createUser(<IUser>{_id : '2345678', firstName: 'Eli', lastName: 'Kopter'});
            await User.createUser(<IUser>{_id : '3456789', firstName: 'Tiki', lastName: 'Poor'});
            clock.tick(1000);
            const to = new Date();
            clock.tick(1000);
            await User.createUser(<IUser>{_id : '4567890', firstName: 'Yafa', lastName: 'Lula'});
            const users = await User.getUpdatedFrom(from, to);
            console.log(users, from, to);
            clock.restore();

            users.should.exist;
            users.should.have.lengthOf(2);
            users[0].should.have.property('_id', '2345678');
            users[1].should.have.property('_id', '3456789');

        });
    });
    describe('#createUser', () => {
        it('Should create a user with basic info', async () => {
            const user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Yonatan', lastName: 'Tal'});
            user.should.exist;
            user.should.have.property('_id', '1234567');
            user.should.have.property('firstName', 'Yonatan');
            user.should.have.property('lastName', 'Tal');
            user.should.have.property('rank', 'Newbie');
            user.should.have.property('isSecurityOfficer', false);
            user.should.have.property('clearance', 0);
            user.weakGroups.should.be.an('array').with.length(0);
        });
        it('Should create a user with more info', async () => {
            const newUser = <IUser>{
                _id : '1234567',
                firstName: 'Yonatan',
                lastName: 'Tal',
                job: 'Programmer',
                mail: 'yonatan@work.com',
                phone: '0123456789',
                rank: 'Skillful',
                address: 'I live here',
                isSecurityOfficer: true,
                clearance: 5
            };

            const user = await User.createUser(newUser);
            user.should.exist;
            user.should.have.property('_id', newUser._id);
            user.should.have.property('firstName', newUser.firstName);
            user.should.have.property('lastName', newUser.lastName);
            user.should.have.property('job', newUser.job);
            user.should.have.property('mail', newUser.mail);
            user.should.have.property('phone', newUser.phone);
            user.should.have.property('rank', newUser.rank);
            user.should.have.property('address', newUser.address);
            user.should.have.property('isSecurityOfficer', newUser.isSecurityOfficer);
            user.should.have.property('clearance', newUser.clearance);
        });
        describe('User validation', () => {
            it('Should throw an error when User is undefined', async () => {
                await expectError(User.createUser, [undefined]);
            });
            it('Should throw an error when mandatory fields are missing', async () => {
                await expectError(User.createUser, [<IUser>{_id : '1234567'}]);
                await expectError(User.createUser, [<IUser>{firstName: 'Yonatan', lastName: 'Tal'}]);
                await expectError(User.createUser, [<IUser>{_id : '1234567', firstName: '', lastName: ''}]);
                await expectError(User.createUser, [<IUser>{_id : '', firstName: 'Yonatan', lastName: 'Tal'}]);
            });
            it('Should throw an error when ID is not valid', async () => {
                await expectError(User.createUser, [<IUser>{_id: '', firstName: 'Avi', lastName: 'Ron'}]);
                await expectError(User.createUser, [<IUser>{_id: '123456t', firstName: 'Avi', lastName: 'Ron'}]);
                await expectError(User.createUser, [<IUser>{_id: '123456', firstName: 'Avi', lastName: 'Ron'}]);
            });
            it('Should throw an error when Name strings are empty', async () => {
                await expectError(User.createUser, [<IUser>{_id: '1234567', firstName: '', lastName: 'Ron'}]);
                await expectError(User.createUser, [<IUser>{_id: '1234567', firstName: 'Avi', lastName: ''}]);
            });
            it('Should throw an error when existed ID is given', async () => {
                await User.createUser(<IUser>{_id: '1234567', firstName: 'Yonatan', lastName: 'Tal'});
                await expectError(User.createUser, [<IUser>{_id: '1234567', firstName: 'Avi', lastName: 'Ron'}]);
            });
        });
    });
    describe('#getUser', () => {
        it('Should throw an error when there is no matching user', async () => {
            const user = await User.getUser('1234567');
            should.not.exist(user);
        });
        it('Should find user when one exists', async () => {
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
            const user = await User.getUser('1234567');
            user.should.exist;
            user.should.have.property('_id', '1234567');
            user.should.have.property('firstName', 'Avi');
        });
    });
    describe('#removeUser', () => {
        it('Should throw an error when there is no user to remove', async () => {
            const res = await User.removeUser('1234567');
            res.should.exist;
            res.should.have.property('ok', 1);
            res.should.have.property('n', 0);
        });
        it('Should remove a user successfully if existed', async () => {
            await User.createUser(userExamples[0]);
            const res = await User.removeUser('1234567');
            res.should.exist;
            res.should.have.property('ok', 1);
            res.should.have.property('n', 1);
            const user = await User.getUser('1234567');
            should.not.exist(user);
        });
        it('Should update the user\'s group after that the user is removed', async () => {
            const user = await User.createUser(userExamples[0]);
            let group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group'});
            await User.assign(user._id, group._id);
            await User.removeUser(user._id);

            group = await Kartoffel.getKartoffel(group._id);
            group.members.should.have.lengthOf(0);
        });
    });
    describe('#updateUser', () => {
        it('Should throw an error when the user does not exist', async () => {
           await expectError(User.updateUser, [userExamples[0]]);
        });
        it('Should throw an error when updated data isn\'t valid', async () => {
            const user = userExamples[0];
            await User.createUser(user);

            user.firstName = '';

            await expectError(User.updateUser, [user]);
        });
        it('Should return the updated user', async () => {
            const user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});

            user.job = 'Programmer';
            user.rank = 'Skilled';
            user.isSecurityOfficer = true;

            const updatedUser = await User.updateUser(user);
            updatedUser.should.exist;

            // Why can't I loop over the user's keys and values?? stupid typescript...

            updatedUser.should.have.property('_id', user._id);
            updatedUser.should.have.property('firstName', user.firstName);
            updatedUser.should.have.property('rank', user.rank);
            updatedUser.should.have.property('job', user.job);
            updatedUser.should.have.property('isSecurityOfficer', user.isSecurityOfficer);
        });
        it('Should not delete the unchanged props', async () => {
            await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
            const updatedUser = await User.updateUser(<IUser>{_id: '1234567', firstName: 'Danny'});
            updatedUser.should.have.property('lastName', 'Ron');
        });
        it('Should save the updated user correctly', async () => {
            const user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});

            user.job = 'Programmer';
            user.rank = 'Skilled';
            user.isSecurityOfficer = true;

            await User.updateUser(user);
            const updatedUser = await User.getUser(user._id);

            updatedUser.should.exist;

            // Why can't I loop over the user's keys and values?? stupid typescript...

            updatedUser.should.have.property('_id', user._id);
            updatedUser.should.have.property('firstName', user.firstName);
            updatedUser.should.have.property('rank', user.rank);
            updatedUser.should.have.property('job', user.job);
            updatedUser.should.have.property('isSecurityOfficer', user.isSecurityOfficer);
        });
        describe('User Staffing', () => {
            it('Should throw an error if the user does not exist', async () => {
                await expectError(User.assign, ['1234567', DB_ID_EXAMPLE]);
                const group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group'});
                await expectError(User.assign, ['1234567', group._id]);
            });
            it('Should throw an error if the group does not exist', async () => {
                const user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                await expectError(User.assign, [user._id, DB_ID_EXAMPLE]);
            });
            it('Should assign user to group', async () => {
                let user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                let group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group'});
                await User.assign(user._id, group._id);

                // Check in the user and group after the update
                user = await User.getUser(user._id);
                group = await Kartoffel.getKartoffel(group._id);
                user.should.exist;
                group.should.exist;
                expect(user.directGroup.toString() == group._id.toString());
                group.members.should.have.lengthOf(1);
                expect(group.members[0].toString() == user._id.toString());
                group.admins.should.have.lengthOf(0);
            });
            it('Should transfer a user from another group if he was assigned to one before', async() => {
                let user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                let group1 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group1'});
                let group2 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group2'});
                await User.assign(user._id, group1._id);
                await User.assign(user._id, group2._id);

                user = await User.getUser(user._id);
                group1 = await Kartoffel.getKartoffel(group1._id);
                group2 = await Kartoffel.getKartoffel(group2._id);

                group1.members.should.have.lengthOf(0);
                group2.members.should.have.lengthOf(1);
                expect(group2.members[0].toString() == user._id.toString());
                expect(user.directGroup.toString() == group2._id.toString());
            });
        });
        describe('Appoint as a leaf', () => {
            it('Should throw an error if the user does not exist', async () => {
                await expectError(User.manage, ['1234567', DB_ID_EXAMPLE]);
                const group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group'});
                await expectError(User.manage, ['1234567', group._id]);
            });
            it('Should throw an error if the group does not exist', async () => {
                const user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                await expectError(User.manage, [user._id, DB_ID_EXAMPLE]);
            });
            it('Should appoint as a manager', async () => {
                let user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                let group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group'});
                await User.manage(user._id, group._id);

                // Check in the user and group after the update
                user = await User.getUser(user._id);
                group = await Kartoffel.getKartoffel(group._id);
                user.should.exist;
                group.should.exist;
                expect(user.directGroup.toString() == group._id.toString());
                group.members.should.have.lengthOf(1);
                expect(group.members[0].toString() == user._id.toString());
                group.admins.should.have.lengthOf(1);
                expect(group.admins[0].toString() == user._id.toString());
            });
            it('Should transfer if was assign before', async() => {
                let user = await User.createUser(<IUser>{_id : '1234567', firstName: 'Avi', lastName: 'Ron'});
                let group1 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group1'});
                let group2 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group2'});
                let group3 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group3'});
                await User.assign(user._id, group1._id);
                await User.manage(user._id, group2._id);

                user = await User.getUser(user._id);
                group1 = await Kartoffel.getKartoffel(group1._id);
                group2 = await Kartoffel.getKartoffel(group2._id);

                group1.members.should.have.lengthOf(0);
                group1.admins.should.have.lengthOf(0);
                group2.members.should.have.lengthOf(1);
                group2.admins.should.have.lengthOf(1);
                expect(group2.members[0].toString() == user._id.toString());
                expect(group2.admins[0].toString() == user._id.toString());
                expect(user.directGroup.toString() == group2._id.toString());

                await User.manage(user._id, group3._id);
                user = await User.getUser(user._id);
                group2 = await Kartoffel.getKartoffel(group2._id);
                group3 = await Kartoffel.getKartoffel(group3._id);

                group2.members.should.have.lengthOf(0);
                group2.admins.should.have.lengthOf(0);
                group3.members.should.have.lengthOf(1);
                group3.admins.should.have.lengthOf(1);
                expect(group3.members[0].toString() == user._id.toString());
                expect(group3.admins[0].toString() == user._id.toString());
                expect(user.directGroup.toString() == group2._id.toString());
            });
        });
    });
});