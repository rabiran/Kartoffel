import { ValidationError, errors } from '../types/error';
import { Schema } from 'mongoose';
import { MongoError } from 'mongodb';
import { ERS } from '../config/config';

function convertValidationError(err: any, res: any, next: Function) {
  
  if (err.name === 'ValidationError') {
    const field: any = <any>Object.keys(err.errors)[0];
    const values: any = <any>Object.values(err.errors)[0];
    const type = values.kind;

    if (type === 'required') next(new ValidationError.MissingFields(field));
    else if (type === 'user defined') next(new ValidationError.InvalidFields(field));
    else next(new ValidationError.CustomError(err.message));

  } else {
    next(); // the call will still error out see: https://mongoosejs.com/docs/middleware.html#error-handling-middleware
  }
}

function convertDuplicateKey(err: MongoError, res: any, next: Function) {
  if (err.name === 'MongoError' && err.code === 11000) {
    next(new ValidationError.CustomError(errors.duplicate_key));
  } else {
    next(); 
  }
}

export function registerErrorHandlingHooks(schema: Schema) {
  // convert mongoose validation error to our validation error
  schema.post('validate', convertValidationError);
  schema.post('update', convertValidationError);
  schema.post('findOneAndUpdate', convertValidationError);

  // handle mongo duplicate Key error, see: http://thecodebarbarian.com/mongoose-error-handling
  schema.post('save', convertDuplicateKey);
  schema.post('update', convertDuplicateKey);
  schema.post('findOneAndUpdate', convertDuplicateKey);
  schema.post('insertMany', convertDuplicateKey);
}
