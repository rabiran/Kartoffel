import { DomainSeperator } from '../utils';
import { DOMAIN_MAP } from '../config/db-enums';

const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));

export function isLegalUserString(fullString: string): boolean {
  const l = fullString.length;
  return !(fullString.startsWith(DomainSeperator) || fullString.endsWith(DomainSeperator) 
          || fullString.split(DomainSeperator).length !== 2);
}

export class DomainUserValidate {
  public static domain(domain: string): boolean {
    return ([...domainMap.keys()]).includes(domain);
  }  
} 
