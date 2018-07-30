import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { UserModel as User } from '../../user/user.model';

const ObjectId = mongoose.Schema.Types.ObjectId;

export const OrganizationGroupSchema = new mongoose.Schema(
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
      ref: 'OrganizationGroup',
      default: [],
    },
    clearance: {
      type: Number,
      default: 0,
    },
    ancestors: {
      type: [ObjectId],
      ref: 'OrganizationGroup',
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

OrganizationGroupSchema.virtual('directManagers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'managedGroup',
  justOne: false,
});

OrganizationGroupSchema.virtual('directMembers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'directGroup',
  justOne: false,
});

// OrganizationGroupSchema.virtual('id').get(function () {
//   return this._id;
// });

// OrganizationGroupSchema.virtual('childless').get(function () {
//   return this.children.length === 0;
// });

OrganizationGroupSchema.pre('save', function (next) {
  if (!this.updatedAt) this.updatedAt = new Date;
  this.isALeaf = (this.children.length === 0);
  next();
});


OrganizationGroupSchema.pre('update', function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

export const OrganizationGroupModel = mongoose.model<IOrganizationGroup>('OrganizationGroup', OrganizationGroupSchema);
