import * as chai from 'chai';
import { IDomainUser } from './domainUser.interface';
import { DomainUserController as Users } from './domainUser.controller';
import { expectError } from '../helpers/spec.helper';
import { userFromString } from './domainUser.utils';
import { DOMAIN_MAP } from '../config/db-enums';


const should = chai.should();
const expect = chai.expect;

const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));
const dbIdExample = ['5b50a76713ddf90af494de32'];

const userExample: IDomainUser = {
  name: 'elad',
  domain: [...domainMap.keys()][0],
};


describe('DomainUsers', () => {
  describe('#createDomainUser', () => {
    it('should create domain user', async () => {
      const user = await Users.create(userExample);
      user.should.exist;
      user.should.have.property('id');
      user.should.have.property('name', userExample.name);
      user.should.have.property('domain', userExample.domain);
      user.should.have.property('uniqueID', `${userExample.name}@${userExample.domain}`);
      user.should.have.property('adfsUID', `${userExample.name}@${domainMap.get(userExample.domain)}`);
    });

    it('should throw an error when creating an existing user', async () => {
      const sameUser = {
        name: 'elad',
        domain: 'rabiran',
      };
      await Users.create(userExample);
      await expectError(Users.create, [sameUser]);
    });

    it('should create the user from the string representation', async () => {
      const name = 'someuser123', domain = [...domainMap.keys()][1];
      const userString = `${name}@${domain}`;
      const userObj = userFromString(userString);
      userObj.should.have.property('name', name);
      userObj.should.have.property('domain', domain);
      const user = await Users.create(userObj);
      user.should.exist;
      user.should.have.property('name', name);
      user.should.have.property('domain', domain);
      user.should.have.property('uniqueID', userString);
      user.should.have.property('adfsUID', `${name}@${domainMap.get(domain)}`);
      user.should.have.property('id');
    });

    it('should throw an error when trying to construct user object fron illegal string', () => {
      const illegalString1 = 'withoutSeperator', illegalString2 = 'two@shit@seperators',
        illegalString3 = '@noName', illegalString4 = 'noDomain@';
      expect(userFromString.bind(null, illegalString1)).to.throw();
      expect(userFromString.bind(null, illegalString2)).to.throw();
      expect(userFromString.bind(null, illegalString3)).to.throw();
      expect(userFromString.bind(null, illegalString4)).to.throw();
    });

  });

  describe('#getAll', () => {
    it('should be empty when there are no users', async () => {
      const users = await Users.getAll();
      users.should.be.an('array');
      users.should.have.lengthOf(0);
    });

    it('should get all the users', async () => {
      await Users.create(userExample);
      const users = await Users.getAll();
      users.should.be.an('array');
      users.should.have.lengthOf(1);
    });
  });

  describe('#getById', () => {
    it('should get the specified user by its ID', async () => {
      const createdUser = await Users.create(userExample);
      const user = await Users.getById(createdUser.id);
      user.should.have.property('name', createdUser.name);
      user.should.have.property('domain', createdUser.domain);
      user.should.have.property('uniqueID', `${createdUser.name}@${createdUser.domain}`);
      user.should.have.property('adfsUID', `${createdUser.name}@${domainMap.get(createdUser.domain)}`);
    });
  });

  describe('#getByUniqueID', () => {
    it('should get the user by it\'s full string', async () => {
      await Users.create(userExample);
      const user = await Users.getByUniqueID(`${userExample.name}@${userExample.domain}`);
      user.should.exist;
      user.should.have.property('name', userExample.name); 
      user.should.have.property('domain', userExample.domain);
      user.should.have.property('adfsUID', `${userExample.name}@${domainMap.get(userExample.domain)}`);
    });

    it('should throw error when there is not user with matching full string', async () => {
      await Users.create(userExample);
      await expectError(Users.getByUniqueID, [`other@domain`]);
    });

    it('should get the user by full string where the domain is an adfsUID (one possible domain)', async () => {
      await Users.create(userExample);
      const user = await Users.getByUniqueID(`${userExample.name}@${domainMap.get(userExample.domain)}`);
      user.should.exist;
      user.should.have.property('name', userExample.name); 
      user.should.have.property('domain', userExample.domain);
      user.should.have.property('adfsUID', `${userExample.name}@${domainMap.get(userExample.domain)}`);
    });

    it('should get the user by full string where the domain is an adfsUID (multiple possible domains)', async () => {
      const userMultiDomain: IDomainUser = {
        name: 'haim',
        domain: [...domainMap.keys()][2], // there is one more domain with the same adfsUID
      };
      await Users.create(userMultiDomain);
      const user = await Users.getByUniqueID(`${userMultiDomain.name}@${domainMap.get(userMultiDomain.domain)}`);
      user.should.exist;
      user.should.have.property('name', userMultiDomain.name); 
      user.should.have.property('domain', userMultiDomain.domain);
      user.should.have.property('adfsUID', `${userMultiDomain.name}@${domainMap.get(userMultiDomain.domain)}`);
    });
  });

  describe('#delete', () => {
    it('should delete the specified user', async () => {
      const createdUser = await Users.create(userExample);
      const res = await Users.delete(createdUser.id);
      res.should.have.property('ok', 1);
      res.should.have.property('deletedCount', 1);
    });
  });

  describe('#update', () => {
    it('should update the name of user', async () => {
      const createdUser = await Users.create(userExample);
      createdUser.name = 'david';
      const res = await Users.update(createdUser.id, createdUser);
      res.should.have.property('name', 'david');
      res.should.have.property('domain', [...domainMap.keys()][0]);
    });
    it('should throw error if name to change it is an used', async () => {
      const createdUser = await Users.create(userExample);
      await Users.create({ name: 'david', domain: [...domainMap.keys()][0] });
      createdUser.name = 'david';
      let isError = false;
      try {
        await Users.update(createdUser.id, createdUser);        
      } catch (err) {
        err.should.exist;
        err.should.have.property('message', `user with name: ${createdUser.name} and domain: ${createdUser.domain} already exists`);        
        isError = true;
      }
      isError.should.be.true;      
    });
  });
});
