import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

// fields in alphebetical order
export const createAllowedFileds =  ['address', 'clearance', 'currentUnit', 'directGroup', 
  'dischargeDay', 'domainUsers','entityType', 'firstName', 'identityCard', 'job', 'lastName', 'mail', 
  'managedGroup', 'mobilePhone', 'personalNumber', 'phone', 'pictures', 'rank', 'responsibility', 
  'responsibilityLocation', 'serviceType', 'status'];

export const updateAllowedFields = _.without(createAllowedFileds, 'directGroup', 'domainUsers');

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);

export const atSearchFieldCheck = RPV.fieldExistanceGenerator(['fullname'], true);
