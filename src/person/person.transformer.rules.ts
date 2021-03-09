import { TransformerStore, TransformerConfig } from '../scopes/fieldTransformer/TransformerStore';
import { IPerson } from './person.interface';
import rulesConfig from '../config/scopeRules';



export class PersonTransformerStore extends TransformerStore<IPerson> {

  constructor(private transformers: TransformerConfig[]) {
    super();
  }

  initialize() {
    for (const tOpts of this.transformers) {
      this.addTransformer(tOpts);
    }
  }
}

export default new PersonTransformerStore(rulesConfig.persons.transformers);
