import { Condition, ConditionConstructor } from './Condition';
import { ClassFactory } from '../../../helpers/DynamicClassFactory';

export type ConditionOpts = {
  field: string | string[];
  value: string | string[];
};

export class ConditionFactory extends ClassFactory<Condition, ConditionConstructor> {
  create(name: string, opts: ConditionOpts) {
    const { field } = opts;
    const path = typeof field === 'string' ? [field] : field;
    return new this.classStore[name](path, opts.value);
  }
}

export default new ConditionFactory();
