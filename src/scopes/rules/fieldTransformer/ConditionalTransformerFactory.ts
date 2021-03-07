import { ClassFactory } from '../../../helpers/DynamicClassFactory';
import { ConditionalTransform, ArrayFilter } from './ConditionalTransformer';

type ConditionalTransformerOpts = {
  targetField: string | string[],
  conditions: {
    className: string;
    field: string | string[];
    value: string | string[];
  }
};


class ConditionalTransformerFactory 
extends ClassFactory<ConditionalTransform<any>> {
  create(name: string, opts: ConditionalTransformerOpts) {
    return new this.classStore[name]()
  }
}