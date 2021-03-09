import { default as ConditionalTransformerFactory, ConditionalTransformerOpts } from './ConditionalTransformerFactory';
import { ArrayFilter, FieldExclude, ArrayMapper } from './ConditionalTransformer';
import { registerToFactory as registerConditions } from './condition';

export function registerToFactory() {
  registerConditions();
  ConditionalTransformerFactory.registerClass(ArrayFilter.name, ArrayFilter);
  ConditionalTransformerFactory.registerClass(FieldExclude.name, FieldExclude);
  ConditionalTransformerFactory.registerClass(ArrayMapper.name, ArrayMapper);
}

export function createTransformer(transformerType: string, opts: ConditionalTransformerOpts) {
  return ConditionalTransformerFactory.create(transformerType, opts);
}

export type TransformerOpts = ConditionalTransformerOpts;
