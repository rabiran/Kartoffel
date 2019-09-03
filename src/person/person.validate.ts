import { RESPONSIBILITY, ENTITY_TYPE, DOMAIN_MAP } from '../config/db-enums';
import { IPerson } from './person.interface';
import { ValidatorObj } from '../types/validation';
import { DomainSeperator } from '../utils';

const domainMap : Map<string, string> = new Map<string, string>(JSON.parse(JSON.stringify(DOMAIN_MAP)));

export class ModelValidate {
  static stringNotEmpty(str: string) {
    return str !== '';
  }

  // Returns if the string consist of a number
  static isStringedNumber(stringedNumber: string) {
    return /^\d+$/.test(stringedNumber);
  }
}

export class PersonValidate extends ModelValidate {

  // Ensure the ID consist of numbers only and has length of 7
  public static id(id: string) {
    return (id.length === 7) && PersonValidate.isStringedNumber(id);
  }

  // Ensure the name isn't empty (In the meantime...)
  public static namePart(name: string) {
    return PersonValidate.stringNotEmpty(name);
  }

  public static email(mail: string) {
    return /.+@.+\..+/.test(mail) || !mail;
  }

  public static mobilePhone(mobilePhone: string) {
    return /^\d{2,3}-?\d{7}$/.test(mobilePhone);
  }

  /**
   * Check if phone like to: 02-123456/7, 02123456/7,
   *  *123, 1234/5  
   * @param phone Phone number
   */
  public static phone(phone: string) {
    return /^\d{1,2}-?\d{6,7}$|^\*\d{3}$|^\d{4,5}$/.test(phone);
  }

  public static personalNumber(personalNumber: string) {
    return /^\d{6,9}$/.test(personalNumber);
  }

  public static identityCard(identityCard: string) {

    // Validate correct input
    if (!identityCard.match(/^\d{5,9}$/g)) return false;

    // The number is too short - add leading 0000
    identityCard = identityCard.padStart(9,'0');

    // CHECK THE ID NUMBER
    const accumulator = identityCard.split('').reduce((count, currChar, currIndex) => { 
      const num = Number(currChar) * ((currIndex % 2) + 1);
      return count += num > 9 ? num - 9 : num;  
    }, 0);

    return (accumulator % 10 === 0);
  }

  public static clearance(clearance: string) {
    return /^([0-9]|10)$/.test(clearance);
  }

  public static responsibilityLocation(responsibilityLocation: string, responsibility: string) {
    return (responsibility !== RESPONSIBILITY[0]);
  }

  public static isLegalUserString(uniqueID: string): boolean {
    return !(uniqueID.startsWith(DomainSeperator) || uniqueID.endsWith(DomainSeperator) 
            || uniqueID.split(DomainSeperator).length !== 2);
  }

  public static domain(domain: string): boolean {
    return ([...domainMap.keys()]).includes(domain);
  }
  
  // multifield validators returns false when the person is invalid (and thus the field is required!)

  public static currentUnitMultiValidator(person: IPerson) {
    return !!person.currentUnit || person.entityType !== ENTITY_TYPE[1];
  }

  public static identityCardMultiValidator(person: IPerson) {
    return !(!person.identityCard && person.entityType === ENTITY_TYPE[0]);
  }

  public static personalNumberMultiValidator(person: IPerson) {
    return !(!person.personalNumber && person.entityType === ENTITY_TYPE[1]);
  }

  public static rankMultiFieldValidator(person: IPerson) {
    return !((person.entityType === ENTITY_TYPE[1] && !person.rank)
              || (person.entityType === ENTITY_TYPE[0] && !!person.rank));
  }

  public static responsibilityLocationMultiValidator(person: IPerson) {
    return ( // there is responsibility(not "none") and responsibilityLocation
      person.responsibilityLocation && person.responsibility 
      && person.responsibility !== RESPONSIBILITY[0]) ||
      // there is not responsibilityLocation and responsibility is "none" (or undefined) 
      (!person.responsibilityLocation && (!person.responsibility || 
        person.responsibility === RESPONSIBILITY[0]));
  }

  public static domainUsersMultiValidator(person: IPerson) {
    return person.entityType !== ENTITY_TYPE[2] || person.domainUsers && person.domainUsers.length !== 0;
  }

  public static multiFieldValidators: ValidatorObj[] = [
    {
      validator: PersonValidate.identityCardMultiValidator,
      message: `identityCard is required for entityType ${ENTITY_TYPE[0]}`,
    },
    {
      validator: PersonValidate.personalNumberMultiValidator,
      message: `personalNumber is required for entityType ${ENTITY_TYPE[1]}`,
    },
    {
      validator: PersonValidate.responsibilityLocationMultiValidator,
      message: 'responsibilityLocation is required for responsibilty {VALUE.responsibility}',
    },
    {
      validator: PersonValidate.rankMultiFieldValidator,
      message: `rank is required for entity type ${ENTITY_TYPE[1]} and disallowed for ${ENTITY_TYPE[0]}`,
    },
    {
      validator: PersonValidate.domainUsersMultiValidator,
      message: `entityType: ${ENTITY_TYPE[2]} requires at least 1 domainuser`,
    },
  ];

}
