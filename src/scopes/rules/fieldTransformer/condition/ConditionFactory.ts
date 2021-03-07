import { Condition } from './Condition';
import { ClassFactory } from '../../../../helpers/DynamicClassFactory';

type ConditionOpts = {
  field: string | string[];
  value: string | string[];
};

export class ConditionFactory extends ClassFactory<Condition> {
  create(name: string, opts: ConditionOpts) {
    return new this.classStore[name](opts.field, opts.value);
  }
}

export default new ConditionFactory();

{
  className: 'arraFilter',
  conditions: [{
    className: 'hierafaf'
    arguments: ['hierarchy', ['a/c', 'a/d']]
  }]
}