export const DomainSeperator = '@';

export function filterObjectByKeys(object: Object, allowedKeys: string[]): Object {
  const filtered = Object.keys(object)
  .filter(key => allowedKeys.includes(key))
  .reduce(
    (obj, key) => {
      obj[key] = object[key];
      return obj;
    }, 
    {});
  return filtered;
}
/**
 * Sort array of objects according to IDs array
 * @param objects Array objects to sort
 * @param array IDs array to sort by them
 */
export function sortObjectsByIDArray(objects: Object[], array: string[]) : Object[] {
  const newObjects: Object[] = [];
  array.forEach((idValue) => {
    const currObject = objects.find(object => object['id'] === idValue.toString());
    if (currObject) {newObjects.push(currObject);} 
  });

  return newObjects;
}

export function reflectPromise<T>(p: Promise<T>, putNull = false): Promise<{ v?: T, e?: any, status: string }> {
  return p.then(v => ({ v, status: 'fulfilled' }),
    e => (putNull ? null : { e, status: 'rejected' }));
}

export async function promiseAllWithFails(promiseArray: Promise<any>[], valueErr?: any) { 
  return await Promise.all(promiseArray.map(promise => promise.catch(err => valueErr ? valueErr : err))); 
}

export async function asyncForEach(array: any[], callback: Function) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Checks if fields name in array is an empty or null and deleted them
 * @param obj Object to filter
 * @param array Fileds to filter 
 */
export function filterEmptyField(obj: object, array: string[]) {
  for (let index = 0; index < array.length; index++) {
    if (!obj[array[index]] && obj[array[index]] !== undefined) {
      delete obj[array[index]];
    }    
  }
}
