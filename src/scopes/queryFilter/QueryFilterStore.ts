import { QueryFilter, Filter } from './QueryFilter';


export type FilterConfig = {
  name: string;
  field: string;
  values: any | any[]
};

export class QueryFilterStore<T extends Filter> {
  private filterMap: Map<string, QueryFilter<T, keyof T>>;

  constructor(initialFilters: FilterConfig[] = []) {
    this.filterMap = new Map<string, QueryFilter<T, keyof T>>();
    this.initialize(initialFilters);
  }

  addFilter = (config: FilterConfig) => {
    const { name, field } = config;
    const values = (Array.isArray(config.values) ? config.values : [config.values]) as T[keyof T];
    this.filterMap.set(name, new QueryFilter<T, keyof T>(field, values));
  }

  getFilter = (name: string) =>  {
    return this.filterMap.get(name);
  }

  private initialize = (filters: FilterConfig[]) => {
    for (const config of filters) {
      this.addFilter(config);
    }
  }
  
}
