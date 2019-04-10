import * as mongoose from 'mongoose';
import { IOrganizationGroup } from './organizationGroup.interface';
import { PersonModel as Person } from '../../person/person.model';
import { IPerson } from '../../person/person.interface';

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

function onlyAliveMembers(group: IOrganizationGroup) {
  if (group && group.directMembers) {
    group.directMembers = (<IPerson[]>group.directMembers).filter(p => p.alive);
  }
}

function postFind(result: mongoose.Document | IOrganizationGroup | IOrganizationGroup[]) {
  if (Array.isArray(result)) {
    result.map(onlyAliveMembers);
  } else {
    onlyAliveMembers(<IOrganizationGroup>result);
  }
}

OrganizationGroupSchema.post('findOne', postFind);
OrganizationGroupSchema.post('find', postFind);

// OrganizationGroupSchema.virtual('id').get(function () {
//   return this._id;
// });   

OrganizationGroupSchema.pre<mongoose.Document & IOrganizationGroup>('save', async function () {
  this.isALeaf = (this.children.length === 0);
});

OrganizationGroupSchema.pre('update', function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

export const OrganizationGroupModel = mongoose.model<IOrganizationGroup & mongoose.Document>('OrganizationGroup', OrganizationGroupSchema);
