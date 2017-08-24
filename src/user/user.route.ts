import { Request, Response, NextFunction, Router } from 'express';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { User } from './user.controller';
import { IUser } from './user.interface';

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

users.get('/:userID', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userID  = req.params.userID;
        const user = await User.getUser(userID);
        if (!user) {
            return res.status(404).send('There is no user with ID' + userID);
        }
        return res.json(user || { message: 'OK' });
    } catch (error) {
        return res.status(500).json(error);
    }
});

users.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const user: IUser = req.body;
    try {
        const result = await User.createUser(user);
        return res.json(result || { message: 'OK' });
    } catch (error) {
        console.log('Error creating a new User: ' + error);
        return res.status(400).json(error);
    }
});




export = users;
