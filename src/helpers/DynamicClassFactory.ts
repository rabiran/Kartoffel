export class ClassFactory<T, 
  TCTOR extends new (...args: unknown[]) => T = new (...args: any[]) => T> {
  protected classStore: {
    [k: string]: TCTOR;
  } = {};
  registerClass(name: string, conditionClass: TCTOR) {
    this.classStore[name] = conditionClass;
  }
  create(className: string, ...params: unknown[]): T {
    return new this.classStore[className](...params);
  }
}
