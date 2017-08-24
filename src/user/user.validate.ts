import { Rank, RANK } from '../utils';

export class ModelValidate {
    static stringNotEmpty(str: string) {
        return str != '';
    }

    // Returns if the string consist of a number
    static isStringedNumber(stringedNumber: string) {
        return /^\d+$/.test(stringedNumber);
    }
}

export class UserValidate extends ModelValidate {

    // Ensure the ID consist of numbers only and has length of 7
    public static id(id: string) {
        return (id.length == 7) && UserValidate.isStringedNumber(id);
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
}