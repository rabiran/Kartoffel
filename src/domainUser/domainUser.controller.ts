import { Repository as DomainUserRepository } from './domainUser.repository';
import { IDomainUser } from './domainUser.interface';
import { userFromString as f } from './domainUser.utils';
import { reflectPromise, wrapIgnoreCatch } from '../helpers/utils';

const userFromString = wrapIgnoreCatch(f); 

export class DomainUserController {
  static async find(query = {}): Promise<IDomainUser[]> {
    return DomainUserRepository.find(query);
  }

  static async getAll(): Promise<IDomainUser[]> {
    return DomainUserController.find();
  }

  static async getById(id: string): Promise<IDomainUser> {
    const user = DomainUserRepository.findById(id);
    if (!user) {
      throw new Error(`domainUser with id: ${id} is not found`);
    }
    return user;
  }

  static async delete(id: string): Promise<any> {
    const res = await DomainUserRepository.delete(id);
    if (res.result.n === 0) {
      throw new Error(`domainUser with id: ${id} is not found`);
    }
    return res.result;
  }

  static async create(user: IDomainUser): Promise<IDomainUser> {
    if (await DomainUserController.exists(user)) {
      throw new Error(`user with name: ${user.name} and domain: ${user.domain} already exists`);
    }
    return DomainUserRepository.create(user);
  }

  static async exists(user: IDomainUser): Promise<boolean> {
    const users = await DomainUserController.find({ name: user.name, domain: user.domain });
    return users && users.length > 0;
  }

  static async createManyFromString(usersStrings: string[], personId: string): Promise<IDomainUser[]> {
    const userPromises = await Promise.all(usersStrings
      .map((s) => {
        const userObj = userFromString(s);
        if (userObj) {
          userObj.personId = personId;
        }
        return userObj;
      })
      .map(u => reflectPromise(DomainUserController.create(u))));
    return userPromises.map(p => p.status === 'fulfilled' ? p.v : null);
  }
}
