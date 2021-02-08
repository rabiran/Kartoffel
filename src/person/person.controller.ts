import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import { ApplicationError, ValidationError, ResourceNotFoundError } from '../types/error';
import { PersonRepository } from './person.repository';
import { IPerson, IDomainUser, IDomainUserIdentifier, PictureType, ProfilePictureDTO, SetProfilePictureDTO, ProfilePictureMeta } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { userFromString, getAllPossibleDomains, createDomainUserObject, createProfilePictureMetadata } from './person.utils';
import * as utils from '../utils.js';
import * as consts  from '../config/db-enums';
import { PersonValidate } from './person.validate';
import { PersonTextSearch, PersonFilters as PersonTextSearchFilters } from './person.textSearch.interface';
import personElasticRepo from './person.elasticSearchRepository';
import { PictureStreamService } from '../picture/pictureStreamService.interface';
import MinioStreamService from '../minio/MinioStreamService';
import { StreamResponse } from '../helpers/controller.helper';

export type PersonFilters = {
  currentUnit: string | string[];
  'domainUsers.dataSource': string | string[];
  rank: string | string[];
  entityType: string | string[];
  responsibility: string | string[];
  serviceType: string | string[];
  status: string | string[];
  job: string | string[];
  underGroupId: string;
};

export type PersonSearchQuery = PersonFilters & {
  fullName: string;
};

export class Person {
  static _personRepository: PersonRepository = new PersonRepository();
  _personService: PersonRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();
  static _personTextSearch: PersonTextSearch = personElasticRepo;
  static _pictureStreamService : PictureStreamService = MinioStreamService;

  constructor() {
    this._personService = new PersonRepository();
  }

  static async getPersons(query?: any): Promise<IPerson[]> {
    const persons: IPerson[] = await Person._personRepository.findByQuery(query || {});
    if (!persons) throw new ResourceNotFoundError('An unexpected error occurred while fetching people');
    return persons;
  }

  static async getPersonById(personId: string): Promise<IPerson> {
    const person = await Person._personRepository.findById(personId);
    if (!person) throw new ResourceNotFoundError('Cannot find person with ID: ' + personId);
    return person;
  }

  /**
   * get a person by id, filter fields from the domain user objects
   * @param personID person's id
   */
  static async getPersonByIdWithFilter(personID: string): Promise<IPerson> {
    const person: IPerson = await Person.getPersonById(personID);
    return person;
  }

  /**
   * find person by field
   * @param nameField name of the field to find by
   * @param identityValue the value to find
   */
  static async getPerson(nameField: string, identityValue: string): Promise<IPerson> {
    const cond = {};
    cond[nameField] = identityValue;
    const person: IPerson = await Person._personRepository.findOne(cond);
    if (!person) throw new ResourceNotFoundError(`Cannot find person with ${nameField}: '${identityValue}'`);
    return person;
  }

  /**
   * get by multiple fields, applying 'or' between the fields
   * @param nameFields the name of the fields
   * @param identityValue the value to find
   */
  static async getPersonByIdentifier(nameFields: string[], identityValue: string) {
    const person: IPerson = await Person._personRepository.findOneOr(nameFields, [identityValue]);
    if (!person) throw new ResourceNotFoundError(`Cannot find person with identityValue: '${identityValue}'`);
    return person;
  }
  static async getUpdatedFrom(from: Date, to: Date, query: object = {}) {
    const persons = await Person._personRepository.getUpdatedFrom(from, to, query);
    return <IPerson[]>persons;
  }

  /**
   * Returns whether the given domain user exists
   * @param domainUserIdentifier 
   */
  static async isDomainUserExist(domainUserIdentifier: IDomainUserIdentifier): Promise<boolean> {
    const person = await Person._personRepository.findByDomainUser(domainUserIdentifier, null, { id: 1 });
    return !!person;
  }

  /**
   * get a person with domain user corresponding to the given domain user string
   * @param userString 
   */
  static async getByDomainUserString(userString: string): Promise<IPerson> {
    const { name, domain } = userFromString(userString);
    const domains = getAllPossibleDomains(domain);
    const person = await Person._personRepository.findByMultiDomainUser(name, domains);
    if (!person) {
      throw new ResourceNotFoundError(`person with domainUser: ${userString} does not exist`);
    }
    return person;
  }

  /**
   * Get person by uniqueID (without domain) or full domainUser
   * @param userString 
   */
  static async getByDomainUser(userString: string): Promise<IPerson> {
    // Check if "userString" is full domainUser
    if (PersonValidate.isLegalUserString(userString)) {
      return await Person.getByDomainUserString(userString);
    }
    // Check if there is person with this uniqueID
    const person = await Person._personRepository.findByDomainUserName(userString);
    if (!person) {
      throw new ResourceNotFoundError(`person with name of domainUser: ${userString} does not exist`);
    }
    return person;
  }

  /**
   * Add new domain user to an existing person
   * @param personId 
   * @param user domain user object of shape: { uniqueID, dataSource } to add
   */
  static async addNewUser(personId: string, user: Partial<IDomainUser>):
    Promise<IPerson> {
    if (!personId) throw new ValidationError(`The system needs a personId to create a domain user ${JSON.stringify(user)}`);
    if (!user) throw new ValidationError(`The system needs a user name and domain to create a domain user for a personId ${personId}`);
    if (!user.uniqueID) throw new ValidationError('uniqueID must be supplied when creating domain user');
    if (!user.dataSource) throw new ValidationError('dataSource must be supplied when creating domain user');
    const userIdentifier = userFromString(user.uniqueID);
    if (!PersonValidate.domain(userIdentifier.domain)) throw new ValidationError(`'The "${userIdentifier.domain}" is not a recognized domain'`);
    // check user existance 
    if (await Person.isDomainUserExist(userIdentifier)) {
      throw new ValidationError(`domain user: ${{ ...userIdentifier }} already exists`);
    }
    // get the person and check that the person exists
    const person = await Person.getPersonById(personId);
    const userObj: IDomainUser = createDomainUserObject(user);
    const updatedPerson = await Person._personRepository.insertDomainUser(personId, userObj);
    return updatedPerson;
  }

  /**
   * Delete domain user from person
   * @param personId Person to delete from him
   * @param uniqueId The domain user to delete
   */
  static async deleteDomainUser(personId: string, uniqueId: string) : Promise<IPerson> {
    const person = await Person.getByDomainUserString(uniqueId);
    if (person.id !== personId) {
      throw new ValidationError(`The domain user: ${uniqueId} doesn't belong to person with id: ${personId}`);
    }
    // if trying to remove the last domain user from a specific entity type person while he is active - it's an error
    if (person.entityType === consts.ENTITY_TYPE[2] && person.domainUsers.length === 1 && person.status === consts.STATUS.ACTIVE) {
      throw new ValidationError(`entityType: ${consts.ENTITY_TYPE[2]} requires at leat 1 domainuser while is active`);
    }
    const { name, domain } = userFromString(uniqueId);
    const domains = getAllPossibleDomains(domain);
    const updatedPerson = await Person._personRepository.deleteMultiDomainUser(personId, name, domains);
    return updatedPerson;
  }

  /**
   * Update domainUser name
   * @param personId 
   * @param uniqueId the uniqueId string of the domain user to be updated
   * @param updateObj object of shape { uniqueID?, dataSource? } with the values to update
   */
  static async updateDomainUser(personId: string, uniqueId: string, updateObj: Partial<IDomainUser>) : Promise<IPerson> {
    // Checks if domainUser belongs to this person
    const person = await Person.getByDomainUserString(uniqueId);
    if (person.id !== personId) {
      throw new ValidationError(`The domain user: ${uniqueId} doesn't belong to person with id: ${personId}`);
    }
    // current domain and name
    const { name: currentName, domain: currentDomain } = userFromString(uniqueId);
    let newUserIdentifier = null;
    // in case of uniqueId update: check if the new uniqueId already exists
    // and also that the the new uniqueId has the same domain 
    if (updateObj.uniqueID && (updateObj.uniqueID !== uniqueId)) {
      newUserIdentifier = userFromString(updateObj.uniqueID);
      if (await Person.isDomainUserExist(newUserIdentifier)) { // already exists
        throw new ValidationError(`domain user: ${{ ...newUserIdentifier }} already exists`);  
      } else if (newUserIdentifier.domain !== currentDomain) { // change of domain
        throw new ValidationError(`Can't change domain of user`);
      }
    }
    const domainUserUpdatableFields = ['dataSource'];
    const domains = getAllPossibleDomains(currentDomain);
    // updated domain user identifier fields (name, domain)
    const identifierUpdate = newUserIdentifier ? newUserIdentifier : {};
    // all other fields updates
    const restUpdate = _.pickBy(updateObj, (v, k) => domainUserUpdatableFields.includes(k));
    // mergedUpdate
    const mergedUpdateObjet: Partial<IDomainUser> = { ...identifierUpdate, ...restUpdate };
    const updatedPerson = await Person._personRepository
      .updateMultiDomainUser(personId, currentName, domains, mergedUpdateObjet);
    return updatedPerson;
  }

  static async createPerson(person: IPerson): Promise<IPerson> {
    // check that 'directGroup' field exists
    if (!person.directGroup) {
      throw new ValidationError('a person must have a direct group');
    }  
    // delete empty or null field that are not necessary
    utils.filterEmptyField(person, ['rank', 'phone', 'mobilePhone', 'address', 'job', 'serviceType']);
    
    // Chack some validation
    // Check if personalNumber equal to identityCard
    if (person.personalNumber && person.identityCard && person.personalNumber === person.identityCard) {
      throw new ValidationError('The personal number and identity card with the same value');
    }
    // Checks if there is a rank for the person who needs to
    if (person.entityType === consts.ENTITY_TYPE[1] && !person.rank) person.rank = consts.RANK[0];
    // run validators
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, person);
    if (!validatorsResult.isValid) {
      throw new ValidationError(validatorsResult.messages.toString());
    }

    // Checks whether the value in personalNumber or identityNumber exists in one of them
    // Checks value that exist
    const existValue = [person.personalNumber, person.identityCard].filter(x => x != null);
    const result = await Person._personRepository.findOr(['personalNumber', 'identityCard'], existValue);
    if (result.length > 0) throw new ValidationError('The personal number or identity card exists');
    // get direct group - will throw error if the group doesn`t exist
    const directGroup = await OrganizationGroup.getOrganizationGroup(<string>person.directGroup);
    // create the person's hierarchy
    person.hierarchy = directGroup.hierarchy.concat(directGroup.name);
    // create domainUser Objects
    if (person.domainUsers) {
      person.domainUsers = person.domainUsers.map(userString => createDomainUserObject(userString));
    } 
    // create 'pictures' objects
    if (!!person.pictures) {
      person.pictures = {
        profile: person.pictures.profile ? 
          createProfilePictureMetadata(
            person.personalNumber || person.identityCard, 
            person.pictures.profile as SetProfilePictureDTO
          ) : undefined,
      };
    }
    const newPerson = await Person._personRepository.create(person);
    return newPerson;
  }

  static async discharge(personId: string): Promise<any> {
    const person = await Person.getPersonById(personId);
    person.status = consts.STATUS.INACTIVE;
    if (person.managedGroup) {
      person.managedGroup = null;
    }
    const res = await Person.updatePerson(personId, person);
    return res;
  }

  static async removePerson(personID: string): Promise<any> {
    const result = await Person._personRepository.delete(personID);
    return result.deletedCount > 0 ? result : Promise.reject(new ResourceNotFoundError('Cannot find person with ID: ' + personID));
  }

  /**
   * Handle profile picture metadata change (create, updatem delete).

   * May throw validation error if the incoming change is invalid
   * @param source source Person Object 
   * @param change changes to apply to the 'pictures' field
   */
  private static handleProfilePictureChange(source: IPerson, change: { profile?: ProfilePictureDTO | SetProfilePictureDTO }) {
    // get current picture metadata
    const currentPictureMeta = source.pictures && source.pictures.profile ? 
      (source.pictures.profile as ProfilePictureDTO).meta : {};
    // if 'change' came from an object that was pulled from DB - it will have 'meta'
    const hasChange = !!change && (!!change.profile && !(change.profile as ProfilePictureDTO).meta
      || change.profile === null);
    if (!!hasChange) { // if there is change to apply
      const pictureMetaChange = change.profile as SetProfilePictureDTO;
      if (pictureMetaChange === null) { // delete operation
        if (source.pictures) {
          source.pictures.profile = null;
        }
        return;  
      }
      // update or create operation
      const mergedProfilePicture = createProfilePictureMetadata(source.personalNumber || source.identityCard, 
        { ...currentPictureMeta, ...pictureMetaChange });
      // initialize 'pictures' field if doesn't exist
      if (!source.pictures) {
        source.pictures = {};
      }
      source.pictures.profile = mergedProfilePicture;
    } 
  }

  static async updatePerson(id: string, change: Partial<IPerson>): Promise<IPerson> {
    // find the person
    const person = await Person.getPersonById(id);
    // hanlde picture field change
    const { pictures, ...rest } = change;
    Person.handleProfilePictureChange(person, pictures);
    // merge with the changes
    const mergedPerson = { ...person, ...rest };
    // validate the merged object
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, mergedPerson);
    if (!validatorsResult.isValid) {
      throw new ValidationError(validatorsResult.messages.toString());
    }
    // remove domainUsers from the actual update - this field have separate update function
    delete mergedPerson.domainUsers;
    // perform the actual update
    const updatedPerson = await Person._personRepository.update(id, mergedPerson);
    return <IPerson>updatedPerson;
  }

  // Will transfer person between groups automatically. Is that what we want?
  static async assign(personID: string, groupID: string): Promise<IPerson> {
    let person = await Person.getPersonById(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    person.directGroup = group.id;
    person.hierarchy = group.hierarchy.concat(group.name);
    person = await Person.updatePerson(personID, person);
    return <IPerson>person;
  }

  // Will delete managedGroup too
  // static async dismiss(personID: string) {
  //   let person = await Person.getPersonById(personID);
  //   if (!person.directGroup) return;

  //   person.directGroup = null;
  //   if (person.managedGroup) person.managedGroup = null;
  //   person = await Person.updatePerson(personID, person);
  //   return person;
  // }

  static async manage(personId: string, groupId: string) {
    const person = await Person.getPersonById(personId);
    const group = await OrganizationGroup.getOrganizationGroup(groupId);

    if (String(person.directGroup) !== String(groupId)) {
      throw new ValidationError('This person is not a member in this group, hence can not be appointed as a leaf');
    } 
    // else
    person.managedGroup = group.id;
    await Person.updatePerson(personId, person);
    return;
  }

  static async resign(personId: string) {
    const person = await Person.getPersonById(personId);
    person.managedGroup = undefined;
    await Person.updatePerson(personId, person);
  }

  static async searchPersonsByName(query: Partial<PersonSearchQuery>) {
    const { fullName, underGroupId, ...rest } = query;
    const filters: Partial<PersonTextSearchFilters> = rest;
    // the query makes sense only if 'fullName' is requested
    if (!fullName) return [];
    // get the group to search persons under it's hierarchy path
    if (!!underGroupId) {
      // throws if group doesn't exist
      const group = await OrganizationGroup.getOrganizationGroup(underGroupId);
      if (!!group) filters.hierarchyPath = [...group.hierarchy, group.name].join('/');
    }
    return Person._personTextSearch.searchByFullName(fullName, filters);
  }

  static async getPictureStream(personIdentifier: string) : Promise<StreamResponse> {
    const { profile } = await Person._personRepository.getRawPictures(personIdentifier);
    if (!profile) {
      throw new ResourceNotFoundError(`There is no picture for the pesron with identifier: ${personIdentifier}`);
    }

    return { 
      stream: await Person._pictureStreamService.getPicture(profile.meta.path),
      metaData: { contentType: profile.meta.format },
    };
  }
}
