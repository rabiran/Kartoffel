import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../../utils';
import { controllerHandler as ch } from '../../helpers/controller.helper';
import { PermissionMiddleware } from '../../middlewares/permission.middleware';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { Kartoffel } from './kartoffel.controller';
import { User } from '../../user/user.controller';
import { IKartoffel, KARTOFFEL_BASIC_FIELDS } from './kartoffel.interface';
import { GroupRouteParamsValidate as Vld, validatorMiddleware } from './kartoffel.route.validator';
// import { body, param, check, validationResult } from 'express-validator/check';

const kartoffeln = Router();

kartoffeln.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

kartoffeln.get('/getAll', ch(Kartoffel.getAllKartoffeln, (): Array<any> => []));

kartoffeln.post('/',
    PermissionMiddleware.hasAdvancedPermission,
    ch(Kartoffel.createKartoffel, (req: Request, res: Response) => {
        const kartoffel = filterObjectByKeys(req.body, KARTOFFEL_BASIC_FIELDS);
        const parentID = req.body.parentID;
        return [kartoffel, parentID];
    }, 400)
);

kartoffeln.get('/:id', validatorMiddleware(Vld.toDo, ['id'], 'params'),
    ch(Kartoffel.getKartoffel, (req: Request, res: Response) => {
    return [req.params.id];
}, 404));

kartoffeln.put('/adoption',
    PermissionMiddleware.hasAdvancedPermission,
    validatorMiddleware(Vld.differentParams, ['parentID', 'childID']),
    ch(Kartoffel.childrenAdoption, (req: Request, res: Response) => {
        const parentID = req.body.parentID;
        const childID = req.body.childID;
        return [parentID, [childID]];
    }, 400));

kartoffeln.delete('/:id',
    PermissionMiddleware.hasAdvancedPermission,
    ch(Kartoffel.deleteGroup, (req: Request) => {
        return [req.params.id];
    }, 400));

export = kartoffeln;
