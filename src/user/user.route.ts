import { Request, Response, NextFunction, Router } from 'express';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { User } from './user.controller';

// const user = new User();
const users = Router();


users.get('/smpl/getAll', ch(User.getUsers, (req: Request, res: Response, next: NextFunction): Array<any> => []));

users.get('/getAll', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await User.getUsers();
        return res.json(result || { message: 'OK' });
    } catch (error) {
        return res.status(500).json(error);
    }
});


export = users;
