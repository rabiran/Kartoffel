import { filterObjectByKeys, DomainSeperator, domainMap, allIndexesOf } from '../utils';
import { IPerson, IDomainUser, IDomainUserIdentifier, SetProfilePictureDTO } from './person.interface';
import { PersonValidate } from './person.validate';
import { ValidationError } from '../types/error';

/**
 * get all possible domains for the given domain 
 * @param domain domain part string (after seperator)
 */
export function getAllPossibleDomains(domain: string): string[] {
  let domains: string[] = [];
  // Checks if domain is adfsUID
  if (Array.from(domainMap.values()).filter(v => v !== '').includes(domain)) {
    // get all keys of this adfsUID
    domains = Array.from(domainMap.keys()).filter(key => domainMap.get(key) === domain);
  }
  // If domain isn't adfsUID
  else domains = [domain];

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
  const [name, domain] = uniqueID.split(DomainSeperator);
  return { name, domain };  
}

export function createProfilePictureMetadata(
  personIndentifier: string, 
  metadata: { 
    format?: string 
    path?: string
    takenAt?: Date 
  }) {
  if (!metadata.path || !metadata.takenAt) {
    throw new ValidationError('profile picture metadata change must include path and takenAt parameters');
  }
  const { format, path, takenAt } = metadata;
  const url = `/api/persons/${personIndentifier}/pictures/profile`; // todo: generate url
  return {
    url,
    meta: {
      ...!!format && { format }, // 😈
      path, 
      takenAt,
    },
  };
}

