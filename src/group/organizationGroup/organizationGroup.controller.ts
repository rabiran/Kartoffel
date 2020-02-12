import { Request, Response, NextFunction } from 'express';
import { OrganizationGroupRepository } from './organizationGroup.repository';
import { IOrganizationGroup, ORGANIZATION_GROUP_OBJECT_FIELDS, ORGANIZATION_GROUP_KEYS } from './organizationGroup.interface';
import { Person } from '../../person/person.controller';
import { IPerson } from '../../person/person.interface';
import { PersonRepository } from '../../person/person.repository';
import { Document } from 'mongoose';
import * as _ from 'lodash';
import { sortObjectsByIDArray, promiseAllWithFails, asyncForEach } from '../../utils';
import { ValidationError, ResourceNotFoundError } from '../../types/error';

export class OrganizationGroup {
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();
  static _personRepository: PersonRepository = new PersonRepository();

// Used for a 'getAll' route that no longer exists
/*   static async getAllOrganizationGroups(): Promise<IOrganizationGroup[]> {
    const organizationGroups = await OrganizationGroup._organizationGroupRepository.getAll();
    return <IOrganizationGroup[]>organizationGroups;
  } */

  static async getOrganizationGroups(query?: any): Promise<IOrganizationGroup[]> {
    const cond = {};
    if (!(query && query.alsoDead && query.alsoDead === 'true')) cond['isAlive'] = 'true'; 
    const organizationGroups = await OrganizationGroup._organizationGroupRepository.find(cond);
    const fieldsToSend = <(keyof IOrganizationGroup)[]>_.difference(ORGANIZATION_GROUP_KEYS, ['directMembers', 'directManagers']);
    return _.flatMap(<IOrganizationGroup[]>organizationGroups, k => pick(k, ...fieldsToSend));
  }

  /**
   * Checks if there is a group with this hierarchy
   * @param name Name of OrganizationGgroup
   * @param hierarchy Hierarchy of OrganizationGgroup
   */
  static async getOrganizationGroupByHierarchy(name: string, hierarchy: string[]): Promise<IOrganizationGroup> {
    const cond = {
      name,
      hierarchy,
    };
    const organizationGroup = await OrganizationGroup._organizationGroupRepository.findOne(cond);
    if (!organizationGroup) {
      throw new ResourceNotFoundError(`Cannot find group with name: ${name} and hierarchy: ${hierarchy.join('/')}`);
    }
    return organizationGroup;
  }

  /**
   * Check if groups in hierarchy exist and return object with IDs 
   * of groups if existing, otherwise null
   * @param hierarchy hierarchy of groups to check
   */
  static async getIDofOrganizationGroupsInHierarchy(hierarchy: string[]) {
    const groups: IOrganizationGroup[] = await promiseAllWithFails(hierarchy.map((p, index, hierarchy) => OrganizationGroup.getOrganizationGroupByHierarchy(p, hierarchy.slice(0, index))), null);
    const groupsID = {};
    for (let index = 0; index < hierarchy.length; index++) {
      const value = groups[index].id ? groups[index].id : null;
      const key = hierarchy.slice(0, index + 1).join('/');
      groupsID[key] = value;
    }
    return groupsID;
  }

  /**
  * Add organizationGroup
  * @param organizationGroup The object with details to create organizationGroup 
  * @param parentID ID of parent of organizationGroup to insert 
  */
  static async createOrganizationGroup(organizationGroup: IOrganizationGroup, parentID: string = undefined): Promise<IOrganizationGroup> {

    const parent = parentID ? await OrganizationGroup._organizationGroupRepository.findById(parentID) : null;
    // the parent does not exist
    if (parentID && !parent) throw new ResourceNotFoundError(`group with id: ${parentID} does not exist`);

    /* In case there is a parent checking that all his ancestor 
       lives and creates a hierarchy and an ancestor */
    if (parentID) {

      // If the parent is not alive checks all the other ancestors
      if (!parent.isAlive) {
        const parentAncestors = await OrganizationGroup.getAncestors(parentID, { isAlive: false });
        parentAncestors.unshift(parent);

        // Revives all the ancestors that are not alive and returns to each parent his son 
        await asyncForEach(parentAncestors,
          async (ancestor: IOrganizationGroup, index: number, parentAncestors: IOrganizationGroup[]) => {
            ancestor.isAlive = true;

            // Returns each child to the parent, except the last one that is not in the array
            if (index !== parentAncestors.length - 1) {
              (<string[]>parentAncestors[index + 1].children).push(ancestor.id);

              // 'Is a leaf' check:
              if (parentAncestors[index + 1].isALeaf) parentAncestors[index + 1].isALeaf = false;

              // Update the last parent
            } else {
              await OrganizationGroup.adoptChildren(ancestor.ancestors[0], [ancestor.id]);
            }

            // Updating any parent that has been modified
            await OrganizationGroup.updateOrganizationGroup(ancestor.id, ancestor);
          });
      }
    }

    // Create group hierarchy
    organizationGroup.ancestors = parent ? [parent.id].concat(parent.ancestors) : [];
    organizationGroup.hierarchy = parent ? parent.hierarchy.concat(parent.name) : [];

    // Checks if the group exists
    const groupExists = <IOrganizationGroup>await OrganizationGroup._organizationGroupRepository.
      findOne({ name: organizationGroup.name, hierarchy: organizationGroup.hierarchy });
    if (groupExists) {
      // If the group exists and is alive
      if (groupExists.isAlive) {
        throw new ValidationError(`The group with name: ${groupExists.name} and hierarchy: ${groupExists.hierarchy.join('\\')} exist`);
        // If the group exists and is not alive, revive it and return it to its parent
      } else {
        groupExists.isAlive = true;

        // Return son to parent if exist
        if (groupExists.ancestors[0]) await OrganizationGroup.adoptChildren(groupExists.ancestors[0], [groupExists.id]);
        return await OrganizationGroup.updateOrganizationGroup(groupExists.id, groupExists);
      }
    }

    // Create the Group
    const newOrganizationGroup = await OrganizationGroup._organizationGroupRepository.create(organizationGroup);
    if (parentID) {
      // Update the parent
      await OrganizationGroup.adoptChildren(parentID, [newOrganizationGroup.id]);
    }
    return newOrganizationGroup;
  }

  static async getOrganizationGroupOld(organizationGroupID: string): Promise<IOrganizationGroup> {
    const organizationGroup = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID);
    if (!organizationGroup) throw new ResourceNotFoundError('Cannot find group with ID: ' + organizationGroupID);
    return <IOrganizationGroup>organizationGroup;
  }

  static async getOrganizationGroupPopulated(organizationGroupID: string): Promise<IOrganizationGroup> {
    const organizationGroup = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID, 'children');
    if (!organizationGroup) throw new ResourceNotFoundError('Cannot find group with ID: ' + organizationGroupID);
    return <IOrganizationGroup>organizationGroup;
  }

  static async getOrganizationGroup(organizationGroupID: string, toPopulate?: String[]): Promise<IOrganizationGroup> {
    toPopulate = _.intersection(toPopulate, ORGANIZATION_GROUP_OBJECT_FIELDS);
    // fields to select in the populated objects (can be groups and persons)
    const select = ['id', 'name', 'isALeaf', 'serviceType', 'rank', 'firstName', 'lastName', 'alive'];
    const populateOptions = _.flatMap(toPopulate, (path) => {
      return { path, select };
    });
    const result = await OrganizationGroup._organizationGroupRepository.findById(organizationGroupID, populateOptions);
    if (!result) throw new ResourceNotFoundError('Cannot find group with ID: ' + organizationGroupID);
    const organizationGroup = <IOrganizationGroup>result;
    return <IOrganizationGroup>modifyOrganizationGroupBeforeSend(organizationGroup, toPopulate);
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await OrganizationGroup._organizationGroupRepository.getUpdatedFrom(from, to);
    return <IOrganizationGroup[]>persons;
  }

  static async updateOrganizationGroup(id: string, updateTo: Partial<IOrganizationGroup>): Promise<IOrganizationGroup> {
    const updated = await OrganizationGroup._organizationGroupRepository.update(id, updateTo);
    if (!updated) throw new ResourceNotFoundError('Cannot find group with ID: ' + id);
    return updated;
  }

  static async changeName(groupID: string, name: string): Promise<IOrganizationGroup> {
    return;
  }

  /**
   * change the parent of groups (transfer them to another group)
   * @param parentID the group to transfer into (the new parent)
   * @param childrenIDs id list of the groups to transfer
   */
  static async childrenAdoption(parentID: string, childrenIDs: string[]): Promise<void> {
    // get parent
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    // filter out non existing children
    const children = await OrganizationGroup._organizationGroupRepository.getSome(childrenIDs);
    const existingChildrenIds = children.map(group => group.id);
    // Checks if the parentID is included in chldrenIDs. If it's true, 
    // it creates "Recursive Adoption" and it will stuck the program and spam the DB.  
    if (childrenIDs.includes(parentID)) {
      throw new ValidationError('The parentId inclueds in childrenIDs, Cannot insert organizationGroup itself');
    }
    // Update the children's previous parents
    await asyncForEach(children, async (child: IOrganizationGroup, index: number, children: IOrganizationGroup[]) => {
      await OrganizationGroup.disownChild(child.ancestors[0], child.id);
    });
    // Update the parent and the children
    await Promise.all([
      OrganizationGroup.adoptChildren(parentID, existingChildrenIds),
      OrganizationGroup.updateChildrenHierarchy(parentID, existingChildrenIds),
    ]);
    return;
  }

  /**
   * Hides the group when it is no longer used
   * @param groupID Group id of the group to hide
   */
  static async hideGroup(groupID: string): Promise<any> {
    const group = await OrganizationGroup.getOrganizationGroup(groupID, ['directMembers']);

    // Checks if the group has subgroups
    if (!group.isALeaf) {
      throw new ValidationError('Can not delete a group with sub groups!');
    }

    // Checks if the group has no friends
    if (group.directMembers.length === 0) {
      group.isAlive = false;
    } else {
      throw new ValidationError('Can not delete a group with members!');
    }

    // Find the parent, if there is one
    const parentID = group.ancestors.length > 0 ? group.ancestors[0] : undefined;

    // Update the group
    const res = await OrganizationGroup.updateOrganizationGroup(group.id, group);

    // Inform the parent about his child's death
    if (parentID) {
      await OrganizationGroup.disownChild(parentID, groupID);
    }
    return res;
  }

  /**
   * Delete organization Group from the DB
   * @param groupID OrganizationGroup to delete
   */
  static async deleteGroup(groupID: string): Promise<any> {
    const group = await OrganizationGroup.getOrganizationGroup(groupID, ['directMembers']);

    if (!group.isALeaf) {
      throw new ValidationError('Can not delete a group with sub groups!');
    }
    if (group.directMembers.length > 0) {
      throw new ValidationError('Can not delete a group with members!');
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
    return res;
  }

  /**
   * (helper function) updates the children hierarchy and ancestors according to the new parent.
   * recursively updates all the subgroups of the children 
   * @param parentID new parent's id
   * @param childrenIDs the children to update
   */
  private static async updateChildrenHierarchy(parentID: string, childrenIDs: string[] = []): Promise<void> {
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    if (childrenIDs.length === 0) {
      // update the current children - neccessary for the recursion to work
      childrenIDs = <string[]>(parent.children);
    }
    const ancestors = await OrganizationGroup.getIDAncestors(parentID);
    ancestors.unshift(parentID);
    const hierarchy = await OrganizationGroup.getHierarchyFromAncestors(parentID);
    hierarchy.unshift(parent.name);
    const updated = await OrganizationGroup._organizationGroupRepository.findAndUpdateSome(childrenIDs, { ancestors, hierarchy });
    await promiseAllWithFails(childrenIDs.map((childID => OrganizationGroup.updateChildrenHierarchy(childID))));
    return;
  }

  /**
   * (helper function ) ascribe (already existing) children to the parent group
   * @param parentID if of the parent to update
   * @param childrenIDs id of the children to ascribe
   * @param parent 
   */
  private static async adoptChildren(parentID: string, childrenIDs: string[], parent?: IOrganizationGroup): Promise<IOrganizationGroup> {
    if (!parent) {
      parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    }
    // Add the new children if they dont exist yet
    const children = (<string[]>parent.children).concat(childrenIDs);
    parent.children = _.uniq(children);
    // 'Is a leaf' check:
    if (parent.children.length !== 0) {
      parent.isALeaf = false;
    } else parent.isALeaf = true;
    return await OrganizationGroup.updateOrganizationGroup(parent.id, parent);
  }

  private static async disownChild(parentID: string, childID: string): Promise<IOrganizationGroup> {
    if (!parentID) return;
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    _.remove(<string[]>parent.children, (item) => { return item.toString() === childID; });
    if (parent.children.length === 0) {
      parent.isALeaf = true;
    } else parent.isALeaf = false;
    return await OrganizationGroup.updateOrganizationGroup(parent.id, parent);
  }

  /**
   * Return array of ids ancestors of group
   * @param organizationGroupID ID of group we want its ancestors
   */
  private static async getIDAncestors(organizationGroupID: string): Promise<string[]> {
    const organizationGroup = await OrganizationGroup.getOrganizationGroupOld(organizationGroupID);
    if (!organizationGroup.ancestors) return [];
    return <string[]>organizationGroup.ancestors;
  }

  /**
   * Get ancestors of group 
   * @param organizationGroupID ID of group
   * @param cond Condition of query
   */
  private static async getAncestors(organizationGroupID: string, cond: Object = {}): Promise<IOrganizationGroup[]> {
    const organizationGroup = await OrganizationGroup.getOrganizationGroupOld(organizationGroupID);
    if (!organizationGroup.ancestors) return [];

    // If there are conditions adding them to the request, otherwise no
    const ancestorObjects: IOrganizationGroup[] = 
      <IOrganizationGroup[]>await OrganizationGroup._organizationGroupRepository.getSome(organizationGroup.ancestors, cond);

    // Return sort array according ancestors  
    return <IOrganizationGroup[]>sortObjectsByIDArray(ancestorObjects, organizationGroup.ancestors);
  }

  /**
   * Return true if person is a member of group 
   * @param groupID 
   * @param personID 
   */
  private static async isMember(groupID: string, personID: string): Promise<boolean> {
    const members = await OrganizationGroup.getAllMembers(groupID);
    const memberIDs = members.map(member => member.id);
    return _.includes(<string[]>memberIDs, personID);
  }

  private static async getHierarchyFromAncestors(parentID: string): Promise<string[]> {
    const parent = await OrganizationGroup.getOrganizationGroupOld(parentID);
    if (!parent.hierarchy) return [];
    return parent.hierarchy;
  }

  static async getAllMembers(groupID: string): Promise<IPerson[]> {
    // check that this group exists
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);
    const offsprings = await OrganizationGroup._organizationGroupRepository.getOffspringsIds(groupID);
    const offspringIDs = offsprings.map(offspring => offspring.id);
    offspringIDs.push(groupID);
    const members = <IPerson[]>await OrganizationGroup._personRepository.getMembersOfGroups(offspringIDs);
    return members;
  }

  /**
   * Returns array of offsprings of the given group id.
   * if `maxDepth` given, only groups of depth (relative to the given group) 
   * less than `maxDepth` will be returned.
   * @param id 
   * @param maxDepth 
   */
  static async getOffsprings(id: string, maxDepth?: number) {
    return OrganizationGroup._organizationGroupRepository.getOffsprings(id, maxDepth);
  }
}


function modifyOrganizationGroupBeforeSend(organizationGroup: IOrganizationGroup, toPopulate: String[]): IOrganizationGroup {
  if (organizationGroup.isALeaf === undefined) {
    organizationGroup.isALeaf = (organizationGroup.children.length === 0);
  }

  const fieldsToIgnore = _.difference(['directMembers', 'directManagers'], toPopulate);
  const fieldsToSend = <(keyof IOrganizationGroup)[]>_.difference(ORGANIZATION_GROUP_KEYS, fieldsToIgnore);
  return pick(organizationGroup, ...fieldsToSend);
}

function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const copy = {} as Pick<T, K>;
  keys.forEach(key => copy[key] = obj[key]);
  return copy;
}
