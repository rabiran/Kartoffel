import { Request, Response, NextFunction, Router } from 'express';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { PermissionMiddleware } from '../middlewares/permission.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { Person } from './person.controller';
import { validatorMiddleware, RouteParamsValidate as Vld } from '../helpers/route.validator';
import { atCreateFieldCheck, atUpdateFieldCheck } from './person.route.validator';
import { extractFilters, extractSearchQuery } from './person.extractQuery';

const persons = Router();

persons.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

persons.get('/', ch(Person.getPersons, (req: Request) => [extractFilters(req.query)]));

persons.get('/search', ch(Person.searchPersons, 
  (req: Request) => [extractSearchQuery(req.query)])
);

persons.get('/getUpdated/:from',  
  validatorMiddleware(Vld.dateOrInt, ['from'], 'params'), 
  ch(Person.getUpdatedFrom, (req: Request) => {
    let from = req.params.from;
    if (typeof(from) === 'number') from = new Date(from);
    return [from, new Date(), extractFilters(req.query)];
  }
));

persons.post('/', PermissionMiddleware.hasAdvancedPermission,
           validatorMiddleware(atCreateFieldCheck),
           ch(Person.createPerson, (req: Request) => [req.body]));

persons.post('/:id/domainUsers', PermissionMiddleware.hasAdvancedPermission,
            validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
            ch(Person.addNewUser, (req: Request) => 
              [req.params.id, req.body]));

persons.put('/:id/domainUsers/:uniqueID', PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          ch(Person.updateDomainUser, (req: Request) => 
            [req.params.id, req.params.uniqueID, req.body]));

persons.delete('/:id/domainUsers/:uniqueID', PermissionMiddleware.hasAdvancedPermission,
            validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
            ch(Person.deleteDomainUser, (req: Request) => 
              [req.params.id, req.params.uniqueID]));

persons.get('/:id', 
            validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
            ch(Person.getPersonByIdWithFilter, (req: Request) => [req.params.id]));

persons.get('/identifier/:identityValue', ch(Person.getPersonByIdentifier, (req: Request) => 
  [['personalNumber', 'identityCard'], req.params.identityValue]
));

persons.get('/personalNumber/:personalNumber', ch(Person.getPerson, (req: Request) => 
  ['personalNumber', req.params.personalNumber]
));

persons.get('/identityCard/:identityCard', ch(Person.getPerson, (req: Request) => 
  ['identityCard', req.params.identityCard]
));

persons.get('/domainUser/:domainUser', 
  ch(Person.getByDomainUser, (req: Request) => [req.params.domainUser]));

persons.delete('/:id', PermissionMiddleware.hasAdvancedPermission, 
  validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
  ch(Person.discharge, (req: Request) => [req.params.id]));

// persons.put('/:id/personal',
//           PermissionMiddleware.hasPersonsPermission,
//           ch(Person.updatePerson, (req: Request, res: Response) => {
//             if (req.params.id !== req.body.id) return res.status(400).send('Person ID doesn\'t match');
//             const toUpdate = filterObjectByKeys(req.body, EDITABLE_FIELDS.concat('_id'));
//             return [req.params.id, toUpdate];
//           }, 404));

persons.put('/:id',
          PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          validatorMiddleware(atUpdateFieldCheck),
          ch(Person.updatePerson, (req: Request) =>  [req.params.id, req.body]));

persons.put('/:id/assign',
          PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          validatorMiddleware(Vld.validMongoId, ['group']),
          ch(Person.assign, (req: Request) => [req.params.id, req.body.group]));

persons.put('/:id/manage',
          PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          validatorMiddleware(Vld.validMongoId, ['group']),
          ch(Person.manage, (req: Request) => [req.params.id, req.body.group]));

// no one uses this route?
persons.put('/:id/resign',
          PermissionMiddleware.hasAdvancedPermission,
          validatorMiddleware(Vld.validMongoId, ['id'], 'params'),
          ch(Person.resign, (req: Request) => {
            const personID  = req.params.person;
            const groupID  = req.body.group;
            return [personID, groupID];
          }));

export = persons;
