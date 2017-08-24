import * as chai from 'chai';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';
import { UserModel } from './user.model';
import { IUser } from './user.interface';
import { expectError } from '../helpers/spec.helper';


const should = chai.should();
chai.use(require('chai-http'));

const userExamples: Array<IUser> = [
    <IUser>{
        _id : '123456',
        firstName: 'Mazal',
        lastName: 'Tov'
    },
    <IUser>{
        _id : '234567',
        firstName: 'Avi',
        lastName: 'Ron',
        mail: 'avi.ron@gmail.com'
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
            user.hierarchy.should.be.an('array').with.length(0);
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
});