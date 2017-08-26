import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../utils';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { PermissionMiddleware } from '../middlewares/permission.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { User } from './user.controller';
import { IUser, PERSONAL_FIELDS } from './user.interface';

// const user = new User();
const users = Router();

users.all('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

users.get('/getAll', ch(User.getUsers, (): Array<any> => []));

users.post('/',
    PermissionMiddleware.hasAdvancedPermission,
    ch(User.createUser, (req: Request) => [req.body]));

users.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const userID  = req.params.id;
    const user = await User.getUser(userID);
    if (!user) return res.status(404).send('There is no user with ID: ' + userID);
    else return res.json(user);
});

users.delete('/:id',
    PermissionMiddleware.hasAdvancedPermission,
    async (req: Request, res: Response, next: NextFunction) => {
        const userID  = req.params.id;
        const result = await User.removeUser(userID);
        if (result.n === 0) return res.status(404).send('There is no user with ID: ' + userID);
        else return res.json(result);
});

users.put('/:id/personal',
    PermissionMiddleware.hasUsersPermission,
    ch(User.updateUser, (req: Request, res: Response) => {
        if (req.params.id != req.body._id) return res.status(400).send('User ID doesn\'t match');
        const toUpdate = filterObjectByKeys(req.body, PERSONAL_FIELDS.concat('_id'));
        return [toUpdate];
    }, 404));

export = users;
