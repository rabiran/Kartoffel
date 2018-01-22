import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { Kartoffel } from '../group/kartoffel/kartoffel.controller';
import { KartoffelRepository } from '../group/kartoffel/kartoffel.repository';
import { Rank } from '../utils';
import { Document } from 'mongoose';

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
    return <IUser>user;
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const users = await User._userRepository.getUpdatedFrom(from, to);
    return <IUser[]>users;
  }

  static async getKartoffelMembers(groupID: string): Promise<IUser[]> {
    // check that this group exists
    const group = await Kartoffel.getKartoffel(groupID);

    const offsprings = <IKartoffel[]>(await this._kartoffelRepository.getOffsprings(groupID));
    const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => a.concat(b));
    const members = <IUser[]>await this._userRepository.getSome(membersIDs);
    return members;
  }

  static async createUser(user: IUser): Promise<IUser> {
    const newUser = await User._userRepository.create(user);
    return <IUser>newUser;
  }

  static async discharge(userID: string): Promise<any> {
    const user = await User.getUser(userID);

    // If the user was in a group, notify it
    if (user && user.directGroup) await User.dismiss(userID);

    user.alive = false;
    const res = await User._userRepository.update(user);
    return { ok: 1 };
  }

  static async removeUser(userID: string): Promise<any> {
    const user = await User.getUser(userID);
    // If the user had a group notify it...
    if (user && user.directGroup) await User.dismiss(userID);
    const res = await User._userRepository.delete(userID);
    return res.result;
  }

  static async updateUser(user: IUser): Promise<IUser> {
    const updatedUser = await User._userRepository.update(user);
    if (!updatedUser) return Promise.reject(new Error('Cannot find user with ID: ' + user._id));
    return <IUser>updatedUser;
  }

  static async updateTeam(userID: string, newTeamID: string): Promise<IUser> {
    const user = await User.getUser(userID);
    user.directGroup = newTeamID;
    return await User.updateUser(user);
  }

  static async assign(userID: string, groupID: string): Promise<void> {
    const user = await User.getUser(userID);
    const group = await Kartoffel.getKartoffel(groupID);

    if (user.directGroup) await User.dismiss(userID);

    user.directGroup = groupID;
    await User.updateUser(user);
    await Kartoffel.addUsers(groupID, [userID]);

    return;
  }

  static async dismiss(userID: string) {
    const user = await User.getUser(userID);
    if (!user.directGroup) return;
    await Kartoffel.dismissMember(user.directGroup, userID);

    user.directGroup = null;
    await User.updateUser(user);
  }

  static async manage(userID: string, groupID: string) {
    const user = await User.getUser(userID);
    const group = await Kartoffel.getKartoffel(groupID);

    await Kartoffel.addAdmin(groupID, userID);
    return;
  }

  static async resign(userID: string) {
    const user = await User.getUser(userID);
    if (!user.directGroup) return;
    await Kartoffel.fireAdmin(user.directGroup, userID);

    user.directGroup = undefined;
    await User.updateUser(user);
  }
}
