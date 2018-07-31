import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { Rank } from '../utils';
import { Document } from 'mongoose';
import { ObjectId } from 'bson';

export class User {
  static _userRepository: UserRepository = new UserRepository();
  _userService: UserRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();

  constructor() {
    this._userService = new UserRepository();
  }

  static async getUsers(query = {}): Promise<IUser[]> {
    const cond = {};
    if (!('dead' in query)) cond['alive'] = 'true';
    const users = await User._userRepository.find(cond);
    return <IUser[]>users;
  }

  static async getUser(userID: ObjectId): Promise<IUser> {
    const user = await User._userRepository.findById(userID);
    if (!user) return Promise.reject(new Error('Cannot find user with ID: ' + userID));
    return <IUser>user;
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const users = await User._userRepository.getUpdatedFrom(from, to);
    return <IUser[]>users;
  }

  static async getOrganizationGroupMembers(groupID: string): Promise<IUser[]> {
    // check that this group exists
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);

    const offsprings = <IOrganizationGroup[]>(await this._organizationGroupRepository.getOffsprings(groupID));
    const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => (<string[]>a).concat(<string[]>b));
    const members = <IUser[]>await this._userRepository.getSome(<string[]>membersIDs);
    return members;
  }

  static async createUser(user: IUser): Promise<IUser> {
    const newUser = await User._userRepository.create(user);
    return <IUser>newUser;
  }

  static async discharge(userID: ObjectId): Promise<any> {
    let user = await User.getUser(userID);

    // If the user was in a group, notify it
    if (user && user.directGroup) {
      user = await User.dismiss(userID);
    }

    user.alive = false;
    const res = await User._userRepository.update(user);
    return res;
  }

  static async removeUser(userID: ObjectId): Promise<any> {
    const res = await User._userRepository.delete(userID);
    return res.result.n > 0 ? res.result : Promise.reject(new Error('Cannot find user with ID: ' + userID));
  }

  static async updateUser(user: IUser): Promise<IUser> {
    const updatedUser = await User._userRepository.update(user);
    if (!updatedUser) return Promise.reject(new Error('Cannot find user with ID: ' + user._id));
    return <IUser>updatedUser;
  }

  static async updateTeam(userID: ObjectId, newTeamID: ObjectId): Promise<IUser> {
    const user = await User.getUser(userID);
    user.directGroup = newTeamID;
    return await User.updateUser(user);
  }

  // Will transfer user between groups automatically. Is that what we want?
  static async assign(userID: ObjectId, groupID: string): Promise<IUser> {
    let user = await User.getUser(userID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    user.directGroup = group._id;
    user = await User.updateUser(user);
    return <IUser>user;
  }

  // Will delete managedGroup too
  static async dismiss(userID: ObjectId) {
    let user = await User.getUser(userID);
    if (!user.directGroup) return;

    user.directGroup = null;
    if (user.managedGroup) user.managedGroup = null;
    user = await User.updateUser(user);
    return user;
  }

  static async manage(userID: ObjectId, groupID: string) {
    const user = await User.getUser(userID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);
    
    if (String(user.directGroup) !== String(groupID)) {
      return Promise.reject(new Error('This user is not a member in this group, hence can not be appointed as a leaf'));
    }
    // else
    user.managedGroup = group._id;
    await User.updateUser(user);
    return;
  }

  static async resign(userID: ObjectId) {
    const user = await User.getUser(userID);
    user.managedGroup = undefined;
    await User.updateUser(user);
  }
}
