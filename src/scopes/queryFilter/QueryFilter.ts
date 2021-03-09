export type Filter = {
  [k: string]: any[]
};

export class QueryFilter<F extends Filter, K extends keyof F = keyof F> { 
  constructor (
    private field: K,
    private values: F[K]
  ) {}

  get Field() {
    return this.field;
  }
  get Values() {
    return this.values;
  }

  static combine<F extends Filter>(...filters: QueryFilter<F>[]): Partial<F> {
    const combined: Partial<F> = {};
    for (const qf of filters) {
      if (!combined[qf.Field]) {
        combined[qf.Field] = qf.Values;
      } else {
        combined[qf.Field].push(...qf.Values);
      }
    }
    return combined;
  }
}
