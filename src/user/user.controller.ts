import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';
import { Rank } from '../utils';
import { Document } from 'mongoose';

export class User {
    static _userRepository: UserRepository = new UserRepository();
    _userService: UserRepository;

    constructor() {
        this._userService = new UserRepository();
    }

    public static async getUsers(): Promise<IUser[]> {
        const users = await User._userRepository.getAll();
        return <IUser[]>users;
    }

    public static async createUser( user: IUser ): Promise<IUser> {
        const newUser = await User._userRepository.create(user);
        return <IUser>newUser;
    }

    public static async getUser(userID: string): Promise<IUser> {
        const user = await User._userRepository.findById(userID);
        return <IUser>user;
    }

    public static async removeUser(userID: string): Promise<any> {
        const res = await User._userRepository.delete(userID);
        return res.result;
    }
}