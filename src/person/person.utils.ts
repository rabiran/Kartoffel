import { filterObjectByKeys, DomainSeperator, domainMap, allIndexesOf } from '../utils';
import { IPerson } from './person.interface';
import { IDomainUser } from '../domainUser/domainUser.interface';
import { PersonValidate } from './person.validate';
import { ValidationError } from '../types/error';

export function filterPersonDomainUsers(person: IPerson): IPerson {
  const filterField = ['uniqueID', 'adfsUID'];
  const changePerson = { ...person }; 
  changePerson.domainUsers = <IDomainUser[]>(changePerson.domainUsers as IDomainUser[])
    .map(domainUser => filterObjectByKeys(domainUser, filterField));
  return changePerson;
}

/**
 * get all possible domains for the given domain user
 * @param domainUser domain user as a string (e.g "nitro@jello")
 */
export function getAllPossibleDomains(domainUser: IDomainUser): string[] {
  let domains = [domainUser.domain];
  // Checks if domain is adfsUID
  const adfsUIds = Array.from(domainMap.values());
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

