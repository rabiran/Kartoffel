import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { OrganizationGroup } from './organizationGroup.controller';
import { OrganizationGroupModel } from './organizationGroup.model';
import { IOrganizationGroup } from './organizationGroup.interface';
import { Person } from '../../person/person.controller';
import { IPerson } from '../../person/person.interface';
import { expectError } from '../../helpers/spec.helper';
import { ENTITY_TYPE } from '../../config/db-enums';
import { Mongoose } from 'mongoose';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));
chai.use(chaiAsPromised);

const ID_EXAMPLE = '59a56d577bedba18504298df';
const idXmpls = ['59a6aa1f5caa4e4d2ac39797', '59a56d577bedba18504298df'];
const GROUP_ARRAY: IOrganizationGroup[] = [
  <IOrganizationGroup>{ name: 'group1' },
  <IOrganizationGroup>{ name: 'group2' },
  <IOrganizationGroup>{ name: 'group3' },
  <IOrganizationGroup>{ name: 'group4' },
];

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
    it('Should get all the groups without group that delete', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' });

      await OrganizationGroup.hideGroup(group.id);
      
      const groups = await OrganizationGroup.getOrganizationGroups();
      groups.should.be.a('array');
      groups.should.have.lengthOf(2);
    });
    it('Should get all the groups with group that delete', async () => {
      const group = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' });
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' });

      await OrganizationGroup.hideGroup(group.id);
      
      const groups = await OrganizationGroup.getOrganizationGroups({ alsoDead: 'true' });
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

  describe('#Get group by hierarchy', () => {
    it('Should not find the group', async () => {
      const existGroups = OrganizationGroup.getOrganizationGroupByHierarchy('group4', ['group1', 'group2', 'group3']);
      return existGroups.should.be.rejected;
    });
    it('Should return group', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group4' }, group3.id);
      const existGroups = await OrganizationGroup.getOrganizationGroupByHierarchy('group4', ['group1', 'group2', 'group3']);
      expect(existGroups).to.be.an('object');
      expect(existGroups).to.have.property(`name`, 'group4');
      expect(existGroups.hierarchy).to.have.lengthOf(3);
      expect(existGroups.hierarchy).to.include.members(['group1', 'group2', 'group3']);
      expect(existGroups.ancestors).to.have.lengthOf(3);    
      expect(existGroups.ancestors.map(x => x.toString())).to.include.members([group3.id, group2.id, group1.id]);    
    });
    it('Should not find the group and have hierarchy', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const existGroups = OrganizationGroup.getOrganizationGroupByHierarchy('group4', ['group1', 'group2', 'group3']);
      return existGroups.should.be.rejected;
    });
  });

  describe('#Get ID groups according hierarchy', () => {
    it('Should return Object that all values is null', async () => {
      const existGroups = await OrganizationGroup.getIDofOrganizationGroupsInHierarchy(['group1', 'group2', 'group3', 'group4']);
      expect(existGroups).to.be.an('object');
      expect(Object.keys(existGroups)).to.have.lengthOf(4);
      Object.keys(existGroups).forEach((name) => {
        expect(existGroups[name]).to.be.null;
      });
    });
    it('Should return Object that all values is ID', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const group3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group3' }, group2.id);
      const group4 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group4' }, group3.id);      
      const existGroups = await OrganizationGroup.getIDofOrganizationGroupsInHierarchy(['group1', 'group2', 'group3', 'group4']);
      expect(existGroups).to.be.an('object');
      expect(Object.keys(existGroups)).to.have.lengthOf(4);
      expect(existGroups).to.have.property(`${group1.name}`, group1.id);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}`, group2.id);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}/${group3.name}`, group3.id);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}/${group3.name}/${group4.name}`, group4.id);
    });
    it('Should return Object the first two values is ID and other is null', async () => {
      const group1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group1' });
      const group2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'group2' }, group1.id);
      const existGroups = await OrganizationGroup.getIDofOrganizationGroupsInHierarchy(['group1', 'group2', 'group3', 'group4']);
      expect(existGroups).to.be.an('object');
      expect(Object.keys(existGroups)).to.have.lengthOf(4);
      expect(existGroups).to.have.property(`${group1.name}`, group1.id);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}`, group2.id);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}/group3`, null);
      expect(existGroups).to.have.property(`${group1.name}/${group2.name}/group3/group4`, null);
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
    it('Should throw an error when try to create exist name with whitespace', async () => {
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'David' });
      let isError = false;
      try {
        await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: '  David  ' });
      } catch (error) {
        expect(error.message).to.equal(`The group with name: David and hierarchy:  exist`);
        isError = true;
      }
      isError.should.be.true;      
    });
    it('Should throw an error when try to create an organizationGroup without ancestors that alredy exist', async () => {
      await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      try {
        await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      } catch (error) {
        expect(error.message).to.equal(`The group with name: ${GROUP_ARRAY[0].name} and hierarchy:  exist`);
      }
    });
    it('Should revive organizationGroup when create organizationGroup without ancestors, that alredy exist and dead', async () => {
      const orgGrp: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      const hideGrp: IOrganizationGroup = await OrganizationGroup.hideGroup(orgGrp.id);
      expect(hideGrp.isAlive).to.be.false;
      const orgGrpRvive: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      expect(orgGrp.id).to.equal(orgGrpRvive.id);
      expect(orgGrpRvive.isAlive).to.be.true;
    });
    it('Should revive organizationGroup and ancestors when create organizationGroup that alredy exist and she and her ancestors are dead', async () => {
      const ancstr1: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      const ancstr2: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[1] }, ancstr1.id);
      const ancstr3: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[2] }, ancstr2.id);
      const orgGrp: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[3] }, ancstr3.id);
      const hideOrgGrp = await OrganizationGroup.hideGroup(orgGrp.id);
      const hideAncstr3 = await OrganizationGroup.hideGroup(ancstr3.id);
      const hideAncstr2 = await OrganizationGroup.hideGroup(ancstr2.id);
      const hideAncstr1 = await OrganizationGroup.getOrganizationGroupOld(ancstr1.id);
      expect(hideAncstr2.isAlive).to.be.false;
      expect(hideAncstr3.isAlive).to.be.false;
      expect(hideOrgGrp.isAlive).to.be.false;
      expect(hideAncstr3.children).to.be.empty;
      expect(hideAncstr2.children).to.be.empty;
      expect(hideAncstr1.children).to.be.empty;
      const orgGrpRvive: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[3] }, ancstr3.id);
      const liveancstr1: IOrganizationGroup = await OrganizationGroup.getOrganizationGroupOld(ancstr1.id);
      const liveancstr2: IOrganizationGroup = await OrganizationGroup.getOrganizationGroupOld(ancstr2.id);
      const liveancstr3: IOrganizationGroup = await OrganizationGroup.getOrganizationGroupOld(ancstr3.id);
      expect(orgGrp.id).to.equal(orgGrpRvive.id);
      expect(orgGrpRvive.isAlive).to.be.true;
      expect(liveancstr3.isAlive).to.be.true;
      expect(liveancstr2.isAlive).to.be.true;
      expect((< String[]>liveancstr3.children).map(x => x.toString())).to.includes(orgGrpRvive.id);
      expect((<String[]>liveancstr2.children).map(x => x.toString())).to.includes(liveancstr3.id);
      expect((<String[]>liveancstr1.children).map(x => x.toString())).to.includes(liveancstr2.id);
    });
    it('Should throw an error when try to create organizationGroup with ancestors that exist', async () => {
      const ancstr: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[0] });
      const orgGrp: IOrganizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[1] }, ancstr.id);
      try {
        await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ ...GROUP_ARRAY[1] }, ancstr.id);
      } catch (error) {
        expect(error.message).to.equal(`The group with name: ${GROUP_ARRAY[1].name} and hierarchy: ${orgGrp.hierarchy.join('\\')} exist`);
      }
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
    it('should get the group with it\'s member and without it after discharge', async () => {
      const organizationGroup = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'myGroup' });
      const p = await Person.createPerson({
        identityCard: '000000315',
        personalNumber: '1000002',
        firstName: 'elaf',
        lastName: 'hhhh',
        entityType: ENTITY_TYPE[0],
        dischargeDay: new Date(2022, 11),
        directGroup: organizationGroup.id,
        job: 'dead',
      });
      const groupWithMember = await OrganizationGroup.getOrganizationGroup(organizationGroup.id, ['directMembers']);
      // console.log(groupWithMember);
      groupWithMember.should.have.property('directMembers');
      groupWithMember.directMembers.should.have.lengthOf(1);
      const member = groupWithMember.directMembers[0];
      member.should.have.property('firstName', 'elaf');
      await Person.discharge(p.id);
      const groupAfterdischarge = await OrganizationGroup.getOrganizationGroup(organizationGroup.id, ['directMembers']);
      groupAfterdischarge.should.have.property('directMembers');
      groupAfterdischarge.directMembers.should.have.lengthOf(0);
      // console.log(groupWithMember);

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
        const updated = await OrganizationGroup.updateOrganizationGroup(organizationGroup.id, <IOrganizationGroup>{ name: 'newName' });

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
      it('Should update many childs', async () => {
        let oldParent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'old parent' });
        let child1 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child1' }, oldParent.id);
        let child2 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child2' }, oldParent.id);
        let child3 = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'child3' }, oldParent.id);        
        oldParent = await OrganizationGroup.getOrganizationGroupOld(oldParent.id);
        oldParent.should.have.property('children');
        oldParent.children.should.have.lengthOf(3);
        expect(child1.ancestors[0].toString() === oldParent.id).to.be.ok;
        expect(child2.ancestors[0].toString() === oldParent.id).to.be.ok;
        expect(child3.ancestors[0].toString() === oldParent.id).to.be.ok;
        let newParent = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'new parent' });
        await OrganizationGroup.childrenAdoption(newParent.id, [child1.id, child2.id, child3.id]);
        oldParent = await OrganizationGroup.getOrganizationGroupOld(oldParent.id);
        newParent = await OrganizationGroup.getOrganizationGroupOld(newParent.id);
        child1 = await OrganizationGroup.getOrganizationGroupOld(child1.id);
        child2 = await OrganizationGroup.getOrganizationGroupOld(child2.id);
        child3 = await OrganizationGroup.getOrganizationGroupOld(child3.id);

        oldParent.should.exist;
        oldParent.should.have.property('children');
        oldParent.children.should.have.lengthOf(0);
        newParent.should.exist;
        newParent.should.have.property('children');
        newParent.children.should.have.lengthOf(3);
        child1.should.exist;
        expect(child1.ancestors[0].toString() === newParent.id).to.be.ok;
        child2.should.exist;
        expect(child2.ancestors[0].toString() === newParent.id).to.be.ok;
        child3.should.exist;
        expect(child3.ancestors[0].toString() === newParent.id).to.be.ok;     
      });
      it('Should expect error when try to insert organiztionGroup to itself', async () => {
        const og = await OrganizationGroup.createOrganizationGroup(<IOrganizationGroup>{ name: 'old parent' });
        let isError = false;
        try {
          await OrganizationGroup.childrenAdoption(og.id, [og.id]);
        } catch (error) {
          expect(error.message).to.equal(`The parentId inclueds in childrenIDs, Cannot insert organizationGroup itself`);
          isError = true;
        }
        isError.should.be.true;
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
      res.should.have.property('deletedCount', 1);
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
    identityCard: '000000018',
    personalNumber: '0000011',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_12 = await Person.createPerson(<IPerson>{
    identityCard: '000000125',
    personalNumber: '0000012',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_21 = await Person.createPerson(<IPerson>{
    identityCard: '000000026',
    personalNumber: '0000021',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_111 = await Person.createPerson(<IPerson>{
    identityCard: '000000117',
    personalNumber: '0000111',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_221 = await Person.createPerson(<IPerson>{
    identityCard: '000000224',
    personalNumber: '0000221',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_311 = await Person.createPerson(<IPerson>{
    identityCard: '000000315',
    personalNumber: '0000311',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_312 = await Person.createPerson(<IPerson>{
    identityCard: '000002311',
    personalNumber: '0000312',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const person_331 = await Person.createPerson(<IPerson>{
    identityCard: '000000331',
    personalNumber: '0000331',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
  });

  const friede = await Person.createPerson(<IPerson>{
    identityCard: '100000009',
    personalNumber: '1000001',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup:parent_1.id,
    entityType: ENTITY_TYPE[0],
  });
  const gale = await Person.createPerson(<IPerson>{
    identityCard: '120000005',
    personalNumber: '1000002',
    firstName: 'Mazal',
    lastName: 'Tov',
    dischargeDay: new Date(2022, 11),
    hierarchy: ['birthday', 'anniversary'],
    job: 'parent',
    directGroup: parent_1.id,
    entityType: ENTITY_TYPE[0],
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
