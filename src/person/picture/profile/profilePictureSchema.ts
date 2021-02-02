import * as mongoose from 'mongoose';

const schema = new mongoose.Schema({
  path: {
    type: String,
  },
  takenAt: {
    type: Date,
  },
  format: {
    type: String,
  },
  updatedAt: { type: Date, default: Date.now },
}, {
  _id: false,
  versionKey: false,
  // toObject: {
  //   transform: (doc, ret, options) => {
  //     const { path, ...rest } = ret;
  //     return rest;
  //   },
  // },
  // timestamps: { updatedAt: true }, not working :(
});


// for some reason the timestamps option doesn't work here
schema.pre('findOneAndUpdate', () => {
  (this as any).updatedAt = new Date();
});

export default schema;
