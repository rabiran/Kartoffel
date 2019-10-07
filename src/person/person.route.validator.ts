import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

// fields in alphebetical order
export const createAllowedFileds =  ['address', 'clearance', 'currentUnit', 'directGroup', 
  'dischargeDay', 'domainUsers','entityType', 'firstName', 'identityCard', 'job', 'lastName', 'mail', 
  'managedGroup', 'mobilePhone', 'personalNumber', 'phone', 'rank', 'responsibility', 
  'responsibilityLocation', 'serviceType'];

export const updateAllowedFields = _.without(createAllowedFileds, 'directGroup', 'identityCard', 'personalNumber');

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);
