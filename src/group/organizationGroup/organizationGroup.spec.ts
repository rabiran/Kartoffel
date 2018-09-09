import * as chai from 'chai';
import * as sinon from 'sinon';
import { OrganizationGroup } from './organizationGroup.controller';
import { OrganizationGroupModel } from './organizationGroup.model';
import { IOrganizationGroup } from './organizationGroup.interface';
import { Person } from '../../person/person.controller';
import { IPerson } from '../../person/person.interface';
import { expectError } from '../../helpers/spec.helper';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));

const ID_EXAMPLE = '59a56d577bedba18504298df';
const idXmpls = ['59a6aa1f5caa4e4d2ac39797', '59a56d577bedba18504298df'];


describe('Strong Groups', () => {
  describe('#getOrganizationGroups', () => {
    it('Should be empty if there are no groups', async () => {
      const groups = await OrganizationGroup.getOrganizationGroups();
      groups.should.be.a('array');
      groups.should.have.lengthOf(0);
    });
    it('Should get all the groups', async () => {
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });

      let groups = await OrganizationGroup.getOrganizationGroups();
      groups.should.be.a('array');
      groups.should.have.lengthOf(1);
      should.exist(groups[0]);
      groups[0].should.have.property('name', 'myGroup');


      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'yourGroup' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'hisGroup' });

      groups = await OrganizationGroup.getOrganizationGroups();
      groups.should.be.a('array');
      groups.should.have.lengthOf(3);
    });
  });
  describe('#get updated groups from a given date', () => {
    it('Should get the current groups', async () => {
      const clock = sinon.useFakeTimers();
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_-2' });
      const update1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_-1' });
      clock.tick(1000);
      const from = new Date();
      clock.tick(1000);
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_1' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_2' });
      const update2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_3' });
      await OrganizationGroup.updateOrganizationGroup(update1.id, update1);
      clock.tick(1000);
      const to = new Date();
      clock.tick(1000);
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group_4' });
      await OrganizationGroup.updateOrganizationGroup(update2.id, update2);
      const groups = await OrganizationGroup.getUpdatedFrom(from, to);
      clock.restore();

      groups.should.exist;
      groups.should.have.lengthOf(3);
      groups[0].should.have.property('name', 'group_-1');
      groups[1].should.have.property('name', 'group_1');
      groups[2].should.have.property('name', 'group_2');
    });
  });
  describe('#createOrganizationGroup', () => {
    it('Should create a simple group', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Biran' });
      group.should.exist;
      group.should.have.property('name', 'Biran');
      group.should.have.property('ancestors');
      group.ancestors.should.be.an('array');
      group.ancestors.should.have.lengthOf(0);
      group.hierarchy.should.have.lengthOf(0);
    });
    it('Should throw an error when parent doesn\'t exist', async () => {
      await expectError(OrganizationGroup.createOrganizationGroup, [<IOrganizationGroup>{ name: 'Biran' }, '597053012c3b60031211a063']);
    });
    it('Should throw an error when group is undefined', async () => {
      await expectError(OrganizationGroup.createOrganizationGroup, [undefined]);
    });
    it('Should create a group correctly with one parent', async () => {
      const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Ido' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Elad' }, parent.id);
      child.should.exist;
      child.should.have.property('ancestors');
      child.ancestors.should.have.lengthOf(1);
      const hisParent = child.ancestors[0].toString();
      hisParent.should.equal(parent.id);
      child.hierarchy.should.have.lengthOf(1);
      child.hierarchy[0].should.be.equal(parent.name);
    });
    it('Should create a group correctly with two ancestors', async () => {
      const grandparent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'grandparent' });
      const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' }, grandparent.id);
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' }, parent.id);
      child.should.exist;
      child.should.have.property('ancestors');
      child.ancestors.should.have.lengthOf(2);
      const hisParent = child.ancestors[0].toString();
      const hisGrandparent = child.ancestors[1].toString();
      hisParent.should.equal(parent.id.toString());
      hisGrandparent.should.equal(grandparent.id.toString());
      child.hierarchy.should.have.lengthOf(2);
      child.hierarchy[0].should.be.equal(grandparent.name);
      child.hierarchy[1].should.be.equal(parent.name);
    });
  });
  describe('#getOrganizationGroupByID', () => {
    it('Should throw an error when there is no matching group', async () => {
      await expectError(OrganizationGroup.getOrganizationGroup, [ID_EXAMPLE]);
    });
    it('Should return the group if existed', async () => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      const res = await OrganizationGroup.getOrganizationGroup(organizationGroup.id);

      res.should.exist;
      res.should.have.property('name', organizationGroup.name);
    });
    it('should return the group populated', async () => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      const child1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 1' }, organizationGroup.id);
      const child2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'Child 2' }, organizationGroup.id);

      const res = await OrganizationGroup.getOrganizationGroupPopulated(organizationGroup.id);

      res.should.exist;
      res.should.have.property('id', organizationGroup.id);
      res.should.have.property('name', organizationGroup.name);
      const children = <IOrganizationGroup[]>res.children;
      children.should.exist;
      children.should.have.lengthOf(2);
      children[0].name.should.be.equal(child1.name);
      children[1].name.should.be.equal(child2.name);
    });
  });
  describe('Update OrganizationGroup', () => {
    describe('#updateOrganizationGroup', () => {
      it('Should throw an error if the group doesn\'t exist', async () => {
        // OrganizationGroup.updateOrganizationGroupDry(ID_EXAMPLE, <IOrganizationGroup>{ name: 'newName' });
        await expectError(OrganizationGroup.updateOrganizationGroup, [ID_EXAMPLE, <IOrganizationGroup>{ name: 'newName' }]);
      });
      it('Should update the group', async () => {
        const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myTeam' });
        const updated = await OrganizationGroup.updateOrganizationGroup(organizationGroup.id ,<IOrganizationGroup>{ name: 'newName' });

        updated.should.exist;
        updated.should.have.property('name', 'newName');
      });


    });
    describe('#childrenAdoption', () => {
      it('Should throw an error if parent does not exist', async () => {
        await expectError(OrganizationGroup.childrenAdoption, [ID_EXAMPLE]);
      });
      it('Should update a child\'s parent', async () => {
        const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
        let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });

        await OrganizationGroup.childrenAdoption(parent.id, [child.id]);

        child = await OrganizationGroup.getOrganizationGroupOld(child.id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(1);
        expect(child.ancestors[0].toString() === parent.id).to.be.ok;
        child.should.have.property('hierarchy');
        child.hierarchy.should.have.lengthOf(1);
        child.hierarchy[0].should.be.equal(parent.name);
      });
      it('Should update the child\'s previous parent', async () => {
        const parent_old = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent_old' });
        let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
        const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });

        await OrganizationGroup.childrenAdoption(parent_old.id, [child.id]);
        await OrganizationGroup.childrenAdoption(parent.id, [child.id]);
        child = await OrganizationGroup.getOrganizationGroupOld(child.id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(1);
        expect(child.ancestors[0].toString() === parent.id).to.be.ok;
      });
      it('Should update a child\'s hierarchy', async () => {
        const grandparent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'grandparent' });
        const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
        let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });

        await OrganizationGroup.childrenAdoption(grandparent.id, [parent.id]);
        await OrganizationGroup.childrenAdoption(parent.id, [child.id]);

        child = await OrganizationGroup.getOrganizationGroupOld(child.id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(2);
        expect(child.ancestors[0].toString() === parent.id).to.be.ok;
        expect(child.ancestors[1].toString() === grandparent.id).to.be.ok;
      });
      it('Should update a child\'s hierarchy multiple times', async () => {
        const grandparent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'grandparent' });
        const grandparent_2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'grandparent_2' });
        const parent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'parent' });
        let child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });

        await OrganizationGroup.childrenAdoption(grandparent.id, [parent.id]);
        await OrganizationGroup.childrenAdoption(parent.id, [child.id]);
        await OrganizationGroup.childrenAdoption(grandparent_2.id, [parent.id]);

        child = await OrganizationGroup.getOrganizationGroupOld(child.id);

        child.should.exist;
        child.should.have.property('ancestors');
        child.ancestors.should.have.lengthOf(2);
        expect(child.ancestors[0].toString() === parent.id).to.be.ok;
        expect(child.ancestors[1].toString() === grandparent_2.id).to.be.ok;
      });
    });
  });
  describe('#deleteOrganizationGroup', () => {
    it('Should throw an error if the group does not exist', async () => {
      await expectError(OrganizationGroup.deleteGroup, [ID_EXAMPLE]);
    });
    it('Should delete the group', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      const res = await OrganizationGroup.deleteGroup(group.id);
      res.should.exist;
      res.should.have.property('ok', 1);
      res.should.have.property('n', 1);
      await expectError(OrganizationGroup.getOrganizationGroup, [group.id]);
    });
    it('Should not remove a group with children', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group' });
      const child = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child' });
      await OrganizationGroup.childrenAdoption(group.id, [child.id]);
      await expectError(OrganizationGroup.deleteGroup, [group.id]);
    });
  });
  describe('#getGroupMembers', () => {
    it('Should throw an error when group does not exist', async () => {
      await expectError(OrganizationGroup.getAllMembers, [ID_EXAMPLE]);
    });
    it('Should be returning the matching members', async () => {
      const ancestor = await bigTree();
      const treeMembers = await OrganizationGroup.getAllMembers(ancestor.id);
      treeMembers.should.have.lengthOf(8);
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

  await OrganizationGroup.childrenAdoption(seldag.id, [parent_1.id, parent_2.id, parent_3.id]);
  await OrganizationGroup.childrenAdoption(parent_1.id, [child_11.id]);
  await OrganizationGroup.childrenAdoption(parent_2.id, [child_21.id, child_22.id]);
  await OrganizationGroup.childrenAdoption(parent_3.id, [child_31.id, child_32.id, child_33.id]);

  const person_11 = await Person.createPerson(<IPerson>{
    identityCard: '000000011',
    personalNumber: '0000011',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_12 = await Person.createPerson(<IPerson>{
    identityCard: '000000012',
    personalNumber: '0000012',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_21 = await Person.createPerson(<IPerson>{
    identityCard: '000000021',
    personalNumber: '0000021',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_111 = await Person.createPerson(<IPerson>{
    identityCard: '000000111',
    personalNumber: '0000111',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_221 = await Person.createPerson(<IPerson>{
    identityCard: '000000221',
    personalNumber: '0000221',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_311 = await Person.createPerson(<IPerson>{
    identityCard: '000000311',
    personalNumber: '0000311',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_312 = await Person.createPerson(<IPerson>{
    identityCard: '000000312',
    personalNumber: '0000312',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const person_331 = await Person.createPerson(<IPerson>{
    identityCard: '000000331',
    personalNumber: '0000331',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });

  const friede = await Person.createPerson(<IPerson>{ 
    identityCard: '100000001',
    personalNumber: '1000001',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });
  const gale = await Person.createPerson(<IPerson>{ 
    identityCard: '100000002',
    personalNumber: '1000002',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    serviceType: 'kill',
    directGroup: idXmpls[1],
  });

  await Person.assign(person_11.id, parent_1.id);
  await Person.assign(person_12.id, parent_1.id);
  await Person.assign(person_21.id, parent_2.id);
  await Person.assign(person_111.id, child_11.id);
  await Person.assign(person_221.id, child_22.id);
  await Person.assign(person_311.id, child_31.id);
  await Person.assign(person_312.id, child_31.id);
  await Person.assign(person_331.id, child_33.id);

  await Person.assign(friede.id, ariandel.id);
  await Person.assign(gale.id, ariandel.id);

  return seldag;
}
