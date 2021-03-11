import { IPerson } from '../person/person.interface';
import { TransformerStore, TransformerConfig } from './fieldTransformer/TransformerStore';
import { FilterConfig, QueryFilterStore } from './queryFilter/QueryFilterStore';
import { QueryFilter } from './queryFilter/QueryFilter';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { PersonExcluders } from '../person/person.controller';
import { GroupExcluders } from '../group/organizationGroup/organizationGroup.controller';
import scopeRulesConfig from '../config/scopeRules';

type RulesConfig = {
  person?: {
    transformers?: TransformerConfig[],
    filters?: FilterConfig[]
  },
  organizationGroup?: {
    transformers?: TransformerConfig[],
    filters?: FilterConfig[]
  },
};

type ScopeRuleMap = {
  [k: string]: string[]
};

export class ScopeRulesService {
  private personTransformers: TransformerStore<IPerson>;
  private personFilters: QueryFilterStore<PersonExcluders>;
  private groupTransformers: TransformerStore<IOrganizationGroup>;
  private groupFilters: QueryFilterStore<GroupExcluders>;
  private scopeRuleMap: ScopeRuleMap;

  constructor(rules: RulesConfig, scopeRuleMap: ScopeRuleMap) {
    const { transformers: gTransformers = [], filters: gFilters = [] } = rules.organizationGroup;
    const { transformers: pTransformers = [], filters: pFilters = [] } = rules.person;

    this.groupFilters = new QueryFilterStore(gFilters);
    this.groupTransformers = new TransformerStore(gTransformers);
    this.personFilters = new QueryFilterStore(pFilters);
    this.personTransformers = new TransformerStore(pTransformers);
    this.scopeRuleMap = scopeRuleMap;
  }

  applyPersonTransform(person: IPerson, scope: string) {
    return this.applyTransform(person, 'person', scope) as Partial<IPerson>;
  }

  applyGroupTransform(group: IPerson, scope: string) {
    return this.applyTransform(group, 'organizationGroup', scope) as Partial<IOrganizationGroup>;
  }

  getPersonFilter(scope: string) {
    return QueryFilter.combine(
      ...(this.scopeRuleMap[scope] || [])
      .map(this.personFilters.getFilter)
      .filter(_ => !!_)
    );
  }

  getGroupFilter(scope: string) {
    return QueryFilter.combine(
      ...(this.scopeRuleMap[scope] || [])
      .map(this.groupFilters.getFilter)
      .filter(_ => !!_)
    );
  }

  private applyTransform(
    entity: IPerson | IOrganizationGroup, 
    entityName: 'person' | 'organizationGroup',
    scope: string
  ) {
    const tStore = entityName === 'person' ? this.personTransformers : this.groupTransformers;
    const transformers = (this.scopeRuleMap[scope] || [])
      .map(name => tStore.getTransformer(name))
      .filter(transformer => !!transformer);
    let copy: Partial<IPerson> | Partial<IOrganizationGroup> = { ...entity };
    for (const transformer of transformers) {
      copy = transformer.apply(copy as any);
    }
    return copy;
  }
}

export default new ScopeRulesService(scopeRulesConfig.rules, scopeRulesConfig.scopes);