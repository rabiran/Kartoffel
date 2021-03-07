export class ClassFactory<T> {
  protected classStore: {
    [k: string]: new (...args: any[]) => T;
  } = {};
  registerClass(name: string, conditionClass: new (...args: any[]) => T) {
    this.classStore[name] = conditionClass;
  }
  create(className: string, ...params: any[]) {
    return new this.classStore[className](...params);
  }
}
