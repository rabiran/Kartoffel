import * as _ from 'lodash';
import { RouteParamsValidate as RPV } from '../helpers/route.validator';

export const createAllowedFileds =  ['entityType', 'firstName', 'lastName', 'currentUnit', 'job', 'mail', 'phone', 
  'address', 'mobilePhone', 'dischargeDay', 'directGroup', 'managedGroup', 'rank', 'responsibility', 
  'responsibilityLocation', 'clearance', 'identityCard', 'personalNumber', 'serviceType'];

export const updateAllowedFields = _.without(createAllowedFileds,'directGroup', 'personalNumber', 'identityCard');

export const atCreateFieldCheck = RPV.fieldExistanceGenerator(createAllowedFileds);

export const atUpdateFieldCheck = RPV.fieldExistanceGenerator(updateAllowedFields);
