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

kartoffeln.get('/', ch(Kartoffel.getKartoffeln, (req: Request) => [req.query]));

kartoffeln.get('/:id', (req: Request, res: Response) => {
  ch(Kartoffel.getKartoffel, (req: Request, res: Response) => {
    const toPopulate = req.query.populate ? req.query.populate.split(',') : null; 
    return [req.params.id, toPopulate]; 
  }, 404)(req, res, null);
});

kartoffeln.get('/getAll', ch(Kartoffel.getAllKartoffeln, (): any[] => []));

kartoffeln.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params') , ch(Kartoffel.getUpdatedFrom, (req: Request) => {
  let from = req.params.from;
  if (typeof(from) === 'number') from = new Date(from);
  return [from, new Date()];
}));

kartoffeln.post('/',
                PermissionMiddleware.hasAdvancedPermission,
                ch(Kartoffel.createKartoffel, (req: Request, res: Response) => {
                  const kartoffel = filterObjectByKeys(req.body, KARTOFFEL_BASIC_FIELDS);
                  const parentID = req.body.parentID;
                  return [kartoffel, parentID];
                }, 400));

kartoffeln.get('/:id/old', validatorMiddleware(Vld.toDo, ['id'], 'params'), (req: Request, res: Response) => {
  const getFunction = (req.query.populated === 'true') ? Kartoffel.getKartoffelPopulated : Kartoffel.getKartoffelOld;
  ch(getFunction, (req: Request, res: Response) => {
    return [req.params.id];
  }, 404)(req, res, null);

});

kartoffeln.get('/:id/members', ch(Kartoffel.getAllMembers, (req: Request, res: Response) =>  [req.params.id]));

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
