import { Request, Response, NextFunction } from 'express';
import { KartoffelRepository } from './kartoffel.repository';
import { IKartoffel, KARTOFFEL_OBJECT_FIELDS, KARTOFFEL_KEYS } from './kartoffel.interface';
import { User } from '../../user/user.controller';
import { IUser } from '../../user/user.interface';
import { UserRepository } from '../../user/user.repository';
import { Document } from 'mongoose';
import * as _ from 'lodash';

export class Kartoffel {
  static _kartoffelRepository: KartoffelRepository = new KartoffelRepository();
  static _userRepository: UserRepository = new UserRepository();

  static async getAllKartoffeln(): Promise<IKartoffel[]> {
    const kartoffeln = await Kartoffel._kartoffelRepository.getAll();
    return <IKartoffel[]>kartoffeln;
  }

  static async getKartoffeln(cond?: Object): Promise<IKartoffel[]> {
    const kartoffeln = await Kartoffel._kartoffelRepository.find(cond);
    const fieldsToSend = <(keyof IKartoffel)[]> _.difference(KARTOFFEL_KEYS, KARTOFFEL_OBJECT_FIELDS);
    return _.flatMap(<IKartoffel[]>kartoffeln, k => pick(k, ...fieldsToSend));
  }

  static async createKartoffel(kartoffel: IKartoffel, parentID: string = undefined): Promise<IKartoffel> {
    if (parentID) {
      // Create group hierarchy
      const parentsHierarchy = await Kartoffel.getAncestors(parentID);
      parentsHierarchy.unshift(parentID);
      kartoffel.ancestors = parentsHierarchy;
      await Kartoffel.getHierarchyFromAncestors(kartoffel._id, kartoffel);
    }
    // Create the Group
    const newKartoffel = await Kartoffel._kartoffelRepository.create(kartoffel);
    if (parentID) {
      // Update the parent
      await Kartoffel.adoptChildren(parentID, [newKartoffel._id]);
    }
    return <IKartoffel>newKartoffel;
  }

  static async getKartoffelOld(kartoffelID: string): Promise<IKartoffel> {
    const kartoffel = await Kartoffel._kartoffelRepository.findById(kartoffelID);
    if (!kartoffel) return Promise.reject(new Error('Cannot find group with ID: ' + kartoffelID));
    return <IKartoffel>kartoffel;
  }

  static async getKartoffelPopulated(kartoffelID: string): Promise<IKartoffel> {
    const kartoffel = await Kartoffel._kartoffelRepository.findById(kartoffelID, 'children');
    if (!kartoffel) return Promise.reject(new Error('Cannot find group with ID: ' + kartoffelID));
    return <IKartoffel>kartoffel;
  }

  static async getKartoffel(kartoffelID: string, toPopulate?: String[]): Promise<IKartoffel> {
    toPopulate = _.intersection(toPopulate, KARTOFFEL_OBJECT_FIELDS);
    const select = ['id', 'name', 'childless', 'type', 'rank', 'firstName', 'lastName'];
    const populateOptions = _.flatMap(toPopulate, (path) => {
      return { path, select };
    });
    const result = await Kartoffel._kartoffelRepository.findById(kartoffelID, populateOptions);
    if (!result) return Promise.reject(new Error('Cannot find group with ID: ' + kartoffelID));
    const kartoffel = <IKartoffel>result;
    return <IKartoffel>modifyKartoffelBeforeSend(kartoffel, toPopulate);
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const users = await Kartoffel._kartoffelRepository.getUpdatedFrom(from, to);
    return <IKartoffel[]>users;
  }

  static async updateKartoffel(updateTo: IKartoffel): Promise<IKartoffel> {
    const updated = await Kartoffel._kartoffelRepository.update(updateTo);
    if (!updated) return Promise.reject(new Error('Cannot find group with ID: ' + updateTo._id));
    return <IKartoffel>updated;
  }

  static async changeName(groupID: string, name: string): Promise<IKartoffel> {
    return;
  }

  static async addAdmin(kartoffelID: string, userID: string): Promise<IKartoffel> {
    const isMember = await Kartoffel.isMember(kartoffelID, userID);
    if (!isMember) {
      return Promise.reject(new Error('This user is not a member in this group, hence can not be appointed as a leaf'));
    } else {
      const kartoffel = await Kartoffel.getKartoffelOld(kartoffelID);
      kartoffel.admins = _.union(<string[]>kartoffel.admins, [userID]);
      return await Kartoffel.updateKartoffel(kartoffel);
    }
  }

  static async addUsers(kartoffelID: string, users: string[], areAdmins: boolean = false): Promise<IKartoffel> {
    const type = areAdmins ? 'admins' : 'members';
    const kartoffel = await Kartoffel.getKartoffelOld(kartoffelID);
    kartoffel[type] = _.union(<string[]>kartoffel[type], users);
    return await Kartoffel.updateKartoffel(kartoffel);
  }

  static async dismissMember(kartoffelID: string, member: string): Promise<void> {
    const kartoffel = await Kartoffel.getKartoffelOld(kartoffelID);
    _.pull(<string[]>kartoffel.members, member);
    // If the member is an admin as well, remove him from the admins list
    if ((<string[]>kartoffel.admins).indexOf(member) !== -1) {
      _.pull(<string[]>kartoffel.admins, member);
    }
    await Kartoffel.updateKartoffel(kartoffel);
    return;
  }

  static async fireAdmin(kartoffelID: string, manager: string): Promise<void> {
    const kartoffel = await Kartoffel.getKartoffelOld(kartoffelID);
    _.pull(<string[]>kartoffel.admins, manager);
    await Kartoffel.updateKartoffel(kartoffel);
    return;
  }

  static async childrenAdoption(parentID: string, childrenIDs: string[]): Promise<void> {
    // Update the children's previous parents
    const children = <IKartoffel[]>(await Kartoffel._kartoffelRepository.getSome(childrenIDs));
    await Promise.all(children.map(child => Kartoffel.disownChild(child.ancestors[0], child._id)));
    // Update the parent and the children
    await Promise.all([
      Kartoffel.adoptChildren(parentID, childrenIDs),
      Kartoffel.updateChildrenHierarchy(parentID, childrenIDs),
    ]);
    return;
  }

  static async deleteGroup(groupID: string): Promise<any> {
    const group = await Kartoffel.getKartoffelOld(groupID);
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
    const res = await Kartoffel._kartoffelRepository.delete(groupID);
    // Inform the parent about his child's death
    if (parentID) {
      await Kartoffel.disownChild(parentID, groupID);
    }
    return res.result;
  }

  private static async updateChildrenHierarchy(parentID: string, childrenIDs: string[] = []): Promise<void> {
    const parent = await Kartoffel.getKartoffelOld(parentID);
    if (childrenIDs.length === 0) {
      childrenIDs = <string[]>(parent.children);
    } 
    const ancestors = await Kartoffel.getAncestors(parentID);
    ancestors.unshift(parentID);
    const hierarchy = await Kartoffel.getHierarchyFromAncestors(parentID);
    hierarchy.unshift(parent.name);
    const updated = await Kartoffel._kartoffelRepository.findAndUpdateSome(childrenIDs, { ancestors, hierarchy });
    await Promise.all(childrenIDs.map((childID => Kartoffel.updateChildrenHierarchy(childID))));
    return;
  }

  // Update the father about his child
  private static async adoptChildren(kartoffelID: string, childrenIDs: string[]): Promise<IKartoffel> {
    const parent = await Kartoffel.getKartoffelOld(kartoffelID);
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
    return await Kartoffel.updateKartoffel(parent);
  }

  private static async disownChild(parentID: string, childID: string): Promise<IKartoffel> {
    if (!parentID) return;
    const parent = await Kartoffel.getKartoffelOld(parentID);
    _.pull(<string[]>parent.children, childID);
    if (parent.children.length === 0) {
      parent.isALeaf = true;
    } else parent.isALeaf = false;
    return await Kartoffel.updateKartoffel(parent);
  }

  private static async getAncestors(kartoffelID: string): Promise<string[]> {
    const kartoffel = await Kartoffel.getKartoffelOld(kartoffelID);
    if (!kartoffel.ancestors) return [];
    return <string[]>kartoffel.ancestors;
  }

  private static async isMember(groupID: string, userID: string): Promise<boolean> {
    const group = await Kartoffel.getKartoffelOld(groupID);
    const members = group.members;
    return _.includes(<string[]>members, userID);
  }

  private static async getHierarchyFromAncestors(groupID: string, group?: IKartoffel): Promise<string[]> {
    if (!group) {
      group = await Kartoffel.getKartoffelOld(groupID);
    }
    const parentID = group.ancestors[0];
    if (!parentID) return [];
    const parent = await Kartoffel.getKartoffelOld(parentID);
    const newHierarchy = parent.hierarchy.concat(parent.name);
    group.hierarchy = newHierarchy;
    return newHierarchy;
  }

  static async getAllMembers(groupID: string): Promise<IUser[]> {
    // check that this group exists
    const group = await Kartoffel.getKartoffelOld(groupID);

    // const offsprings = <IKartoffel[]>(await Kartoffel._kartoffelRepository.getOffsprings(groupID));
    // const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => (<string[]>a).concat(<string[]>b));
    // const members = <IUser[]>await Kartoffel._userRepository.getSome(<string[]>membersIDs);
    // return members;

    const offsprings = await Kartoffel._kartoffelRepository.getOffspringsIds(groupID);
    const offspringIDs = offsprings.map(offspring => offspring._id);
    offspringIDs.push(groupID);
    const members = <IUser[]> await Kartoffel._userRepository.getMembersOfGroups(offspringIDs);
    return members;
  }
}

function modifyKartoffelBeforeSend(kartoffel: IKartoffel, toPopulate:String[]): IKartoffel {
  if (kartoffel.isALeaf === undefined) {
    kartoffel.isALeaf = (kartoffel.children.length === 0);
  }

  const fieldsToIgnore = _.difference(KARTOFFEL_OBJECT_FIELDS, toPopulate);
  const fieldsToSend = <(keyof IKartoffel)[]> _.difference(KARTOFFEL_KEYS, fieldsToIgnore);
  return pick(kartoffel, ...fieldsToSend);
  // return kartoffel;
}

function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const copy = {} as Pick<T, K>;
  keys.forEach(key => copy[key] = obj[key]);
  return copy;
}
