import { UserModel as User } from './user.model';
import { IUser } from './user.interface';
import { RepositoryBase, ICollection } from '../helpers/repository';
import * as mongoose from 'mongoose';

export class UserRepository extends RepositoryBase<IUser> {
  constructor() {
    super(User);
  }

  getMembersOfGroups(kartoffelnIDS: string[]): Promise<mongoose.Document[]> {
    return User.find({ directGroup: { $in: kartoffelnIDS } }).exec();
  }
}
