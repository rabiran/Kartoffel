import { ValidatorObj } from './types/validation';
import { DOMAIN_MAP, STATUS } from './config/db-enums';

export const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));
export const DomainSeperator = '@';
export const allStatuses: string[] = Object.keys(STATUS).map(k => STATUS[k]);

export type BasicType = boolean | string | number;

export interface ValueMap {
  [key: string]: BasicType | BasicType[];
}

export interface KeyMap {
  [key: string]: string;
}

export interface ObjectValueMap {
  [key: string] : ValueMap;
}

type ValueReplaceMap<T> = {
  [k in keyof T]?: {
    [v: string]: T[k]
  }
};

export function filterObjectByKeys(object: Object, allowedKeys: string[], caseInsensitive: boolean = false): Object {
  const allowed = caseInsensitive ? allowedKeys.map(k => k.toLowerCase()) : allowedKeys;
  const filtered = Object.keys(object)
  .filter(key => allowed.includes(caseInsensitive ? key.toLowerCase() : key))
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

/**
 * Returns all indices of a value in the array
 * @param arr Array to search in
 * @param val The value to find
 */
export function allIndexesOf(arr: any[], val: any) {
  const indices: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) indices.push(i);
  }
  return indices;
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
 * also filters empty or null from array fields
 * @param obj Object to filter
 * @param array Fileds to filter 
 */
export function filterEmptyField(obj: object, array: string[]) {
  for (let index = 0; index < array.length; index++) {
    const value = obj[array[index]];
    if (value !== undefined) {
      if (!obj[array[index]]) { // empty, null, etc..
        delete obj[array[index]];
      } else if (Array.isArray(value)) { // filter out falsly values
        obj[array[index]] = value.filter((val:any) => val);
        if (obj[array[index]].length === 0) {
          delete obj[array[index]];
        }
      }
    }
  }
}

/**
 * Runs the given validators on the given value, returns an object with the following signature:
 * isValid - true if all validators passed, false otherwise.
 * messages - string array of error messages from the validators
 * @param validatorObjects 
 * @param valueToValidate 
 */
export function validatorRunner(validatorObjects: Iterable<ValidatorObj>, valueToValidate: any) {
  const messages = [];
  let allPassed = true;
  for (const validatorObj of validatorObjects) {
    if (!validatorObj.validator(valueToValidate)) {
      allPassed = false;
      const msg = evalStringWithValue(validatorObj.message, valueToValidate);
      messages.push(msg);
    }
  }
  return { messages, isValid: allPassed };
}

function evalStringWithValue(str: string, value: any, valueToMatch: string = 'VALUE') {
  return str.replace(/\{(([^{])+)\}/g, (_: string, match: string) => {
    const keys = match.split('.');
    if (keys.length === 0 || keys[0] !== valueToMatch) { return match; }
    const nestedKeys = keys.slice(1);
    let v = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
    for (const k of nestedKeys) {
      v = v[k];
    }
    return typeof v === 'object' ? JSON.stringify(v) : v;
  });
}

/**
 * Returns a proxy object with the same values of the original object,
 * but with case insensitive key lookup, and lowercases all keys in Object.keys()
 * @param originalObj original object
 * @returns proxy object
 */
export function proxyCaseInsensitive(originalObj: Object) {
  return new Proxy(originalObj, {
    get: (target, name: string) => target[Object.keys(target)
      .find(k => k.toLowerCase() === name.toLowerCase())],
    ownKeys: target => Object.keys(target).map(k => k.toLowerCase()),
    getOwnPropertyDescriptor: (target, prop) => {
      const originalProp = Object.getOwnPropertyNames(target).find(
        p => p.toLowerCase() === prop.toString().toLowerCase()
      );
      return Object.getOwnPropertyDescriptor(target, originalProp);
    },
    has: (target, key) => !!Object.keys(target).find(
      p => p.toLowerCase() === key.toString().toLowerCase()
    ),
  });
}

/**
 * Transform the keys of an object, according to the given transformation map - 
 * unspecified keys will not be changed.
 * returns a new object.
 * @param obj 
 * @param t transformation map: keys are the original keys and values are the new keys
 * @returns new object with transformed keys
 */
export function transformKeys(obj: object, t: KeyMap = {}): object {
  return Object.keys(obj).reduce((curr, key) => {
    if (key in t) {
      // key is specified in t - new object will have a new key instead (t(key)) 
      curr[t[key]] = obj[key];
    } else { // copy the key as is
      curr[key] = obj[key];
    }
    return curr;
  }, {});
}

/**
 * Transform the values of an object, only for the specified keys, 
 * according to the given transformation map - 
 * unspecified keys or values will not be changed.
 * returns a new object.
 * @param obj 
 * @param keyMap transformation map: keys are the original keys and values are objects 
 *               that maps value of a key to a different value.
 * @returns a new object with transformed values
 */
export function transformValues(obj: object, keyMap: ObjectValueMap): object {
  return Object.keys(obj).reduce((curr, key) => {
    const val = obj[key];
    if (key in keyMap && val in keyMap[key]) {
      // key is specified in keymap and val is specified in this key's map
      // new object will have a new value instead (keymap[key][val]) 
      curr[key] = keyMap[key][val];
    } else { // copy the value as is
      curr[key] = val;
    }
    return curr;
  }, {});
}

/**
 * Replace the values of an object, only for the specified keys, 
 * according to the given `replaceMap` map - 
 * unspecified keys or values will not be changed.
 * returns a new object.
 * 
 * replaceMap example:

 *`{'targetKey': {
   'oldValue': 'newValue'
 }}`
 * @param target
 * @param replaceMap
 */
export function replaceValues<T>(target: T, replaceMap: ValueReplaceMap<T>): T {
  const copy = { ...target };
  for (const [key, val] of Object.entries(target)) {
    if (key in replaceMap && val in replaceMap[key]) {
      copy[key] = replaceMap[key][val];
    }
  }
  return copy;
}


/**
 * Extract the specified keys from the given object.
 * Returns a new object with key value pairs corresponding to 
 * the given keys and object. a key will exist in the returned object 
 * only if it exists in the original object
 * @param obj 
 * @param keys 
 */
export function extract<T, K extends keyof T = keyof T>(obj: T, keys: K[]) {
  const res: any = {};
  for (const k of keys) {
    if (k in obj) res[k] = obj[k];
  }
  return res as Pick<T,K>;
}

/**
 * Returns whether a string represents a boolean Value 
 * (it's lower case form is either "true" or "false")
 * @param str 
 */
export function isBooleanString(str: string) {
  return ['true', 'false'].includes(str.toLowerCase());
}

/**
 * Returns the first element if `val` is array, otherwise
 * returns `val`.

 * Returns `undefined` upon empty array.
 * @param val 
 */
export function pickSingleValue<T>(val: T | T[]): T {
  if (Array.isArray(val)) {
    return val.length > 0 ? val[0] : undefined;
  }
  return val;
}

export function getByPath(obj: any, path: string[]) {
  return obj && path.reduce((res: any, prop) => prop in res ? res[prop] : undefined, obj);
}

export function setByPath(obj: any, path: string[], value: any) {
  path.reduce((cur, prop, index) => {
    if (index < path.length - 1) {
      return cur[prop];
    } else {
      cur[prop] = value;
    }
  }, obj);
}

export function deleteByPath(obj: any, path: string[]) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
    if (typeof cur === 'undefined') {
      return;
    }
  }
  delete cur[path[path.length - 1]];
}

export function isHierarchyUnderPath(hierarchyPath: string, path: string) {
  const pathWithDelimeter = path.endsWith('/') ? path : path + '/';
  const pathWithoutDelimeter = path.endsWith('/') ? path.slice(0, path.length - 1) : path;
  return hierarchyPath.startsWith(pathWithDelimeter) || hierarchyPath === pathWithoutDelimeter;
}
