import { Request, Response, NextFunction, Router } from 'express';
import { filterObjectByKeys } from '../utils';
import { controllerHandler as ch } from '../helpers/controller.helper';
import { PermissionMiddleware } from '../middlewares/permission.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { Person } from './person.controller';
import { IPerson, EDITABLE_FIELDS, PERSON_FIELDS } from './person.interface';
import { PersonRouteParamsValidate as Vld, validatorMiddleware } from './person.route.validator';

// const person = new Person();
const persons = Router();

persons.use('/', AuthMiddleware.verifyToken, PermissionMiddleware.hasBasicPermission);

persons.get('/getAll', ch(Person.getPersons, (): any[] => []));

persons.get('/getUpdated/:from', validatorMiddleware(Vld.dateOrInt, ['from'], 'params') , 
          ch(Person.getUpdatedFrom, (req: Request) => {
            let from = req.params.from;
            if (typeof(from) === 'number') from = new Date(from);
            return [from, new Date()];
          }
));

persons.post('/', 
           PermissionMiddleware.hasAdvancedPermission,
           ch(Person.createPerson, (req: Request) => [req.body]));

persons.get('/:id', (req: Request, res: Response) => {
  ch(Person.getPersonById, (req: Request, res: Response) => {
    return [req.params.id]; 
  }, 404)(req, res, null);
});

persons.get('/personalNumber/:personalNumber', (req: Request, res: Response) => {
  ch(Person.getPerson, (req: Request, res: Response) => {
    return ['personalNumber', req.params.personalNumber]; 
  }, 404)(req, res, null);
});

persons.get('/identityCard/:identityCard', (req: Request, res: Response) => {
  ch(Person.getPerson, (req: Request, res: Response) => {
    return ['identityCard', req.params.identityCard]; 
  }, 404)(req, res, null);
});

persons.delete('/:id',
             PermissionMiddleware.hasAdvancedPermission, 
             ch(Person.discharge, (req: Request) => {
               return [req.params.id];
             }, 404));

persons.put('/:id/personal',
          PermissionMiddleware.hasPersonsPermission,
          ch(Person.updatePerson, (req: Request, res: Response) => {
            if (req.params.id !== req.body._id) return res.status(400).send('Person ID doesn\'t match');
            const toUpdate = filterObjectByKeys(req.body, EDITABLE_FIELDS.concat('_id'));
            return [toUpdate];
          }, 404));

persons.put('/',
          PermissionMiddleware.hasAdvancedPermission,
          ch(Person.updatePerson, (req: Request, res: Response) => {
            const toUpdate = filterObjectByKeys(req.body, PERSON_FIELDS.concat('_id'));
            return [toUpdate];
          }, 404));

persons.put('/:id/assign',
          PermissionMiddleware.hasAdvancedPermission,
          ch(Person.assign, (req: Request, res: Response) => {
            const personID  = req.params.id;
            const groupID  = req.body.group;
            return [personID, groupID];
          }, 404));

persons.put('/:id/dismiss',
          PermissionMiddleware.hasAdvancedPermission,
          ch(Person.dismiss, (req: Request, res: Response) => {
            const personID  = req.params.id;
            return [personID];
          }, 404));

persons.put('/:id/manage',
          PermissionMiddleware.hasAdvancedPermission,
          ch(Person.manage, (req: Request, res: Response) => {
            const personID  = req.params.id;
            const groupID  = req.body.group;
            return [personID, groupID];
          }, 404));

persons.put('/:id/resign',
          PermissionMiddleware.hasAdvancedPermission,
          ch(Person.resign, (req: Request, res: Response) => {
            const personID  = req.params.person;
            const groupID  = req.body.group;
            return [personID, groupID];
          }, 404));

export = persons;
