import { getByPath, setByPath, deleteByPath } from '../../../utils';
import { Condition } from './condition/Condition';

export interface ConditionalTransform<T> {
  apply(source: T): Partial<T>;
}

type HaveArrayOf<K extends string, V> = {
  [k in K]: V[]
};

type ArrayItem<T> = T extends (infer I)[] ? I : never;

export class ArrayFilter<T>
implements ConditionalTransform<T> {
  constructor(
    private arrayKey: string,
    private conditions: Condition[]
  ) {}

  apply(source: T) {
    const filtered = source[this.arrayKey]
      .filter((item: any) => !Condition.and(item, ...this.conditions));
    return {
      ...source,
      [this.arrayKey]: filtered,
    };
  }
}

export class ArrayMapper<T, U> implements ConditionalTransform<T> {
  constructor(
    private arrayPath: string[],
    private transformer: ConditionalTransform<U>
  ) {}

  apply(source: T) {
    const transformed = getByPath(source, this.arrayPath)
      .map(this.transformer.apply);
    const copy = { ...source };
    setByPath(copy, this.arrayPath, transformed);
    return copy;
  }
}

export class FieldExclude<T> implements ConditionalTransform<T> {
  constructor(
    private fieldPath: string[],
    private conditions: Condition<T>[] = []
  ) {}

  apply(source: T) {
    if (Condition.and(source, ...this.conditions)) {
      const copy = { ...source };
      deleteByPath(copy, this.fieldPath);
      return copy;
    }
    return source;
  }
}

