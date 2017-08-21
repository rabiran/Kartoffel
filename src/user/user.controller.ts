import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository';
import { IUser } from './user.interface';

export class User {
    static _userRepository: UserRepository = new UserRepository();
    _userService: UserRepository;

    constructor() {
        this._userService = new UserRepository();
    }

    public static async getUsers(): Promise<IUser[]> {
        const users = await this._userRepository.getAllUsers();
        return users;
    }
}