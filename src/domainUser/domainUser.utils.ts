import { IDomainUser } from './domainUser.interface';

export const DomainSeperator = '@';

export function userFromString(fullString: string): IDomainUser {
  const splitted = fullString.split(DomainSeperator);
  if (splitted.length !== 2) {
    throw new Error(`${fullString} is illegal user representation`);
  }
  const name = splitted[0], domain = splitted[1];
  if (name.length === 0 || name.includes(DomainSeperator) || 
      domain.length === 0 || domain.includes(DomainSeperator)) {
    throw new Error(`${fullString} is illegal user representation`);
  }
  const user: IDomainUser = {
    name,
    domain,
  };
  return user;  
}
