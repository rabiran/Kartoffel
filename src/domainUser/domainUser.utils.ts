import { IDomainUser } from './domainUser.interface';

export const DomainSeperator = '@';

export function userFromString(fullString: string): IDomainUser {
  const splitted = fullString.split(DomainSeperator);
  if (splitted.length !== 2) {
    throw new Error(`${fullString} is illegal user representation`);
  }
  const user: IDomainUser = {
    name: splitted[0],
    domain: splitted[1],
  };
  return user;  
}
