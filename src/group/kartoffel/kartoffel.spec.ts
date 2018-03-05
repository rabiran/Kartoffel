import * as chai from 'chai';
import * as sinon from 'sinon';
import {  Kartoffel  } from './kartoffel.controller';
import {  KartoffelModel  } from './kartoffel.model';
import {  IKartoffel  } from './kartoffel.interface';
import { User } from '../../user/user.controller';
import { IUser } from '../../user/user.interface';
import {  expectError  } from '../../helpers/spec.helper';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));


before(async () => { 
  KartoffelModel.remove({  }, (err) => {  });
});

const ID_EXAMPLE = '59a56d577bedba18504298df';
const idXmpls = ['59a6aa1f5caa4e4d2ac39797', '59a56d577bedba18504298df'];


describe('Strong Groups', () => { 
  describe('#getKartoffeln', () => { 
    it('Should be empty if there are no groups', async () => { 
      const groups = await Kartoffel.getKartoffeln();
      groups.should.be.a('array');
      groups.should.have.lengthOf(0);
    });
    it('Should get all the groups', async () => { 
      await Kartoffel.createKartoffel(<IKartoffel>{  name: 'myGroup'  });

      let groups = await Kartoffel.getKartoffeln();
      groups.should.be.a('array');
      groups.should.have.lengthOf(1);
      should.exist(groups[0]);
      groups[0].should.have.property('name', 'myGroup');


      await Kartoffel.createKartoffel(<IKartoffel>{  name: 'yourGroup'  });
      await Kartoffel.createKartoffel(<IKartoffel>{  name: 'hisGroup'  });

      groups = await Kartoffel.getKartoffeln();
      groups.should.be.a('array');
      groups.should.have.lengthOf(3);
    });
  });
  describe('#get updated groups from a given date', () => { 
    it('Should get the current groups', async () => { 
      const clock = sinon.useFakeTimers();
      await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_-2' });
      const update1 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_-1' });
      clock.tick(1000);
      const from = new Date();
      clock.tick(1000);
      await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_1' });
      await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_2' });
      const update2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_3' });
      await Kartoffel.updateKartoffel(update1);
      clock.tick(1000);
      const to = new Date();
      clock.tick(1000);
      await Kartoffel.createKartoffel(<IKartoffel>{ name: 'group_4' });
      await Kartoffel.updateKartoffel(update2);
      const groups = await Kartoffel.getUpdatedFrom(from, to);
      clock.restore();

      groups.should.exist;
      groups.should.have.lengthOf(3);
      groups[0].should.have.property('name', 'group_-1');
      groups[1].should.have.property('name', 'group_1');
      groups[2].should.have.property('name', 'group_2');
    });
  });
  describe('#createKartoffel', () => { 
    it('Should create a simple group', async () => { 
      const group = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Biran' });
      group.should.exist;
      group.should.have.property('name', 'Biran');
      group.should.have.property('ancestors');
      group.ancestors.should.be.an('array');
      group.ancestors.should.have.lengthOf(0);
      group.hierarchy.should.have.lengthOf(0);
    });
    it('Should throw an error when parent doesn\'t exist', async () => { 
      await expectError(Kartoffel.createKartoffel, [<IKartoffel>{ name: 'Biran' }, '597053012c3b60031211a063']);
    });
    it('Should throw an error when group is undefined', async () => { 
      await expectError(Kartoffel.createKartoffel, [undefined]);
    });
    it('Should create a group correctly with one parent', async () => { 
      const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Ido' });
      const child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Elad' }, parent._id);
      child.should.exist;
      child.should.have.property('ancestors');
      child.ancestors.should.have.lengthOf(1);
      const hisParent = child.ancestors[0].toString();
      hisParent.should.equal(parent._id.toString());
      child.hierarchy.should.have.lengthOf(1);
      child.hierarchy[0].should.be.equal(parent.name);
    });
    it('Should create a group correctly with two ancestors', async () => { 
      const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'grandparent' });
      const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent' }, grandparent._id);
      const child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'child' }, parent._id);
      child.should.exist;
      child.should.have.property('ancestors');
      child.ancestors.should.have.lengthOf(2);
      const hisParent = child.ancestors[0].toString();
      const hisGrandparent = child.ancestors[1].toString();
      hisParent.should.equal(parent._id.toString());
      hisGrandparent.should.equal(grandparent._id.toString());
      child.hierarchy.should.have.lengthOf(2);
      child.hierarchy[0].should.be.equal(grandparent.name);
      child.hierarchy[1].should.be.equal(parent.name);
    });
  });
  describe('#getKartoffelByID', () => {
    it('Should throw an error when there is no matching group', async () => { 
      await expectError(Kartoffel.getKartoffel, [ID_EXAMPLE]);
    });
    it('Should return the group if existed', async () => { 
      const kartoffel = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'myGroup' });
      const res = await Kartoffel.getKartoffel(kartoffel.id);

      res.should.exist;
      res.should.have.property('name', kartoffel.name);
    });
    it('should return the group populated', async() => {
      const kartoffel = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'myGroup' });
      const child1 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 1' }, kartoffel._id);
      const child2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'Child 2' }, kartoffel._id);

      const res = await Kartoffel.getKartoffelPopulated(kartoffel.id);

      res.should.exist;
      res.should.have.property('id', kartoffel.id);
      res.should.have.property('name', kartoffel.name);
      const children = <IKartoffel[]>res.children;
      children.should.exist;
      children.should.have.lengthOf(2);
      children[0].name.should.be.equal(child1.name);
      children[1].name.should.be.equal(child2.name);
    });
  });
  describe('Update Kartoffel', () => {
    describe('#updateKartoffel', () => { 
      it('Should throw an error if the group doesn\'t exist', async () => { 
        // Kartoffel.updateKartoffelDry(ID_EXAMPLE, <IKartoffel>{ name: 'newName' });
        await expectError(Kartoffel.updateKartoffel, [<IKartoffel>{ _id: ID_EXAMPLE, name: 'newName' }]);
      });
      it('Should update the group', async() => { 
        const kartoffel = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'myTeam' });
        const updated = await Kartoffel.updateKartoffel(<IKartoffel>{ _id: kartoffel.id, name: 'newName' });

        updated.should.exist;
        updated.should.have.property('name', 'newName');
      });


    });
    describe('#childrenAdoption', () => { 
      it('Should throw an error if parent does not exist', async () => { 
        await expectError(Kartoffel.childrenAdoption, [ID_EXAMPLE]);
      });
      it('Should update a child\'s parent', async () => { 
        const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent' });
        let child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'child' });

        await Kartoffel.childrenAdoption(parent._id, [child._id]);

        child = await Kartoffel.getKartoffelOld(child._id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(1);
        expect(child.ancestors[0].toString() === parent._id.toString()).to.be.ok;
        child.should.have.property('hierarchy');
        child.hierarchy.should.have.lengthOf(1);
        child.hierarchy[0].should.be.equal(parent.name);
      });
      it('Should update the child\'s previous parent', async () => { 
        const parent_old = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent_old' });
        let child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'child' });
        const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent' });

        await Kartoffel.childrenAdoption(parent_old._id, [child._id]);
        await Kartoffel.childrenAdoption(parent._id, [child._id]);
        child = await Kartoffel.getKartoffelOld(child._id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(1);
        expect(child.ancestors[0].toString() === parent._id.toString()).to.be.ok;
      });
      it('Should update a child\'s hierarchy', async () => { 
        const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'grandparent' });
        const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent' });
        let child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'child' });

        await Kartoffel.childrenAdoption(grandparent._id, [parent._id]);
        await Kartoffel.childrenAdoption(parent._id, [child._id]);

        child = await Kartoffel.getKartoffelOld(child._id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(2);
        expect(child.ancestors[0].toString() === parent._id.toString()).to.be.ok;
        expect(child.ancestors[1].toString() === grandparent._id.toString()).to.be.ok;
      });
      it('Should update a child\'s hierarchy multiple times', async () => { 
        const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'grandparent' });
        const grandparent_2 = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'grandparent_2' });
        const parent = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'parent' });
        let child = await Kartoffel.createKartoffel(<IKartoffel>{ name: 'child' });

        await Kartoffel.childrenAdoption(grandparent._id, [parent._id]);
        await Kartoffel.childrenAdoption(parent._id, [child._id]);
        await Kartoffel.childrenAdoption(grandparent_2._id, [parent._id]);

        child = await Kartoffel.getKartoffelOld(child._id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(2);
        expect(child.ancestors[0].toString() === parent._id.toString()).to.be.ok;
        expect(child.ancestors[1].toString() === grandparent_2._id.toString()).to.be.ok;
      });
    });
  });
  describe('#deleteKartoffel', () => {
    it('Should throw an error if the group does not exist', async () => { 
      await expectError(Kartoffel.deleteGroup, [ID_EXAMPLE]);
    });
    it('Should delete the group', async () => { 
      const group = await Kartoffel.createKartoffel(<IKartoffel>{ _id: ID_EXAMPLE, name: 'group' });
      const res = await Kartoffel.deleteGroup(group._id);
      res.should.exist;
      res.should.have.property('ok', 1);
      res.should.have.property('n', 1);
      await expectError(Kartoffel.getKartoffel, [group._id]);
    });
    it('Should not remove a group with children', async () => { 
      const group = await Kartoffel.createKartoffel(<IKartoffel>{ _id: ID_EXAMPLE, name: 'group' });
      const child = await Kartoffel.createKartoffel(<IKartoffel>{ _id: idXmpls[0], name: 'child' });
      await Kartoffel.childrenAdoption(group._id, [child._id]);
      await expectError(Kartoffel.deleteGroup, [group._id]);
    });
  });
  describe('#getGroupMembers', () => {
    it('Should throw an error when group does not exist', async() => {
      await expectError(Kartoffel.getAllMembers, [ID_EXAMPLE]);
    });
    it('Should be returning the matching members', async() => {
      const ancestor = await bigTree();
      const treeMembers = await Kartoffel.getAllMembers(ancestor._id);
      treeMembers.should.have.lengthOf(8);
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

  const user_11 =  await  User.createUser(<IUser>{ _id : '0000011', firstName: 'A', lastName: 'A' });
  const user_12 =  await  User.createUser(<IUser>{ _id : '0000012', firstName: 'B', lastName: 'A' });
  const user_21 =  await  User.createUser(<IUser>{ _id : '0000021', firstName: 'A', lastName: 'B' });
  const user_111 = await  User.createUser(<IUser>{ _id : '0000111', firstName: 'A', lastName: 'AA' });
  const user_221 = await  User.createUser(<IUser>{ _id : '0000221', firstName: 'A', lastName: 'BB' });
  const user_311 = await  User.createUser(<IUser>{ _id : '0000311', firstName: 'A', lastName: 'CA' });
  const user_312 = await  User.createUser(<IUser>{ _id : '0000312', firstName: 'B', lastName: 'CA' });
  const user_331 = await  User.createUser(<IUser>{ _id : '0000331', firstName: 'A', lastName: 'CC' });

  const friede = await  User.createUser(<IUser>{ _id : '1000001', firstName: 'Sister', lastName: 'Friede' });
  const gale = await  User.createUser(<IUser>{ _id : '1000002', firstName: 'Uncle', lastName: 'Gale' });

  await User.assign(user_11._id,  parent_1._id);
  await User.assign(user_12._id,  parent_1._id);
  await User.assign(user_21._id,  parent_2._id);
  await User.assign(user_111._id, child_11._id);
  await User.assign(user_221._id, child_22._id);
  await User.assign(user_311._id, child_31._id);
  await User.assign(user_312._id, child_31._id);
  await User.assign(user_331._id, child_33._id);

  await User.assign(friede._id, ariandel._id);
  await User.assign(gale._id, ariandel._id);

  return seldag;
}
