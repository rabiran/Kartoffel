import { filterObjectByKeys } from '../utils';
import { IPerson } from './person.interface';
import { IDomainUser } from '../domainUser/domainUser.interface';

export function filterPersonDomainUsers(person: IPerson): IPerson {
  const changePerson = { ...person }; 
  changePerson.secondaryDomainUsers = <IDomainUser[]>(<IDomainUser[]>changePerson.secondaryDomainUsers).map((domainUser: IDomainUser) => {
    return filterObjectByKeys(domainUser, ['uniqueID', 'adfsUID']);
  });
  if (changePerson.primaryDomainUser) {
    changePerson.primaryDomainUser = <IDomainUser>filterObjectByKeys(changePerson.primaryDomainUser, ['uniqueID', 'adfsUID']);
  }
  return changePerson;
}
