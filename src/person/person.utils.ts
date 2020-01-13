import { filterObjectByKeys, DomainSeperator, domainMap, allIndexesOf } from '../utils';
import { IPerson, IDomainUser, IDomainUserIdentifier } from './person.interface';
import { PersonValidate } from './person.validate';
import { ValidationError } from '../types/error';

/**
 * get all possible domains for the given domain 
 * @param domain domain part string (after seperator)
 */
export function getAllPossibleDomains(domain: string): string[] {
  let domains = [domain];
  // Checks if domain is adfsUID
  const adfsUIds = Array.from(domainMap.values()).filter(v => v !== '');
  if (adfsUIds.includes(domain)) {
    // get all keys of this adfsUID
    const indices = allIndexesOf(adfsUIds, domain);
    domains = Array.from(domainMap.keys()).filter((_, index) => indices.includes(index));
  }
  return domains;
}

/**
 * creates domain User Object - ready to be inserted to the DB
 * @param user object in format {uniqueID, dataSource} (probably sent by API)
 * @returns new Domain User object
 */
export function createDomainUserObject(user: Partial<IDomainUser>): IDomainUser {
  return { ...userFromString(user.uniqueID), dataSource: user.dataSource };
}

/**
 * Extracts name and domain strings from domain user uniqueId string.
 ** throws an error if the given string is illegal
 * @param uniqueID domain user uniqueId string
 * @returns returns an 'identifier' object with "name" and "domain" keys
 */
export function userFromString(uniqueID: string): IDomainUserIdentifier {
  if (!PersonValidate.isLegalUserString(uniqueID)) {
    throw new ValidationError(`${uniqueID} is illegal user representation`);
  }
  const splitted = uniqueID.split(DomainSeperator);
  const name = splitted[0], domain = splitted[1];
  return { name, domain };  
}

/**
 * Transform each domain user in the person to it's display form, 
 * returns new person object with the transformed domain users
 * @param person
 * @returns new person object with the transformed domain users
 */
export function transformDomainUser(person: IPerson) {
  const tPerson = { ...person };
  if (!tPerson.domainUsers) return tPerson;
  tPerson.domainUsers = (tPerson.domainUsers as IDomainUser[]).map((u) => {
    const user: Partial<IDomainUser> = {};
    user.uniqueID = `${u.name}${DomainSeperator}${u.domain}`;
    domainMap.get(u.domain) && (user.adfsUID = `${u.name}${DomainSeperator}${domainMap.get(u.domain)}`);
    user.dataSource = u.dataSource;
    return user as IDomainUser;    
  });
  return tPerson;
}

