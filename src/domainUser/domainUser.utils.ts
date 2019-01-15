import { IDomainUser } from './domainUser.interface';
import { DomainSeperator } from '../utils';
import { isLegalUserString } from './domainUser.validators';


export function userFromString(uniqueID: string): IDomainUser {
  if (!isLegalUserString(uniqueID)) {
    throw new Error(`${uniqueID} is illegal user representation`);
  }
  const splitted = uniqueID.split(DomainSeperator);
  const name = splitted[0], domain = splitted[1];
  const user: IDomainUser = {
    name,
    domain,
  };
  return user;  
}
