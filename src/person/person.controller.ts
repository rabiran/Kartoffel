import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import { ApplicationError, ValidationError, ResourceNotFoundError, errors } from '../types/error';
import { PersonRepository } from './person.repository';
import { IPerson, IDomainUser, IDomainUserIdentifier } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { userFromString, getAllPossibleDomains, createDomainUserObject } from './person.utils';
import * as utils from '../utils.js';
import * as consts  from '../config/db-enums';
import { PersonValidate } from './person.validate';
import { search } from '../search/elasticsearch';
import { config, ERS } from '../config/config';
import esRepository from './person.elastic.repository';

export class Person {
  static _personRepository: PersonRepository = new PersonRepository();
  _personService: PersonRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();

  constructor() {
    this._personService = new PersonRepository();
  }

  static async getPersons(query?: any): Promise<IPerson[]> {
    const persons: IPerson[] = await Person._personRepository.findByQuery(query || {});
    if (!persons) throw new ResourceNotFoundError.CustomError(errors.error_getting_people);
    return persons;
  }

  static async getPersonById(personId: string): Promise<IPerson> {
    const person = await Person._personRepository.findById(personId);
    if (!person) throw new ResourceNotFoundError.ByFields(personId);
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
    if (!person) throw new ResourceNotFoundError.ByFields(nameField, identityValue);
    return person;
  }

  /**
   * get by multiple fields, applying 'or' between the fields
   * @param nameFields the name of the fields
   * @param identityValue the value to find
   */
  static async getPersonByIdentifier(nameFields: string[], identityValue: string) {
    const person: IPerson = await Person._personRepository.findOneOr(nameFields, [identityValue]);
    if (!person) throw new ResourceNotFoundError.ByFields(identityValue);
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
      throw new ResourceNotFoundError.PersonByDomainUser(userString);
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
    if (!personId) throw new ValidationError.MissingFields('personId');
    if (!user) throw new ValidationError.MissingFields('user');
    if (!user.uniqueID) throw new ValidationError.MissingFields('uniqueID');
    if (!user.dataSource) throw new ValidationError.MissingFields('dataSource');
    const userIdentifier = userFromString(user.uniqueID);
    if (!PersonValidate.domain(userIdentifier.domain)) throw new ValidationError.InvalidFields(userIdentifier.domain);
    // check user existance 
    if (await Person.isDomainUserExist(userIdentifier)) { 
      throw new ValidationError.ResourceExists({ ...userIdentifier } .toString()); 
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
      throw new ValidationError.CustomError(errors.domainUser_doesnt_belong_toPerson);
    }
    // if trying to remove the last domain user from a specific entity type - it's an error
    if (person.entityType === consts.ENTITY_TYPE[2] && person.domainUsers.length === 1) {
      throw new ValidationError.CustomError(errors.entityType_requires_more_domainUsers);
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
      throw new ValidationError.CustomError(errors.domainUser_doesnt_belong_toPerson);
    }
    // current domain and name
    const { name: currentName, domain: currentDomain } = userFromString(uniqueId);
    let newUserIdentifier = null;
    // in case of uniqueId update: check if the new uniqueId already exists
    // and also that the the new uniqueId has the same domain 
    if (updateObj.uniqueID && (updateObj.uniqueID !== uniqueId)) {
      newUserIdentifier = userFromString(updateObj.uniqueID);
      if (await Person.isDomainUserExist(newUserIdentifier)) { // already exists
        throw new ValidationError.ResourceExists({ ...newUserIdentifier }.toString());  
      } else if (newUserIdentifier.domain !== currentDomain) { // change of domain
        throw new ValidationError.CustomError(errors.cant_change_domain);
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
      throw new ValidationError.MissingFields('directGroup');
    }  
    // delete empty or null field that are not necessary
    utils.filterEmptyField(person, ['rank', 'phone', 'mobilePhone', 'address', 'job', 'serviceType']);
    
    // Chack some validation
    // Check if personalNumber equal to identityCard
    if (person.personalNumber && person.identityCard && person.personalNumber === person.identityCard) {
      throw new ValidationError.CustomError(errors.personalNumber_equals_identityCard);
    }
    // Checks if there is a rank for the person who needs to
    if (person.entityType === consts.ENTITY_TYPE[1] && !person.rank) person.rank = consts.RANK[0];
    // run validators
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, person);
    if (!validatorsResult.isValid) {
      const firstResult = validatorsResult.messages[0];
      if (firstResult.code === 101) throw new ValidationError.MissingFields(...firstResult.fields);
      else if (firstResult.code === 156) throw new ValidationError.CustomError(errors.entityType_requires_more_domainUsers);
      else throw new ValidationError.CustomError(firstResult.msg);
    }

    // Checks whether the value in personalNumber or identityNumber exists in one of them
    // Checks value that exist
    const existValue = [person.personalNumber, person.identityCard].filter(x => x != null);
    const result = await Person._personRepository.findOr(['personalNumber', 'identityCard'], existValue);
    if (result.length > 0) throw new ValidationError.CustomError(errors.personalNumber_or_identityCard_exists);
    // get direct group - will throw error if the group doesn`t exist
    const directGroup = await OrganizationGroup.getOrganizationGroup(<string>person.directGroup);
    // create the person's hierarchy
    person.hierarchy = directGroup.hierarchy.concat(directGroup.name);
    // create domainUser Objects
    if (person.domainUsers) {
      person.domainUsers = person.domainUsers.map(userString => createDomainUserObject(userString));
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
    return result.deletedCount > 0 ? result : Promise.reject(new ResourceNotFoundError.ByFields(personID));
  }

  static async updatePerson(id: string, change: Partial<IPerson>): Promise<IPerson> {
    // find the person
    const person = await Person.getPersonById(id);
    // merge with the changes
    const mergedPerson = { ...person, ...change };
    // remove domainUsers field from the update, for now this field have seperate update functions
    delete mergedPerson.domainUsers;
    // validate the merged object
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, mergedPerson);
    if (!validatorsResult.isValid) {
      const firstResult = validatorsResult.messages[0];
      if (firstResult.code === 101) throw new ValidationError.MissingFields(...firstResult.fields);
      else if (firstResult.code === 156) throw new ValidationError.CustomError(errors.entityType_requires_more_domainUsers);
      else throw new ValidationError.CustomError(firstResult.msg);
    }
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
      throw new ValidationError.CustomError(errors.person_not_member_of_group);
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

  static async searchPersons(query: object) {
    return esRepository.search(query);
  }
}
