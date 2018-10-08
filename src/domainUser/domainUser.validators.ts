import { DomainSeperator } from '../utils';

export function isLegalUserString(fullString: string): boolean {
  const l = fullString.length;
  return !(fullString.startsWith(DomainSeperator) || fullString.endsWith(DomainSeperator) 
          || fullString.split(DomainSeperator).length !== 2);
}
