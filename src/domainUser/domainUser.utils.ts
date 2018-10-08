import { IDomainUser } from './domainUser.interface';
import { DomainSeperator } from '../utils';
import { isLegalUserString } from './domainUser.validators';


export function userFromString(fullString: string): IDomainUser {
  if (!isLegalUserString(fullString)) {
    throw new Error(`${fullString} is illegal user representation`);
  }
  const splitted = fullString.split(DomainSeperator);
  const name = splitted[0], domain = splitted[1];
  const user: IDomainUser = {
    name,
    domain,
  };
  return user;  
}
