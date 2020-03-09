import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

// fields in alphebetical order
export const createAllowedFileds =  ['address', 'clearance', 'currentUnit', 'directGroup', 
  'dischargeDay', 'domainUsers','entityType', 'firstName', 'identityCard', 'job', 'lastName', 'mail', 
  'managedGroup', 'mobilePhone', 'personalNumber', 'phone', 'rank', 'responsibility', 
  'responsibilityLocation', 'serviceType', 'status'];

export const updateAllowedFields = _.without(createAllowedFileds, 'directGroup', 'identityCard', 'personalNumber');

export const queryAllowedFields = ['currentUnit', 'domainUsers', 'domainUsers.dataSource', 'entityType', 
  'firstName','job', 'lastName', 'rank', 'responsibility', 'serviceType', 'status'];

export const serachAllowedFields = queryAllowedFields.concat(['fullName']); 

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);

export const atSearchFieldCheck = RPV.fieldExistanceGenerator(['fullname'], true);
