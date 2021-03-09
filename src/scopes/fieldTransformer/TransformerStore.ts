import { ConditionalTransform } from './ConditionalTransformer';
import { createTransformer, registerToFactory, TransformerOpts } from './';

export type TransformerConfig = TransformerOpts & {
  name: string;
};

export abstract class TransformerStore<T> {
  private transformerMap: Map<string, ConditionalTransform<T>>;

  constructor() {
    this.transformerMap = new Map<string, ConditionalTransform<T>>();
    registerToFactory();
  }

  addTransformer(config: TransformerConfig) {
    const { name, ...transformerOpts } = config;
    this.transformerMap.set(name, createTransformer(transformerOpts.className, transformerOpts));
  }

  getTransformer(name: string) {
    return this.transformerMap.get(name);
  }

  protected abstract initialize(): void;
  
}
