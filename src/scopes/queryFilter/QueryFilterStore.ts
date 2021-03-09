import { QueryFilter, Filter } from './QueryFilter';


export type FilterConfig = {
  name: string;
  field: string;
  values: any | any[]
};

export abstract class QueryFilterStore<T extends Filter> {
  private filterMap: Map<string, QueryFilter<T, keyof T>>;

  constructor() {
    this.filterMap = new Map<string, QueryFilter<T, keyof T>>();
    this.initialize();
  }

  addFilter(config: FilterConfig) {
    const { name, field } = config;
    const values = (Array.isArray(config.values) ? config.values : [config.values]) as T[keyof T];
    this.filterMap.set(name, new QueryFilter<T, keyof T>(field, values));
  }

  getFilter(name: string) {
    return this.filterMap.get(name);
  }

  protected abstract initialize(): void;
  
}
