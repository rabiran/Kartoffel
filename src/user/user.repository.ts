import { UserModel as User } from './user.model';
import { IUser } from './user.interface';
import { RepositoryBase, ICollection } from '../helpers/repository';
import { IPaginationOptions } from '../pagination/pagination.class';

export class UserRepository extends RepositoryBase<IUser> {

    constructor() {
        super(User);
    }

    getAllUsers(): Promise<IUser[]> {
        return User.find({}).exec();
    }

    postUser(user: IUser): Promise<IUser> {
        return;
    }

}