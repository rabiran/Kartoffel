import * as mongoose from 'mongoose';
import { IPaginationOptions } from '../pagination/pagination.class';

interface IRead {
    find: (cond: Object, populate: Object | string) => Promise<mongoose.Document[]>;
    findById: (id: any) => Promise<mongoose.Document>;
    findOne: (cond: Object) => Promise<mongoose.Document>;
}

interface IWrite<T> {
    create: (item: T) => Promise<mongoose.Document>;
    update: (item: T) => Promise<mongoose.Document>;
    delete: (_id: any) => Promise<void>;
}

export interface ICollection<T> {
    set: T[];
    totalCount: number;
}

export abstract class RepositoryBase<T extends mongoose.Document> implements IRead, IWrite<T> {

    private _model: mongoose.Model<mongoose.Document>;

    constructor(schemaModel: mongoose.Model<mongoose.Document>) {
        this._model = schemaModel;
    }

    getAll(): Promise<mongoose.Document[]> {
        return this._model.find({}).exec();
    }

    // TODO: Check why it doesn't work with throw (It doesn't get caught).
    create(item: T): Promise<mongoose.Document> {
        return new Promise((resolve, reject) => {
            this._model.create(item, (err: any, obj: any): void => {
                if (err) reject(err);
                else resolve(obj);
            });
        });
    }

    update(item: T, populateOptions?: string | Object): Promise<mongoose.Document> {
        let updateQuery = this._model.findByIdAndUpdate({ _id: item._id }, item, { new: true });
        if (populateOptions) {
            updateQuery = updateQuery.populate(populateOptions);
        }
        return updateQuery.exec();
    }

    delete(_id: any): Promise<void> {
        return this._model.remove({ _id: _id }).exec();
    }

    findById(_id: any, populateOptions?: string | Object): Promise<mongoose.Document> {
        let findQuery = this._model.findById(_id);

        if (populateOptions) {
            findQuery = findQuery.populate(populateOptions);
        }

        return findQuery.exec();
    }

    findOne(cond?: Object, populateOptions?: string | Object, select?: string): Promise<mongoose.Document> {
        let findQuery = this._model.findOne(cond);
        if (populateOptions) {
            findQuery = findQuery.populate(populateOptions);
        }
        if (select) {
            findQuery = findQuery.select(select);
        }
        return findQuery.exec();
    }

    find(cond?: Object, populate?: string | Object, select?: string): Promise<mongoose.Document[]> {

        let findPromise = this._model.find(cond);
        if (populate) {
            findPromise = findPromise.populate(populate);
        }
        if (select) {
            findPromise = findPromise.select(select);
        }

        return findPromise.exec();
    }

//   abstract search(searchTerm?: string, paginationOptions?: IPaginationOptions, additionalFilter?: Object, ): Promise<ICollection<T>>;
}