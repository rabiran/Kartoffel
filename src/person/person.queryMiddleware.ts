// import { KeyMap } from '../utils';
import { STATUS } from '../config/db-enums';
import { makeMiddleware } from '../helpers/queryTransform';
import { config } from '../config/config';

const STATUS_ACTIVE = STATUS[0];

export const queryParamsRenameMap = {
  domainusers: 'domainUsers',
  'domainusers.datasource': 'domainUsers.dataSource',
  'domainusers.uniqeid': 'domainUsers.uniqueID',
  'domainusers.adfsuid': 'domainUsers.adfsUID',
  identitycard: 'identityCard',
  personalnumber: 'personalNumber',
  entitytype: 'entityType',
  servicetype: 'serviceType',
  firtsname: 'firstName',
  lastname: 'lastName',
  currentunit: 'currentUnit',
  dischargeday: 'dischargeDay',
  directgroup: 'directGroup',
  managedgroup: 'managedGroup',
  responsibilitylocation: 'responsibilityLocation',
  mobilephone: 'mobilePhone',
  fullname: 'fullName',
};

export const queryDefaults = {
  status: STATUS_ACTIVE,
};

const queryValuesAliases = config.queries.queryAliases.persons;

export const queryAllowedFields = ['currentUnit', 'domainUsers.dataSource', 'entityType', 
  'job', 'rank', 'responsibility', 'serviceType', 'status'];

export const serachAllowedFields = queryAllowedFields.concat(['fullName']); 

export const queryMiddleware = makeMiddleware({
  paramsRenameMap: queryParamsRenameMap,
  filterParams: queryAllowedFields,
  defaults: queryDefaults,
  valueAliases: queryValuesAliases,
});

export const searchMiddleware = makeMiddleware({
  paramsRenameMap: queryParamsRenameMap,
  filterParams: serachAllowedFields,
  defaults: queryDefaults,
  valueAliases: queryValuesAliases,
});
