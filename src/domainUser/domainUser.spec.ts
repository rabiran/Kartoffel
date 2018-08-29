import * as chai from 'chai';
import { IDomainUser } from './domainUser.interface';
import { DomainUserController as Users } from './domainUser.controller';
import { expectError } from '../helpers/spec.helper';

const should = chai.should();
const expect = chai.expect;

const dbIdExample = ['5b50a76713ddf90af494de32'];

const userExample: IDomainUser = {
  name: 'fuckYou',
  domain: 'rabiran',
};

describe('DomainUsers', () => {
  describe('#createDomainUser', () => {
    it('should create domain user', async () => {
      const user = await Users.create(userExample);
      user.should.have.property('name', userExample.name);
      user.should.have.property('domain', userExample.domain);
      user.should.have.property('fullString', `${userExample.name}@${userExample.domain}`);
    });

    it('should throw an error when creating existing user', async () => {
      const sameUser = {
        name: 'fuckYou',
        domain: 'rabiran',
      };
      await Users.create(userExample);
      await expectError(Users.create, [sameUser]);
    });
  });
  describe('#getAll', () => {
    it('should get all the users');
  });
  describe('#getById', () => {
    it('should get the specified user by its ID');
  });
  describe('#delete', () => {
    it('should delete the specified user');
  });
});
