import { Repository as DomainUserRepository } from './domainUser.repository';
import { IDomainUser } from './domainUser.interface';

export class DomainUserController {
  static async findDomainUsers(query = {}): Promise<IDomainUser[]> {
    return DomainUserRepository.find(query);
  }

  static async getAll(): Promise<IDomainUser[]> {
    return DomainUserController.findDomainUsers();
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
    const users = await DomainUserController
      .findDomainUsers({ name: user.name, domain: user.domain });
    if (users && users.length > 0) {
      throw new Error(`user with name: ${user.name} and domain: ${user.domain} already exists`);
    }
    return DomainUserRepository.create(user);
  }
}
