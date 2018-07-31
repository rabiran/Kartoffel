import { Request, Response, NextFunction } from 'express';
import { OrganizationGroupRepository } from './organizationGroup.repository';
import { IOrganizationGroup, ORGANIZATION_GROUP_OBJECT_FIELDS, ORGANIZATION_GROUP_KEYS } from './organizationGroup.interface';
import { Person } from '../../person/person.controller';
import { IPerson } from '../../person/person.interface';
import { PersonRepository } from '../../person/person.repository';
import { Document } from 'mongoose';
import * as _ from 'lodash';

export class OrganizationGroup {
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();
  static _personRepository: PersonRepository = new PersonRepository();

  static async getAllOrganizationGroups(): Promise<IOrganizationGroup[]> {
    const organizationGroups = await OrganizationGroup._organizationGroupRepository.getAll();
    return <IOrganizationGroup[]>organizationGroups;
  }

  static async getOrganizationGroups(cond?: Object): Promise<IOrganizationGroup[]> {
    const organizationGroups = await OrganizationGroup._organizationGroupRepository.find(cond);
    const fieldsToSend = <(keyof IOrganizationGroup)[]> _.difference(ORGANIZATION_GROUP_KEYS, ORGANIZATION_GROUP_OBJECT_FIELDS);
    return _.flatMap(<IOrganizationGroup[]>organizationGroups, k => pick(k, ...fieldsToSend));
  }

  static async createOrganizationGroup(organizationGroup: IOrganizationGroup, parentID: string = undefined): Promise<IOrganizationGroup> {
    if (parentID) {
      // Create group hierarchy
      const parentsHierarchy = await OrganizationGroup.getAncestors(parentID);
      parentsHierarchy.unshift(parentID);
      organizationGroup.ancestors = parentsHierarchy;
      await OrganizationGroup.getHierarchyFromAncestors(organizationGroup._id, organizationGroup);
    }
    // Create the Group
    const newOrganizationGroup = await OrganizationGroup._organizationGroupRepository.create(organizationGroup);
    if (parentID) {
      // Update the parent
      await OrganizationGroup.adoptChildren(parentID, [newOrganizationGroup._id]);
    }
    return <IOrganizationGroup>newOrganizationGroup;
  }

  static async getOrganizationGroupOld(organizationGroupID: string): Promise<IOrganizationGroup> {
    const organizationGroup = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID);
    if (!organizationGroup) return Promise.reject(new Error('Cannot find group with ID: ' + organizationGroupID));
    return <IOrganizationGroup>organizationGroup;
  }

  static async getOrganizationGroupPopulated(organizationGroupID: string): Promise<IOrganizationGroup> {
    const organizationGroup = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID, 'children');
    if (!organizationGroup) return Promise.reject(new Error('Cannot find group with ID: ' + organizationGroupID));
    return <IOrganizationGroup>organizationGroup;
  }

  static async getOrganizationGroup(organizationGroupID: string, toPopulate?: String[]): Promise<IOrganizationGroup> {
    toPopulate = _.intersection(toPopulate, ORGANIZATION_GROUP_OBJECT_FIELDS);
    const select = ['id', 'name', 'childless', 'type', 'rank', 'firstName', 'lastName'];
    const populateOptions = _.flatMap(toPopulate, (path) => {
      return { path, select };
    });
    const result = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID, populateOptions);
    if (!result) return Promise.reject(new Error('Cannot find group with ID: ' + organizationGroupID));
    const organizationGroup = <IOrganizationGroup>result;
    return <IOrganizationGroup>modifyOrganizationGroupBeforeSend(organizationGroup, toPopulate);
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await OrganizationGroup._organizationGroupRepository.getUpdatedFrom(from, to);
    return <IOrganizationGroup[]>persons;
  }

  static async updateOrganizationGroup(updateTo: IOrganizationGroup): Promise<IOrganizationGroup> {
    const updated = await OrganizationGroup._organizationGroupRepository.update(updateTo);
    if (!updated) return Promise.reject(new Error('Cannot find group with ID: ' + updateTo._id));
    return <IOrganizationGroup>updated;
  }

  static async changeName(groupID: string, name: string): Promise<IOrganizationGroup> {
    return;
  }

  static async childrenAdoption(parentID: string, childrenIDs: string[]): Promise<void> {
    // Update the children's previous parents
    const children = <IOrganizationGroup[]>(await OrganizationGroup._organizationGroupRepository.getSome(childrenIDs));
    await Promise.all(children.map(child => OrganizationGroup.disownChild(child.ancestors[0], child._id)));
    // Update the parent and the children
    await Promise.all([
      OrganizationGroup.adoptChildren(parentID, childrenIDs),
      OrganizationGroup.updateChildrenHierarchy(parentID, childrenIDs),
    ]);
    return;
  }

  static async deleteGroup(groupID: string): Promise<any> {
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);
    // Check that the group has no members or children
    if (group.children.length > 0) {
      return Promise.reject(new Error('Can not delete a group with sub groups!'));
    }
    if (group.members.length > 0) {
      return Promise.reject(new Error('Can not delete a group with members!'));
    }
    // Find the parent, if there is one
    let parentID = undefined;
    if (group.ancestors.length > 0) {
      parentID = group.ancestors[0];
    }
    // Delete the group
    const res = await OrganizationGroup._organizationGroupRepository.delete(groupID);
    // Inform the parent about his child's death
    if (parentID) {
      await OrganizationGroup.disownChild(parentID, groupID);
    }
    return res.result;
  }

  private static async updateChildrenHierarchy(parentID: string, childrenIDs: string[] = []): Promise<void> {
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    if (childrenIDs.length === 0) {
      childrenIDs = <string[]>(parent.children);
    } 
    const ancestors = await OrganizationGroup.getAncestors(parentID);
    ancestors.unshift(parentID);
    const hierarchy = await OrganizationGroup.getHierarchyFromAncestors(parentID);
    hierarchy.unshift(parent.name);
    const updated = await OrganizationGroup._organizationGroupRepository.findAndUpdateSome(childrenIDs, { ancestors, hierarchy });
    await Promise.all(childrenIDs.map((childID => OrganizationGroup.updateChildrenHierarchy(childID))));
    return;
  }

  // Update the father about his child
  private static async adoptChildren(organizationGroupID: string, childrenIDs: string[]): Promise<IOrganizationGroup> {
    const parent = await OrganizationGroup.getOrganizationGroupOld(organizationGroupID);
    // Add the new children if they dont exist yet
    // All of this below is because a stupid bug...
    const children:string[] = [];
    _.flatMap(parent.children, c => children.push(c.toString()));
    children.push(...childrenIDs);
    parent.children = _.uniq(children);
    // 'Is a leaf' check:
    if (parent.children.length !== 0) {
      parent.isALeaf = false;
    } else parent.isALeaf = true;
    return await OrganizationGroup.updateOrganizationGroup(parent);
  }

  private static async disownChild(parentID: string, childID: string): Promise<IOrganizationGroup> {
    if (!parentID) return;
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    _.pull(<string[]>parent.children, childID);
    if (parent.children.length === 0) {
      parent.isALeaf = true;
    } else parent.isALeaf = false;
    return await OrganizationGroup.updateOrganizationGroup(parent);
  }

  private static async getAncestors(organizationGroupID: string): Promise<string[]> {
    const organizationGroup = await OrganizationGroup.getOrganizationGroupOld(organizationGroupID);
    if (!organizationGroup.ancestors) return [];
    return <string[]>organizationGroup.ancestors;
  }

  private static async isMember(groupID: string, personID: string): Promise<boolean> {
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);
    const members = group.members;
    return _.includes(<string[]>members, personID);
  }

  private static async getHierarchyFromAncestors(groupID: string, group?: IOrganizationGroup): Promise<string[]> {
    if (!group) {
      group = await OrganizationGroup.getOrganizationGroupOld(groupID);
    }
    const parentID = group.ancestors[0];
    if (!parentID) return [];
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    const newHierarchy = parent.hierarchy.concat(parent.name);
    group.hierarchy = newHierarchy;
    return newHierarchy;
  }

  static async getAllMembers(groupID: string): Promise<IPerson[]> {
    // check that this group exists
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);

    // const offsprings = <IOrganizationGroup[]>(await OrganizationGroup._organizationGroupRepository.getOffsprings(groupID));
    // const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => (<string[]>a).concat(<string[]>b));
    // const members = <IPerson[]>await OrganizationGroup._personRepository.getSome(<string[]>membersIDs);
    // return members;

    const offsprings = await OrganizationGroup._organizationGroupRepository.getOffspringsIds(groupID);
    const offspringIDs = offsprings.map(offspring => offspring._id);
    offspringIDs.push(groupID);
    const members = <IPerson[]> await OrganizationGroup._personRepository.getMembersOfGroups(offspringIDs);
    return members;
  }
}

function modifyOrganizationGroupBeforeSend(organizationGroup: IOrganizationGroup, toPopulate:String[]): IOrganizationGroup {
  if (organizationGroup.isALeaf === undefined) {
    organizationGroup.isALeaf = (organizationGroup.children.length === 0);
  }

  const fieldsToIgnore = _.difference(ORGANIZATION_GROUP_OBJECT_FIELDS, toPopulate);
  const fieldsToSend = <(keyof IOrganizationGroup)[]> _.difference(ORGANIZATION_GROUP_KEYS, fieldsToIgnore);
  return pick(organizationGroup, ...fieldsToSend);
  // return organizationGroup;
}

function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const copy = {} as Pick<T, K>;
  keys.forEach(key => copy[key] = obj[key]);
  return copy;
}
