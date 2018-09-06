import { Rank, RANK, RESPONSIBILITY, Responsibility } from '../utils';

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

  public static job(job: string) {
    return PersonValidate.stringNotEmpty(job);
  }

  public static email(mail: string) {
    return /.+@.+\..+/.test(mail) || !mail;
  }

  public static rank(rank: Rank) {
    return rank in RANK;
  }

  public static mobilePhone(mobilePhone: string) {
    return /^\d{2,3}-?\d{7}$/.test(mobilePhone);
  }

  public static phone(phone: string) {
    return /^\d{1,2}-?\d{6,7}$/.test(phone);
  }

  public static personalNumber(personalNumber: string) {
    return /^\d{6,8}$/.test(personalNumber);
  }

  public static identityCard(identityCard: string) {
    return /^\d{6,9}$/.test(identityCard);
  }

  public static clearance(clearance: string) {
    return /^([0-9]|10)$/.test(clearance);
  }

  public static responsibility(responsibility: Responsibility) {
    return responsibility in RESPONSIBILITY;
  }

  public static responsibilityLocation(responsibilityLocation: string, responsibility: Responsibility) {
    return (responsibility !== RESPONSIBILITY[0]);
  }

}
