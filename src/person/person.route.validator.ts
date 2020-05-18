import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

// fields in alphebetical order
export const createAllowedFileds =  ['address', 'clearance', 'currentUnit', 'directGroup', 
  'dischargeDay', 'domainUsers','entityType', 'firstName', 'identityCard', 'job', 'lastName', 'mail', 
  'managedGroup', 'mobilePhone', 'personalNumber', 'phone', 'rank', 'responsibility', 
  'responsibilityLocation', 'serviceType', 'status'];

export const updateAllowedFields = _.without(createAllowedFileds, 'directGroup', 'identityCard', 'personalNumber', 'domainUsers');

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);

export const atSearchFieldCheck = RPV.fieldExistanceGenerator(['fullname'], true);


export type allowedUpdateType = 'address'| 'clearance'| 'currentUnit'|  
'dischargeDay'| 'entityType'| 'job'| 'lastName'| 'mail'| 
'managedGroup'| 'mobilePhone'| 'phone'| 'rank'| 'responsibility'| 
'responsibilityLocation'| 'serviceType'| 'status';
