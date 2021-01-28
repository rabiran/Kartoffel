import * as mongoose from 'mongoose';

const PictureSchema = new mongoose.Schema({
  path: {
    type: String,
  },
  contentType: {
    type: String,
  },
}, {
  timestamps: {
    updatedAt: true,
    createdAt: false,
  },
  versionKey: false,
});

export interface PictureMetadata {
  path: string;
  contentType?: string;
  updatedAt: Date;
}

export default PictureSchema;
