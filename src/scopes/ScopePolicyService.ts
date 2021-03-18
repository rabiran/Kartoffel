import { TransformerStore, TransformerConfig } from './fieldTransformer/TransformerStore';
import { FilterConfig, QueryFilterStore } from './queryFilter/QueryFilterStore';
import { QueryFilter, Filter } from './queryFilter/QueryFilter';

export type PolicyConfig = {
  transformers?: TransformerConfig[];
  filters?: FilterConfig[];
};

export type ScopePolicyMap = {
  [k: string]: string[];
};

export class ScopePolicyService<TEntity, TFilter extends Filter> {
  private filters: QueryFilterStore<TFilter>;
  private transformers: TransformerStore<TEntity>;
  private scopePolicyMap: ScopePolicyMap;

  constructor(policies: PolicyConfig, scopePolicyMap: ScopePolicyMap) {
    const { transformers = [], filters = [] } = policies;
  
    this.transformers = new TransformerStore(transformers);
    this.filters = new QueryFilterStore(filters);
    this.scopePolicyMap = scopePolicyMap;
  }

  getQueryFilter = (scope: string) => {
    return QueryFilter.combine(
      ...(this.scopePolicyMap[scope] || [])
      .map(this.filters.getFilter)
      .filter(_ => !!_)
    );
  }

  applyTransform = (entity: TEntity, scope: string) => {
    const transformers = (this.scopePolicyMap[scope] || [])
      .map(name => this.transformers.getTransformer(name))
      .filter(transformer => !!transformer);
    let copy: Partial<TEntity> = { ...entity };
    for (const transformer of transformers) {
      copy = transformer.apply(copy as any);
    }
    return copy;
  }
}
