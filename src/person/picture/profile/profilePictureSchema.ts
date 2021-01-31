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
}, {
  timestamps: {
    updatedAt: true,
    createdAt: false,
  },
  versionKey: false,
  toObject: {
    // hides the 'path' field
    transform: (doc, ret, options) => {
      const { takenAt, format, updatedAt } = ret;
      return { takenAt, format, updatedAt };
    },
  },
});

export default schema;
