export abstract class Condition<T= any> {
  abstract check(val: T): boolean;

  static and<T>(val: T, ...conditions: Condition<T>[]) {
    for (const c of conditions) {
      if (!c.check(val)) return false;
    }
    return true;
  }
}

export interface ConditionConstructor<T = any> {
  new (path: string[], value: unknown): Condition<T>;
}
