import { ClassFactory } from '../../helpers/DynamicClassFactory';
import { ConditionalTransform, ConditionalTransformConstructor } from './ConditionalTransformer';
import { default as ConditionFactory, ConditionOpts } from './condition/ConditionFactory';

export type ConditionalTransformerOpts = {
  className?: string;
  targetField: string | string[],
  conditions?: (ConditionOpts & {
    className: string
  })[],
  transformer?: ConditionalTransformerOpts;
};


class ConditionalTransformerFactory 
extends ClassFactory<ConditionalTransform<any>, ConditionalTransformConstructor<any>> {
  create(name: string, opts: ConditionalTransformerOpts) {
    const { conditions = [], targetField, transformer: innerTransformer } = opts;
    const _conditions = conditions.map(
      ({ className, field, value }) => ConditionFactory.create(className, { field, value })
    );
    const targetFieldPath = typeof targetField === 'string' ? [targetField] : targetField;
    const transformer: ConditionalTransform<any> = innerTransformer ? 
      this.create(innerTransformer.className, innerTransformer) : null;
    return new this.classStore[name](targetFieldPath, _conditions, transformer);
  }
}

export default new ConditionalTransformerFactory();
