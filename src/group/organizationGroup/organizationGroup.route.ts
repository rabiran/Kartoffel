import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../../utils';
import { controllerHandler as ch } from '../../helpers/controller.helper';
import { PermissionMiddleware } from '../../middlewares/permission.middleware';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { OrganizationGroup } from './organizationGroup.controller';
import { Person } from '../../person/person.controller';
import { IOrganizationGroup, ORGANIZATION_GROUP_BASIC_FIELDS } from './organizationGroup.interface';
import { atCreateFieldCheck, OGRouteValidate } from './organizationGroup.route.validator';
import { validatorMiddleware, RouteParamsValidate as Vld } from '../../helpers/route.validator';

// import { body, param, check, validationResult } from 'express-validator/check';

const organizationGroups = Router();

organizationGroups.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

organizationGroups.get('/', ch(OrganizationGroup.getOrganizationGroups, (req: Request) => [req.query]));

organizationGroups.get('/:id', (req: Request, res: Response) => {
  ch(OrganizationGroup.getOrganizationGroup, (req: Request, res: Response) => {
    const toPopulate = req.query.populate ? req.query.populate.split(',') : null;
    return [req.params.id, toPopulate];
  }, 404)(req, res, null);
});

organizationGroups.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params'), ch(OrganizationGroup.getUpdatedFrom, (req: Request) => {
  let from = req.params.from;
  if (typeof (from) === 'number') from = new Date(from);
  return [from, new Date()];
}));

organizationGroups.get('/path/:path', ch(OrganizationGroup.getOrganizationGroupByHierarchy, (req: Request) => {
  const hierarchy = req.params.path.split('/');
  const name = hierarchy.pop();
  return [name, hierarchy];
}, 404));

organizationGroups.get('/path/:path/hierarchyExistenceChecking', ch(OrganizationGroup.getIDofOrganizationGroupsInHierarchy, (req: Request) => {
  const hierarchy = req.params.path.split('/');
  return [hierarchy];
}));

organizationGroups.post('/',
  PermissionMiddleware.hasAdvancedPermission,
  validatorMiddleware(atCreateFieldCheck),
  ch(OrganizationGroup.createOrganizationGroup, (req: Request, res: Response) => {
    const organizationGroup = filterObjectByKeys(req.body, ORGANIZATION_GROUP_BASIC_FIELDS);
    const parentId = req.body.parentId;
    return [organizationGroup, parentId];
  }, 400
  ));

organizationGroups.get('/:id/old', validatorMiddleware(Vld.toDo, ['id'], 'params'), (req: Request, res: Response) => {
  const getFunction = (req.query.populated === 'true') ? OrganizationGroup.getOrganizationGroupPopulated : OrganizationGroup.getOrganizationGroupOld;
  ch(getFunction, (req: Request, res: Response) => {
    return [req.params.id];
  }, 404)(req, res, null);

});

organizationGroups.get('/:id/members', ch(OrganizationGroup.getAllMembers, (req: Request, res: Response) => [req.params.id]));

organizationGroups.put('/adoption', PermissionMiddleware.hasAdvancedPermission,
  validatorMiddleware(OGRouteValidate.adoption, ['parentId', 'childIds']),
  ch(OrganizationGroup.childrenAdoption, (req: Request, res: Response) => {
    const parentId = req.body.parentId;
    const childIds = req.body.childIds;
    return [parentId, childIds];
  }, 400
  ));

organizationGroups.delete('/:id', PermissionMiddleware.hasAdvancedPermission,
  ch(OrganizationGroup.hideGroup, (req: Request) => {
    return [req.params.id];
  }, 400
  )
);

export = organizationGroups;
