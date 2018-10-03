export type Rank =
    'Newbie'
    | 'Novice'
    | 'Rookie'
    | 'Beginner'
    | 'Talented'
    | 'Skilled'
    | 'Intermediate'
    | 'Skillful'
    | 'Seasoned'
    | 'Proficient'
    | 'Experienced'
    | 'Advanced'
    | 'Senior'
    | 'Expert';

export enum RANK {
    'Newbie',
    'Novice',
    'Rookie',
    'Beginner',
    'Talented',
    'Skilled',
    'Intermediate',
    'Skillful',
    'Seasoned',
    'Proficient',
    'Experienced',
    'Advanced',
    'Senior',
    'Expert',
}

export type Responsibility = 
    'None'
    | 'SecurityOfficer'
    | 'HR';

export enum RESPONSIBILITY {
  'None',
  'SecurityOfficer',
  'HR',
}

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
    const currObject = objects.find((object) => {return object['id'] === idValue.toString();});
    if (currObject) {newObjects.push(currObject);} 
  });

  return newObjects;
}

export function reflectPromise<T>(p: Promise<T>, putNull = false): Promise<{ v?: T, e?: any, status: string }> {
  return p.then(v => ({ v, status: 'fulfilled' }),
    e => (putNull ? null : { e, status: 'rejected' }));
}

export async function wholePromise(r: Promise<any>[]) { 
  // return await Promise.all(r.map(p => p.catch ? p.catch(e => e) : p)); 
  return await Promise.all(r.map(p => p.catch(e => e))); 
}
