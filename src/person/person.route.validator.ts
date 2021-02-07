import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

// fields in alphebetical order
export const createAllowedFileds =  ['address', 'birthDate', 'clearance', 'currentUnit', 'directGroup', 
  'dischargeDay', 'domainUsers','entityType', 'firstName', 'identityCard', 'job', 'lastName', 'mail', 
  'managedGroup', 'mobilePhone', 'personalNumber', 'phone', 'pictures', 'rank', 'responsibility', 
  'responsibilityLocation', 'serviceType', 'sex', 'status'];

export const updateAllowedFields = _.without(createAllowedFileds, 'birthDate', 'directGroup', 'domainUsers', 'sex');

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);

export const atSearchFieldCheck = RPV.fieldExistanceGenerator(['fullname'], true);
