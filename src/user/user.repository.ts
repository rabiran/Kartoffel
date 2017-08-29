import { UserModel as User } from './user.model';
import { IUser } from './user.interface';
import { RepositoryBase, ICollection } from '../helpers/repository';

export class UserRepository extends RepositoryBase<IUser> {
    constructor() {
        super(User);
    }
}