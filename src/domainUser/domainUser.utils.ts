import { IDomainUser } from './domainUser.interface';

export const DomainSeperator = '@';


export function isLegalUserString(fullString: string): boolean {
  const l = fullString.length;
  return !(fullString.startsWith(DomainSeperator) || fullString.endsWith(DomainSeperator) 
          || fullString.split(DomainSeperator).length !== 2);
}

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
