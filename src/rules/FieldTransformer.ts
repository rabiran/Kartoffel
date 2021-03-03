import { getByPath } from '../utils';

abstract class Condition<T= any> {
  abstract check(val: T): boolean;

  static and<T>(val: T, ...conditions: Condition<T>[]) {
    for (const c of conditions) {
      if (!c.check(val)) return false;
    }
    return true;
  }
}


// export class Condition<T> {
//   constructor(
//     private path: string[],
//     private value: any
//   ) {}

//   check(obj: T) {
//     return getByPath(obj, this.path) === this.value;
//   }

// }

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

export class ArrayMapper<T, U>
implements ConditionalTransform<T> {
  constructor(
    private arrayPath: string[],
    private transformer: ConditionalTransform<U>
  ) {}

  apply(source: T) {
   
  }
}
