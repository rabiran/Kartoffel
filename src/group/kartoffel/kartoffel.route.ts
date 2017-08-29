import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../../utils';
import { controllerHandler as ch } from '../../helpers/controller.helper';
import { PermissionMiddleware } from '../../middlewares/permission.middleware';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { Kartoffel } from './kartoffel.controller';
import { IKartoffel, KARTOFFEL_BASIC_FIELDS } from './kartoffel.interface';

const users = Router();

users.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

users.get('/getAll', ch(Kartoffel.getAllKartoffeln, (): Array<any> => []));

users.post('/',
    PermissionMiddleware.hasAdvancedPermission,
    ch(Kartoffel.createKartoffel, (req: Request, res: Response) => {
        const kartoffel = filterObjectByKeys(req.body, KARTOFFEL_BASIC_FIELDS);
        const parentID = req.body.parentID;
        return [kartoffel, parentID];
    }, 400));

export = users;
