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
});

export default schema;
