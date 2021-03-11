import { ConditionalTransform } from './ConditionalTransformer';
import { createTransformer, registerToFactory, TransformerOpts } from './';

export type TransformerConfig = TransformerOpts & {
  name: string;
};

export class TransformerStore<T> {
  private transformerMap: Map<string, ConditionalTransform<T>>;

  constructor(initialTransformers: TransformerConfig[] = []) {
    this.transformerMap = new Map<string, ConditionalTransform<T>>();
    registerToFactory();
    this.initialize(initialTransformers);
  }

  addTransformer(config: TransformerConfig) {
    const { name, ...transformerOpts } = config;
    this.transformerMap.set(name, createTransformer(transformerOpts.className, transformerOpts));
  }

  getTransformer(name: string) {
    return this.transformerMap.get(name);
  }

  protected initialize(transformers: TransformerConfig[]) {
    for (const config of transformers) {
      this.addTransformer(config);
    }
  }
  
}
