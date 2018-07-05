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

export class UserValidate extends ModelValidate {

  // Ensure the ID consist of numbers only and has length of 7
  public static id(id: string) {
    return (id.length === 7) && UserValidate.isStringedNumber(id);
  }

  // Ensure the name isn't empty (In the meantime...)
  public static namePart(name: string) {
    return UserValidate.stringNotEmpty;
  }

  public static email(mail: string) {
    return /.+@.+\..+/.test(mail);
  }

  public static rank(rank: Rank) {
    return rank in RANK;
  }

  public static mobilePhone(mobilePhone: string) {
    return /^05\d-?\d{7}$/.test(mobilePhone);
  }

  public static phone(phone: string) {
    return /^0\d-?\d{6,7}$/.test(phone);
  }

  public static personalNumber(personalNumber: string) {
    return /^\d{7}$/.test(personalNumber);
  }

  public static identityCard(identityCard: string) {
    return /^\d{6,9}$/.test(identityCard);
  }

  public static clearance(clearance: string) {
    return /^([1-9]|10)$/.test(clearance);
  }

  public static responsibility(responsibility: Responsibility) {
    return responsibility in RESPONSIBILITY;
  }
  
}
