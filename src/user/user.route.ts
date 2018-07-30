import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../utils';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { PermissionMiddleware } from '../middlewares/permission.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { User } from './user.controller';
import { IUser, PERSONAL_FIELDS, USER_FIELDS } from './user.interface';
import { UserRouteParamsValidate as Vld, validatorMiddleware } from './user.route.validator';

// const user = new User();
const users = Router();

users.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

users.get('/getAll', ch(User.getUsers, (): any[] => []));

users.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params') , 
          ch(User.getUpdatedFrom, (req: Request) => {
            let from = req.params.from;
            if (typeof(from) === 'number') from = new Date(from);
            return [from, new Date()];
          }
));

users.post('/', 
           PermissionMiddleware.hasAdvancedPermission,
           ch(User.createUser, (req: Request) => [req.body]));

users.get('/:id', (req: Request, res: Response) => {
  ch(User.getUser, (req: Request, res: Response) => {
    return [req.params.id]; 
  }, 404)(req, res, null);
});

users.delete('/:id',
             PermissionMiddleware.hasAdvancedPermission, 
             ch(User.removeUser, (req: Request) => {
               return [req.params.id];
             }, 404));

users.put('/:id/personal',
          PermissionMiddleware.hasUsersPermission,
          ch(User.updateUser, (req: Request, res: Response) => {
            if (req.params.id !== req.body._id) return res.status(400).send('User ID doesn\'t match');
            const toUpdate = filterObjectByKeys(req.body, PERSONAL_FIELDS.concat('_id'));
            return [toUpdate];
          }, 404));

users.put('/',
          PermissionMiddleware.hasAdvancedPermission,
          ch(User.updateUser, (req: Request, res: Response) => {
            const toUpdate = filterObjectByKeys(req.body, USER_FIELDS.concat('_id'));
            return [toUpdate];
          }, 404));

users.put('/:id/assign',
          PermissionMiddleware.hasAdvancedPermission,
          ch(User.assign, (req: Request, res: Response) => {
            const userID  = req.params.user;
            const groupID  = req.body.group;
            return [userID, groupID];
          }, 404));

users.put('/:id/dismiss',
          PermissionMiddleware.hasAdvancedPermission,
          ch(User.dismiss, (req: Request, res: Response) => {
            const userID  = req.params.user;
            return [userID];
          }, 404));

users.put('/:id/manage',
          PermissionMiddleware.hasAdvancedPermission,
          ch(User.manage, (req: Request, res: Response) => {
            const userID  = req.params.user;
            const groupID  = req.body.group;
            return [userID, groupID];
          }, 404));

users.put('/:id/resign',
          PermissionMiddleware.hasAdvancedPermission,
          ch(User.resign, (req: Request, res: Response) => {
            const userID  = req.params.user;
            const groupID  = req.body.group;
            return [userID, groupID];
          }, 404));

export = users;
