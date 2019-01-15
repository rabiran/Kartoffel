import { DomainSeperator } from '../utils';
import { DOMAIN_MAP } from '../config/db-enums';

const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));

export function isLegalUserString(uniqueID: string): boolean {
  const l = uniqueID.length;
  return !(uniqueID.startsWith(DomainSeperator) || uniqueID.endsWith(DomainSeperator) 
          || uniqueID.split(DomainSeperator).length !== 2);
}

export class DomainUserValidate {
  public static domain(domain: string): boolean {
    return ([...domainMap.keys()]).includes(domain);
  }  
} 
