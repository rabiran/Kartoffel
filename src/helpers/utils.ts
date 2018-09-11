export function reflectPromise<T>(p: Promise<T>, putNull = false): Promise<{ v?: T, e?: any, status: string }> {
  return p.then(v => ({ v, status: 'fulfilled' }),
    e => (putNull? null : { e, status: 'rejected' }));
}

export function wrapIgnoreCatch<T extends Function>(func: T, defaultVal:any = null): T {
  return <any>function(...args:any[]) {
    let ret = defaultVal;
    try {
      ret = func(...args);
    } catch(e) {}
    return ret;
  }
}

// export function PromiseAllIgnore(promises: [Promise<any>]): Promise<void[]> {
//   return Promise.all(promises.map(p => {
//     p.catch(e => null)
//   }));
// }
