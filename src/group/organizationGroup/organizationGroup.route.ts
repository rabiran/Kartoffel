import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../../utils';
import { controllerHandler as ch } from '../../helpers/controller.helper';
import { PermissionMiddleware } from '../../middlewares/permission.middleware';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { OrganizationGroup } from './organizationGroup.controller';
import { Person } from '../../person/person.controller';
import { IOrganizationGroup, ORGANIZATION_GROUP_BASIC_FIELDS } from './organizationGroup.interface';
import { OGRouteValidate } from './organizationGroup.route.validator';
import { validatorMiddleware, RouteParamsValidate as Vld } from '../../helpers/route.validator';
import { extractGroupQuery } from './organizationGroup.extractQuery';

// import { body, param, check, validationResult } from 'express-validator/check';

const organizationGroups = Router();

organizationGroups.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

organizationGroups.get('/', ch(OrganizationGroup.getOrganizationGroups, (req: Request) => [req.query]));

organizationGroups.get('/search', ch(
  OrganizationGroup.searchGroups,
  (req: Request) => [extractGroupQuery(req.query)]
));

organizationGroups.get('/:id', 
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          ch(OrganizationGroup.getOrganizationGroup, (req: Request) => {
            const toPopulate = req.query.populate ? req.query.populate.split(',') : null;
            return [req.params.id, toPopulate];
          }));
organizationGroups.get(
  '/:id/search',
  validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
  ch(OrganizationGroup.searchGroups, (req: Request) => [
    extractGroupQuery(req.query),
    { underGroupId: req.params.id },
  ])
);

organizationGroups.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params'), 
ch(OrganizationGroup.getUpdatedFrom, (req: Request) => {
  let from = req.params.from;
  if (typeof (from) === 'number') from = new Date(from);
  return [from, new Date()];
}));

organizationGroups.get('/path/:path', 
ch(OrganizationGroup.getOrganizationGroupByHierarchy, (req: Request) => {
  const hierarchy = req.params.path.split('/');
  const name = hierarchy.pop();
  return [name, hierarchy];
}));

organizationGroups.get('/path/:path/hierarchyExistenceChecking', 
ch(OrganizationGroup.getIDofOrganizationGroupsInHierarchy, (req: Request) => {
  const hierarchy = req.params.path.split('/');
  return [hierarchy];
}));

organizationGroups.get('/akaUnit/:akaUnit', 
ch(OrganizationGroup.getOrganizationGroupByAkaUnit, (req: Request) => {
  const akaUnit = req.params.akaUnit;
  return [akaUnit];
}));

organizationGroups.post('/',
  PermissionMiddleware.hasAdvancedPermission,
  validatorMiddleware(OGRouteValidate.creation),
  ch(OrganizationGroup.createOrganizationGroup, (req: Request) => {
    const organizationGroup = filterObjectByKeys(req.body, ORGANIZATION_GROUP_BASIC_FIELDS);
    const parentId = req.body.parentId;
    return [organizationGroup, parentId];
  }));

organizationGroups.get('/:id/members', 
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          ch(OrganizationGroup.getAllMembers, (req: Request, res: Response) => [req.params.id]));


organizationGroups.get('/:id/children', validatorMiddleware(Vld.validMongoId, ['id'], 'params'), 
  validatorMiddleware(OGRouteValidate.maxDepth, ['maxDepth'], 'query'),
  ch(OrganizationGroup.getOffsprings, (req: Request) => [req.params.id, Number(req.query.maxDepth)]));

organizationGroups.put('/adoption', PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(OGRouteValidate.adoption, ['parentId', 'childIds']),
          validatorMiddleware(Vld.validMongoId, ['parentId']),
          validatorMiddleware(Vld.validMongoIdArray, ['childIds']),
          ch(OrganizationGroup.childrenAdoption, (req: Request) => [req.body.parentId, req.body.childIds]));

organizationGroups.put('/:id',
  PermissionMiddleware.hasAdvancedPermission,
  validatorMiddleware(OGRouteValidate.update),
  ch(OrganizationGroup.updateOrganizationGroup, (req: Request) => {
    return [req.params.id, req.body];
  }));

organizationGroups.delete('/:id', PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          ch(OrganizationGroup.hideGroup, (req: Request) => [req.params.id]));

export = organizationGroups;
