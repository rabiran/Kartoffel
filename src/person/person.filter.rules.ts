import { QueryFilterStore, FilterConfig } from '../scopes/queryFilter/QueryFilterStore';

import rulesConfig from '../config/scopeRules';

export class PersonFilterStore extends QueryFilterStore<any> {

  constructor(private filters: FilterConfig[]) {
    super();
  }

  initialize() {
    for (const tOpts of this.filters) {
      this.addFilter(tOpts);
    }
  }
}

export default new PersonFilterStore(rulesConfig.persons.filters);