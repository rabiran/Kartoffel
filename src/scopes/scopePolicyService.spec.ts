import * as chai from 'chai';
import { ScopePolicyService, PolicyConfig, ScopePolicyMap } from './ScopePolicyService';
import { IPerson } from '../person/person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { PersonExcluderQuery } from '../person/person.excluder.query';
import { GroupExcluderQuery } from '../group/organizationGroup/organizationGroup.excluder.query';

const expect = chai.expect;

const personPolicy: PolicyConfig = {
  transformers: [
    {
      name: 'remove_AB_hierarchy',
      className: 'FieldExclude',
      targetField: 'hierarchy',
      conditions: [
        {
          className: 'HierarchyCondition',
          field: 'hierarchy',
          value: ['a/b'],
        },
      ],
    },
    {
      name: 'filter_CT_users',
      className: 'ArrayFilter',
      targetField: 'domainUsers',
      conditions: [
        {
          className: 'SimpleValueCondition',
          field: 'dataSource',
          value: 'ct',
        },
      ],
    },
    {
      name: 'remove_ES_users_adfsUID',
      className: 'ArrayMapper',
      targetField: 'domainUsers',
      transformer: {
        className: 'FieldExclude',
        targetField: 'adfsUID',
        conditions: [
          {
            className: 'SimpleValueCondition',
            field: 'dataSource',
            value: 'es',
          },
        ],
      },
    },
  ],
  filters: [
    {
      name: 'exclude_AB_hierarchy',
      field: 'hierarchy',
      values: ['a/b'],
    },
    {
      name: 'exclude_AD_hierarchy',
      field: 'hierarchy',
      values: ['a/d'],
    },
    {
      name: 'exclude_high_rank',
      field: 'rank',
      values: ['mega', 'ultimate'],
    },
  ],
};

const groupPolicy: PolicyConfig = {
  transformers: [
    {
      name: 'remove_AB_exact_hierarchy',
      className: 'FieldExclude',
      targetField: 'hierarchy',
      conditions: [
        {
          className: 'HierarchyCondition',
          field: 'hierarchy',
          value: ['a'],
        },
        {
          className: 'SimpleValueCondition',
          field: 'name',
          value: 'b',
        },
      ],

    },
  ],
};

const scopePolicyMap: ScopePolicyMap = {
  scope1: ['remove_AB_hierarchy', 'filter_CT_users'],
  scope2: ['remove_ES_users_adfsUID'],
  scope3: ['exclude_AB_hierarchy', 'exclude_high_rank', 'exclude_AD_hierarchy'],
  scope4: ['remove_AB_exact_hierarchy'],
};

const person_with_AB_hierarchy_and_CT_user: IPerson = {
  firstName: 'yuu',
  lastName: 'yoo',
  directGroup: 'asdasdasd',
  identityCard: '11111111',
  entityType: 'agumon',
  job: 'weatherMan',
  hierarchy: ['a','b'],
  domainUsers: [
    {
      uniqueID: 'aaa@yay',
      adfsUID: 'aaa@yay.com',
      dataSource: 'ct',
    },
    {
      uniqueID: 'rrr@es',
      adfsUID: 'rrr@es.com',
      dataSource: 'es',
    },
    {
      uniqueID: 'aaa@ser',
      adfsUID: 'aaa@ser.com',
      dataSource: 'ser',
    },
  ],
};

const person_with_AC_hierarchy = {
  firstName: 'yuu',
  lastName: 'yoo',
  directGroup: 'asdasdasd',
  identityCard: '11111111',
  entityType: 'agumon',
  job: 'weatherMan',
  hierarchy: ['a', 'c'],
  domainUsers: [
    {
      uniqueID: 'aaa@yay',
      adfsUID: 'aaa@yay.com',
      dataSource: 'es',
    },
  ],
};

const group_AB: IOrganizationGroup = {
  name: 'b',
  hierarchy: ['a'],
  createdAt: new Date(),
};

const group_AC: IOrganizationGroup = {
  name: 'c',
  hierarchy: ['a'],
  createdAt: new Date(),
};

const personScopePolicyService = new ScopePolicyService<IPerson, PersonExcluderQuery>(personPolicy, scopePolicyMap);
const groupScopePolicyService = new ScopePolicyService<IOrganizationGroup, GroupExcluderQuery>(groupPolicy, scopePolicyMap);


describe('ScopePolicyService class',() => {
  it('should perform person transformation correctly (exclude field and filter array)', () => {
    const result = personScopePolicyService.applyTransform(person_with_AB_hierarchy_and_CT_user, 'scope1');
    expect(result.hierarchy).to.not.exist;
    expect(result.domainUsers).to.be.an('array').with.lengthOf(2);
  });

  it('should perform person transformation correctly (array mapper)', () => {
    const result = personScopePolicyService.applyTransform(person_with_AB_hierarchy_and_CT_user, 'scope2');
    expect(result.domainUsers).to.be.an('array').with.lengthOf(3);
    for (const user of result.domainUsers) {
      if (user.dataSource === 'es') {
        expect(user.adfsUID).to.not.exist;
      } else {
        expect(user.adfsUID).to.exist;
      }
    }
  });
  it('should perform group transformation correctly (exclude field with multiple conditions)', () => {
    const result = groupScopePolicyService.applyTransform(group_AB, 'scope4');
    expect(result).to.exist;
    expect(result.hierarchy).to.not.exist;
  });
  it('should not change the person', () => {
    const result = personScopePolicyService.applyTransform(person_with_AC_hierarchy, 'scope1');
    expect(result.hierarchy).to.exist;
    expect(result.domainUsers).to.be.an('array').with.lengthOf(1);
  });
  it('should not change the group (multiple conditions)', () => {
    const result = groupScopePolicyService.applyTransform(group_AC, 'scope4');
    expect(result).to.exist;
    expect(result.hierarchy).to.exist;
  });
  it('should return the correct combined filter', () => {
    const combinedFilter = personScopePolicyService.getQueryFilter('scope3');
    expect(combinedFilter.rank).to.be.an('array').with.lengthOf(2);
    expect(combinedFilter.hierarchy).to.be.an('array').with.lengthOf(2);
    expect(combinedFilter.currentUnit).to.not.exist;
  });
});
