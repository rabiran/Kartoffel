import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';
import { IKartoffel } from '../group/kartoffel/kartoffel.interface';
import { Kartoffel } from '../group/kartoffel/kartoffel.controller';
import { Rank } from '../utils';
import { Document } from 'mongoose';

export class User {
    static _userRepository: UserRepository = new UserRepository();
    _userService: UserRepository;

    constructor() {
        this._userService = new UserRepository();
    }

    static async getUsers(): Promise<IUser[]> {
        const users = await User._userRepository.getAll();
        return <IUser[]>users;
    }

    static async createUser( user: IUser ): Promise<IUser> {
        const newUser = await User._userRepository.create(user);
        return <IUser>newUser;
    }

    static async getUser(userID: string): Promise<IUser> {
        const user = await User._userRepository.findById(userID);
        return <IUser>user;
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
        if (!updatedUser) throw new Error('Cannot find user with ID: ' + user._id);
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

        user.directGroup = undefined;
        await User.updateUser(user);
    }

    static async manage(userID: string, groupID: string) {
        const user = await User.getUser(userID);
        const group = await Kartoffel.getKartoffel(groupID);

        // if the user is a member/admin of another group
        if (user.directGroup && user.directGroup.toString() != groupID) {
            // remove him from that group
            await User.dismiss(userID);
            user.directGroup = undefined;
        }
        // if the user is not a member now
        if (!user.directGroup) {
            // Maketh him a member
            await User.assign(userID, groupID);
        }
        await Kartoffel.addAdmin(groupID, userID);
        return;
    }

    static async mismanage(userID: string) {
        const user = await User.getUser(userID);
        if (!user.directGroup) return;
        await Kartoffel.fireAdmin(user.directGroup, userID);

        user.directGroup = undefined;
        await User.updateUser(user);
    }
}