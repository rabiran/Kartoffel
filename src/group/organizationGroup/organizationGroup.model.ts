import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { PersonModel as Person } from '../../person/person.model';
import { IPerson } from '../../person/person.interface';

const ObjectId = mongoose.Schema.Types.ObjectId;

export const OrganizationGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // admins: {
    //   type: [ObjectId],
    //   ref: 'Person',
    //   default: [],
    // },
    members: {
      type: [ObjectId],
      ref: 'Person',
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
  ref: 'Person',
  localField: '_id',
  foreignField: 'managedGroup',
  justOne: false,
});

OrganizationGroupSchema.virtual('directMembers', {
  ref: 'Person',
  localField: '_id',
  foreignField: 'directGroup',
  justOne: false,
});

function onlyAliveMembers(group: IOrganizationGroup) {
  if (group && group.directMembers) {
    group.directMembers = group.directMembers.filter(p => p.alive);
  }
}

function postFind(result: IOrganizationGroup | IOrganizationGroup[]) {
  if (Array.isArray(result)) {
    result.map(onlyAliveMembers);
  } else {
    onlyAliveMembers(result);
  }
}

OrganizationGroupSchema.post('findOne', postFind);
OrganizationGroupSchema.post('find', postFind);

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

export const OrganizationGroupModel = mongoose.model<IOrganizationGroup & mongoose.Document>('OrganizationGroup', OrganizationGroupSchema);
