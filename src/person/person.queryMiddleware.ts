import { STATUS } from '../config/db-enums';
import { makeMiddleware } from '../helpers/queryTransform';
import { config } from '../config/config';

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

export const filterQueryAllowedFields = ['currentUnit', 'domainUsers.dataSource', 'entityType', 
  'job', 'rank', 'responsibility', 'serviceType', 'status'];

export const searchQueryAllowedFields = filterQueryAllowedFields.concat(['fullName']);

const { aliases, defaults } = config.queries;

export const queryMiddleware = makeMiddleware({
  paramsRenameMap: queryParamsRenameMap,
  filterParams: filterQueryAllowedFields,
  defaults: defaults.persons,
  valueAliases: aliases.persons,
});

export const searchMiddleware = makeMiddleware({
  paramsRenameMap: queryParamsRenameMap,
  filterParams: searchQueryAllowedFields,
  defaults: defaults.persons,
  valueAliases: aliases.persons,
});
