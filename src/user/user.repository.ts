import { UserModel as User } from './user.model';
import { IUser } from './user.interface';

export class UserRepository {
    public getAllUsers(): Promise<IUser[]> {
        return User.find({}).exec();
    }
}