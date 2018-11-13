import { RESPONSIBILITY } from '../config/db-enums';

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
    return /^\d{6,9}$/.test(identityCard);
  }

  public static clearance(clearance: string) {
    return /^([0-9]|10)$/.test(clearance);
  }

  public static responsibilityLocation(responsibilityLocation: string, responsibility: string) {
    return (responsibility !== RESPONSIBILITY[0]);
  }

}
