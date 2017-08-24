import { Request, Response, NextFunction, Router } from 'express';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { User } from './user.controller';
import { IUser } from './user.interface';

// const user = new User();
const users = Router();

users.get('/getAll', ch(User.getUsers, (req: Request, res: Response, next: NextFunction): Array<any> => []));

users.post('/', ch(User.createUser, (req: Request) => [req.body]));

users.get('/:userID', async (req: Request, res: Response, next: NextFunction) => {
    const userID  = req.params.userID;
    const user = await User.getUser(userID);
    if (!user) return res.status(404).send('There is no user with ID: ' + userID);
    else return res.json(user);
});

users.delete('/:userID', async (req: Request, res: Response, next: NextFunction) => {
    const userID  = req.params.userID;
    const result = await User.removeUser(userID);
    if (result.n === 0) return res.status(404).send('There is no user with ID: ' + userID);
    else return res.json(result);
});

export = users;
