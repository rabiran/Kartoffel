import * as mongoose from 'mongoose';

interface IRead<T> {
  find: (cond: Object, populate: Object | string) => Promise<mongoose.Document[] | T[]>;
  findById: (id: any) => Promise<mongoose.Document | T>;
  findOne: (cond: Object) => Promise<mongoose.Document | T>;
}

interface IWrite<T> {
  create: (item: T) => Promise<mongoose.Document | T>;
  update: (_id: any, item: T) => Promise<mongoose.Document | T>;
  delete: (_id: any) => Promise<void>;
}

export interface ICollection<T> {
  set: T[];
  totalCount: number;
}

export abstract class RepositoryBase<T> implements IRead<T>, IWrite<T> {

  private _model: mongoose.Model<T & mongoose.Document>;

  constructor(schemaModel: mongoose.Model<T & mongoose.Document>) {
    this._model = schemaModel;
  }

  getAll(): Promise<T[]> {
    return this._model.find({}).exec();
  }

  getSome(ids: string[], cond?: Object): Promise<T[]> {
    const query = this._model.find({ _id: { $in: ids } });
    if (cond) {
      query.where(cond);
    }

    return query.exec();
  }

  getUpdatedFrom(from: Date, to: Date): Promise<T[]> {
    return this._model.find({ updatedAt: { $gte: from, $lte: to } }).exec();
  }

  findAndUpdateSome(ids: string[], set: Object): Promise<T[]> {
    return this._model.updateMany({ _id: { $in: ids } }, { $set: set }).exec();
  }

  // TODO: Check why it doesn't work with throw (It doesn't get caught).
  create(item: T): Promise<T> {
    return this._model.create(item).then((result) => {
      return result ? result.toObject() : result;
    });
  }

  update(_id: any, item: Partial<T>, populateOptions?: string | Object): Promise<T> {
    if (item['updatedAt'])  item['updatedAt'] = undefined;
    const opts = { new: true, runValidators: true, context: 'query' };    
    let updateQuery = this._model.findOneAndUpdate({ _id }, { $set: item }, opts);
    if (populateOptions) {
      updateQuery = updateQuery.populate(populateOptions);
    }
    return updateQuery.exec().then((result) => {
      return (result ? result.toObject() : result);
    });
  }

  delete(_id: any): Promise<any> {
    return this._model.deleteMany({ _id }).exec();
  }

  findById(_id: any, populateOptions?: string | Object): Promise<T> {
    let findQuery = this._model.findById(_id);

    if (populateOptions) {
      findQuery = findQuery.populate(populateOptions);
    }

    return findQuery.exec().then((result) => {
      return (result ? result.toObject() : result);
    });
  }

  findOne(cond?: Object, populateOptions?: string | Object, select?: string): Promise<T> {
    let findQuery = this._model.findOne(cond);
    if (populateOptions) {
      findQuery = findQuery.populate(populateOptions);
    }
    if (select) {
      findQuery = findQuery.select(select);
    }      
    return findQuery.exec().then((result) => {
      return (result ? result.toObject() : result);   
    });
  }
  findOneOr(keys: string[], values: string[], populate?: string | Object, select?: string) {
    const cond = keys.map((key) => { 
      return { [key]: { $in: values } }; 
    });

    return this.findOne({ $or: cond }, populate, select);     
    // return this.findOne({ $or: cond }, populateOptions, select);
  }
  
  findOr(keys: string[], values: string[], populate?: string | Object, select?: string) {
    const cond = keys.map((key) => { 
      return { [key]: { $in: values } }; 
    });

    return this.find({ $or: cond }, populate, select);
  }

  find(cond?: Object, populate?: string | Object, select?: string): Promise<T[]> {

    let findPromise = this._model.find(cond);
    if (populate) {
      findPromise = findPromise.populate(populate);
    }
    if (select) {
      findPromise = findPromise.select(select);
    }

    return findPromise.exec().then((result) => {
      return (result ? result.map((mongoObject => mongoObject.toObject())) : result);
    });
  }

}
