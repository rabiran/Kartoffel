import { filterObjectByKeys, DomainSeperator, domainMap, allIndexesOf } from '../utils';
import { IPerson, IDomainUser } from './person.interface';
import { PersonValidate } from './person.validate';
import { ValidationError } from '../types/error';

/**
 * get all possible domains for the given domain user
 * @param domainUser domain user as a string (e.g "nitro@jello")
 */
export function getAllPossibleDomains(domainUser: IDomainUser): string[] {
  let domains = [domainUser.domain];
  // Checks if domain is adfsUID
  const adfsUIds = Array.from(domainMap.values()).filter(v => v !== '');
  if (adfsUIds.includes(domainUser.domain)) {
    // get all keys of this adfsUID
    const indices = allIndexesOf(adfsUIds, domainUser.domain);
    domains = Array.from(domainMap.keys()).filter((_, index) => indices.includes(index));
  }
  return domains;
}

export function userFromString(uniqueID: string): IDomainUser {
  if (!PersonValidate.isLegalUserString(uniqueID)) {
    throw new ValidationError(`${uniqueID} is illegal user representation`);
  }
  const splitted = uniqueID.split(DomainSeperator);
  const name = splitted[0], domain = splitted[1];
  const user: IDomainUser = {
    name,
    domain,
  };
  return user;  
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
    const user = {};
    (<IDomainUser>user).uniqueID = `${u.name}${DomainSeperator}${u.domain}`;
    domainMap.get(u.domain) && ((<IDomainUser>user).adfsUID = `${u.name}${DomainSeperator}${domainMap.get(u.domain)}`);
    (<IDomainUser>user).dataSource = u.dataSource;
    return user as IDomainUser;    
  });
  return tPerson;
}

