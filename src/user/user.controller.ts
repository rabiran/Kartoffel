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

    // id: string, firstName: string,  lastName: string,
    // hierarchy: Array<string> = [],  directGroup: string = undefined,
    // weakGroups: Array<string> = [], adminGroups: Array<string> = [],
    // job: string = undefined,        mail: string = undefined,
    // phone: string = undefined,      isSecurityOfficer: boolean = false,
    // rank: Rank = 'Newbie',          securityOfficerLocation: string = undefined,
    // address: string = undefined,    clearance: number = 0

    public static async createUser( user: IUser ): Promise<IUser> {
        const newUser = await User._userRepository.create(user);
        return <IUser>newUser;
    }

    // public createUser = async ( user: IUser ): Promise<IUser> => {
    //     const newUser = await this._userService.create(user);
    //     return <IUser>newUser;
    // }
}