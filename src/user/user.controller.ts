import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { Kartoffel } from '../group/kartoffel/kartoffel.controller';
import { KartoffelRepository } from '../group/kartoffel/kartoffel.repository';
import { Rank } from '../utils';
import { Document } from 'mongoose';
import { ObjectId } from 'bson';

export class User {
  static _userRepository: UserRepository = new UserRepository();
  _userService: UserRepository;
  static _kartoffelRepository: KartoffelRepository = new KartoffelRepository();

  constructor() {
    this._userService = new UserRepository();
  }

  static async getUsers(query = {}): Promise<IUser[]> {
    const cond = {};
    if (!('dead' in query)) cond['alive'] = 'true';
    const users = await User._userRepository.find(cond);
    return <IUser[]>users;
  }

  static async getUser(userID: string): Promise<IUser> {
    const user = await User._userRepository.findById(userID);
    if (!user) return Promise.reject(new Error('Cannot find user with ID: ' + userID));
    return <IUser>user;
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const users = await User._userRepository.getUpdatedFrom(from, to);
    return <IUser[]>users;
  }

  static async getKartoffelMembers(groupID: string): Promise<IUser[]> {
    // check that this group exists
    const group = await Kartoffel.getKartoffelOld(groupID);

    const offsprings = <IKartoffel[]>(await this._kartoffelRepository.getOffsprings(groupID));
    const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => (<string[]>a).concat(<string[]>b));
    const members = <IUser[]>await this._userRepository.getSome(<string[]>membersIDs);
    return members;
  }

  static async createUser(user: IUser): Promise<IUser> {
    const newUser = await User._userRepository.create(user);
    return <IUser>newUser;
  }

  static async discharge(userID: string): Promise<any> {
    let user = await User.getUser(userID);

    // If the user was in a group, notify it
    if (user && user.directGroup) {
      user = await User.dismiss(userID);
    }

    user.alive = false;
    const res = await User._userRepository.update(user);
    return res;
  }

  static async removeUser(userID: string): Promise<any> {
    const res = await User._userRepository.delete(userID);
    return res.result.n > 0 ? res.result : Promise.reject(new Error('Cannot find user with ID: ' + userID));
  }

  static async updateUser(user: IUser): Promise<IUser> {
    const updatedUser = await User._userRepository.update(user);
    if (!updatedUser) return Promise.reject(new Error('Cannot find user with ID: ' + user._id));
    return <IUser>updatedUser;
  }

  static async updateTeam(userID: string, newTeamID: ObjectId): Promise<IUser> {
    const user = await User.getUser(userID);
    user.directGroup = newTeamID;
    return await User.updateUser(user);
  }

  // Will transfer user between groups automatically. Is that what we want?
  static async assign(userID: string, groupID: string): Promise<IUser> {
    let user = await User.getUser(userID);
    const group = await Kartoffel.getKartoffel(groupID);

    user.directGroup = group._id;
    user = await User.updateUser(user);
    return <IUser>user;
  }

  // Will delete managedGroup too
  static async dismiss(userID: string) {
    let user = await User.getUser(userID);
    if (!user.directGroup) return;

    user.directGroup = null;
    if (user.managedGroup) user.managedGroup = null;
    user = await User.updateUser(user);
    return user;
  }

  static async manage(userID: string, groupID: string) {
    const user = await User.getUser(userID);
    const group = await Kartoffel.getKartoffel(groupID);
    
    if (String(user.directGroup) !== String(groupID)) {
      return Promise.reject(new Error('This user is not a member in this group, hence can not be appointed as a leaf'));
    }
    // else
    user.managedGroup = group._id;
    await User.updateUser(user);
    return;
  }

  static async resign(userID: string) {
    const user = await User.getUser(userID);
    user.managedGroup = undefined;
    await User.updateUser(user);
  }
}
