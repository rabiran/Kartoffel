import * as mongoose from 'mongoose';
import { IKartoffel } from './kartoffel.interface';
import { UserModel as User } from '../../user/user.model';

const ObjectId = mongoose.Schema.Types.ObjectId;

export const KartoffelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // admins: {
    //   type: [ObjectId],
    //   ref: 'User',
    //   default: [],
    // },
    members: {
      type: [ObjectId],
      ref: 'User',
      default: [],
    },
    children: {
      type: [ObjectId],
      ref: 'Kartoffel',
      default: [],
    },
    clearance: {
      type: Number,
      default: 0,
    },
    ancestors: {
      type: [ObjectId],
      ref: 'Kartoffel',
      default: [],
    },
    hierarchy: {
      type: [String],
      default: [],
    },
    type: String,
    isALeaf: Boolean,
    updatedAt: Date,
  }, 
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
      versionKey:false,
    },
  });

KartoffelSchema.virtual('directManagers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'managedGroup',
  justOne: false,
});

KartoffelSchema.virtual('directMembers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'directGroup',
  justOne: false,
});

// KartoffelSchema.virtual('id').get(function () {
//   return this._id;
// });

// KartoffelSchema.virtual('childless').get(function () {
//   return this.children.length === 0;
// });

KartoffelSchema.pre('save', function (next) {
  if (!this.updatedAt) this.updatedAt = new Date;
  this.isALeaf = (this.children.length === 0);
  next();
});


KartoffelSchema.pre('update', function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

export const KartoffelModel = mongoose.model<IKartoffel>('Kartoffel', KartoffelSchema);
