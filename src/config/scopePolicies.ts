const rules = {
  person: {
    transformers: [
      {
        name: 'filter8sockshierarchy',
        className: 'FieldExclude',
        targetField: 'hierarchy',
        conditions: [
          {
            className: 'HierarchyCondition',
            field: 'hierarchy',
            value: 'a/esocks',
          },
        ],
      },
    ],
    filters: [
      {
        name: 'hideMM',
        field: 'hierarchy',
        values: ['a/mm'],
      },
    ],
  },
  organizationGroup: {},
};

const scopes = {
  scope1: ['filter8sockshierarchy'],
};

export default {
  rules,
  scopes,
};
