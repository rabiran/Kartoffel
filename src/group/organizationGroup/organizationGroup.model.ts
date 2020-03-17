import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { IPerson } from '../../person/person.interface';
import { registerErrorHandlingHooks } from '../../helpers/mongooseErrorConvert';
import  * as consts  from '../../config/db-enums';

const ObjectId = mongoose.Schema.Types.ObjectId;

const schemaOptions = {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
    versionKey:false,
  },
  collation: {
    locale:'en',
    strength: 1,
  },
  timestamps: true,
};
export const OrganizationGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    children: {
      type: [ObjectId],
      ref: 'OrganizationGroup',
      default: [],
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
    akaUnit: {
      type: String,
    },
    isAlive: {
      type: Boolean,
      default: true,
    },
    isALeaf: {
      type: Boolean,
      default: true,
    },
  }, 
  schemaOptions
);

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

function onlyActiveMembers(group: IOrganizationGroup) {
  if (group && group.directMembers) {
    group.directMembers = (<IPerson[]>group.directMembers).filter(p => p.status === consts.STATUS.ACTIVE);
  }
}

function postFind(result: mongoose.Document | IOrganizationGroup | IOrganizationGroup[]) {
  if (Array.isArray(result)) {
    result.map(onlyActiveMembers);
  } else {
    onlyActiveMembers(<IOrganizationGroup>result);
  }
}

OrganizationGroupSchema.post('findOne', postFind);
OrganizationGroupSchema.post('find', postFind);

registerErrorHandlingHooks(OrganizationGroupSchema);

// OrganizationGroupSchema.virtual('id').get(function () {
//   return this._id;
// });   

OrganizationGroupSchema.pre<mongoose.Document & IOrganizationGroup>('save', async function () {
  this.isALeaf = (this.children.length === 0);
});

export const OrganizationGroupModel = mongoose.model<IOrganizationGroup & mongoose.Document>('OrganizationGroup', OrganizationGroupSchema);
