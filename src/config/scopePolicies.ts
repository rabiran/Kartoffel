import { DATA_SOURCE } from './db-enums';

const sensitive2HierarchyCondition = {
  className: 'HierarchyCondition',
  field: 'hierarchy',
  value: `root/sensitive2`,
};

const sensitiveDataSource = DATA_SOURCE[0];
const sensitive2DataSource = DATA_SOURCE[1];

const rules = {
  person: { 
    filters: [
      {
        name: 'hideSensitivePersons',
        field: 'hierarchy',
        values: `root/sensitive`,
      },
    ],
    transformers: [
      {
        name: 'removeSensitiveDomainUsers',
        className: 'ArrayFilter',
        targetField: 'domainUsers',
        conditions: [{
          className: 'SimpleValueCondition',
          field: 'dataSource',
          value: `${sensitiveDataSource}`,
        }],
      },
      {
        name: 'removeJob',
        className: 'FieldExclude',
        targetField: 'job',
      },
      {
        name: 'removeSensitive2DomainUsersHierarchy',
        className: 'ArrayMapper',
        targetField: 'domainUsers',
        transformer: {
          className: 'FieldExclude',
          targetField: 'hierarchy',
          conditions: [{
            className: 'SimpleValueCondition',
            field: 'dataSource',
            value: `${sensitive2DataSource}`,
          }],
        },
      },
      {
        name: 'removeSensitive2Hierarchy',
        className: 'FieldExclude',
        targetField: 'hierarchy',
        conditions: [sensitive2HierarchyCondition],
      },
      {
        name: 'removeSensitive2DirectGroup',
        className: 'FieldExclude',
        targetField: 'directGroup',
        conditions: [sensitive2HierarchyCondition],
      },
    ],
  },
  organizationGroup: {},
};

const scopes = {
  externalScope: [
    'hideSensitivePersons', 'removeSensitiveDomainUsers', 'removeJob', 'removeSensitive2DomainUsersHierarchy',
    'removeSensitive2Hierarchy', 'removeSensitive2DirectGroup',
  ],
};

export default {
  rules,
  scopes,
};
