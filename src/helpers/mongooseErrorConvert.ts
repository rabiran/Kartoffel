import { ValidationError } from '../types/error';
import { Schema } from 'mongoose';
import { MongoError } from 'mongodb';

function convertValidationError(err: MongoError, res: any, next: Function) {
  if (err.name === 'ValidationError') {
    next(new ValidationError(err.message));
  } else {
    next(); // the call will still error out see: https://mongoosejs.com/docs/middleware.html#error-handling-middleware
  }
}

function convertDuplicateKey(err: MongoError, res: any, next: Function) {
  if (err.name === 'MongoError' && err.code === 11000) {
    next(new ValidationError('duplicate key error'));
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
