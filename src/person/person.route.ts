import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../utils';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { PermissionMiddleware } from '../middlewares/permission.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { Person } from './person.controller';
// import { IPerson, EDITABLE_FIELDS, PERSON_FIELDS } from './person.interface';
import { validatorMiddleware, RouteParamsValidate as Vld } from '../helpers/route.validator';
import { atCreateFieldCheck, atUpdateFieldCheck, atSearchFieldCheck, queryAllowedFields } from './person.route.validator';

import { makeMiddleware } from '../helpers/queryTransform';
import { fieldsCaseMap, fieldsDefaults } from './person.query';
import { config } from '../config/config';

// const person = new Person();
const persons = Router();

persons.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

persons.get('/', makeMiddleware(fieldsCaseMap, queryAllowedFields, fieldsDefaults, config.queries.persons), ch(Person.getPersons, (req: Request) => [req.query]));

persons.get('/search', validatorMiddleware(atSearchFieldCheck, null, 'query'),
  ch(Person.autocomplete, (req: Request) => [req.query.fullname]));

persons.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params'), 
          ch(Person.getUpdatedFrom, (req: Request) => {
            let from = req.params.from;
            if (typeof(from) === 'number') from = new Date(from);
            return [from, new Date()];
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
  ch(Person.getByDomainUserString, (req: Request) => [req.params.domainUser]));

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
