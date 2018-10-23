import { DomainUserRepository } from './domainUser.repository';
import { IDomainUser } from './domainUser.interface';
import { userFromString } from './domainUser.utils';
import { reflectPromise, wrapIgnoreCatch } from '../helpers/utils';

const userFromStringIgnore = wrapIgnoreCatch(userFromString); 

export class DomainUserController {
  static _userRepository: DomainUserRepository = new DomainUserRepository();

  static async find(query = {}): Promise<IDomainUser[]> {
    return DomainUserController._userRepository.find(query);
  }

  static async findOne(query = {}): Promise<IDomainUser> {
    return DomainUserController._userRepository.findOne(query);
  }

  static async getAll(): Promise<IDomainUser[]> {
    return DomainUserController.find();
  }

  static async getById(id: string): Promise<IDomainUser> {
    const user = DomainUserController._userRepository.findById(id);
    if (!user) {
      throw new Error(`domainUser with id: ${id} is not found`);
    }
    return user;
  }

  static async getByFullString(fullString: string): Promise<IDomainUser> {
    const userObj = userFromString(fullString);
    const user = await DomainUserController.findOne({ ...userObj });
    if (!user) {
      throw new Error(`domainUser ${fullString} does not exist`);
    }
    return user;
  }

  static async delete(id: string): Promise<any> {
    const res = await DomainUserController._userRepository.delete(id);
    if (res.result.n === 0) {
      throw new Error(`domainUser with id: ${id} is not found`);
    }
    return res.result;
  }

  static async create(user: IDomainUser): Promise<IDomainUser> {
    if (await DomainUserController.exists(user)) {
      throw new Error(`user with name: ${user.name} and domain: ${user.domain} already exists`);
    }
    return DomainUserController._userRepository.create(user);
  }

  static async exists(user: IDomainUser): Promise<boolean> {
    const users = await DomainUserController.find({ name: user.name, domain: user.domain });
    return users && users.length > 0;
  }

  static async createManyFromString(usersStrings: string[], personId: string): Promise<IDomainUser[]> {
    const userPromises = await Promise.all(usersStrings
      .map((s) => {
        const userObj = userFromStringIgnore(s);
        if (userObj) {
          userObj.personId = personId;
        }
        return userObj;
      })
      .map(u => reflectPromise(DomainUserController.create(u))));
    return userPromises.map(p => p.status === 'fulfilled' ? p.v : null);
  }
}
