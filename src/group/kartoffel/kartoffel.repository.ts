import { KartoffelModel as Kartoffel } from './kartoffel.model';
import { IKartoffel } from './kartoffel.interface';
import { RepositoryBase } from '../../helpers/repository';

export class KartoffelRepository extends RepositoryBase<IKartoffel> {
    constructor() {
        super(Kartoffel);
    }
}