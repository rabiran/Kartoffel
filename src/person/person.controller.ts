import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import { ApplicationError, ValidationError, ResourceNotFoundError } from '../types/error';
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
import { config } from '../config/config';
import { ERS } from '../config/config';
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
    if (!persons) throw new ResourceNotFoundError(ERS.ERROR_GETTING_PEOPLE);
    return persons;
  }

  static async getPersonById(personId: string): Promise<IPerson> {
    const person = await Person._personRepository.findById(personId);
    if (!person) throw new ResourceNotFoundError(ERS.PERSON_NOT_FOUND, [personId]);
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
    if (!person) throw new ResourceNotFoundError(ERS.PERSON_BY_FIELD_NOT_FOUND, [nameField,identityValue]);
    return person;
  }

  /**
   * get by multiple fields, applying 'or' between the fields
   * @param nameFields the name of the fields
   * @param identityValue the value to find
   */
  static async getPersonByIdentifier(nameFields: string[], identityValue: string) {
    const person: IPerson = await Person._personRepository.findOneOr(nameFields, [identityValue]);
    if (!person) throw new ResourceNotFoundError(ERS.PERSON_BY_MULTIFIELDS_NOT_FOUND, [identityValue]);
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
      throw new ResourceNotFoundError(ERS.PERSON_BY_DOMAINUSER_NOT_FOUND, [userString]);
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
    if (!personId) throw new ValidationError(ERS.MISSING_PERSONID, [JSON.stringify(user)]);
    if (!user) throw new ValidationError(ERS.MISSING_DOMAINUSER, [personId]);
    if (!user.uniqueID) throw new ValidationError(ERS.MISSING_UNIQUEID);
    if (!user.dataSource) throw new ValidationError(ERS.MISSING_DATASOURCE);
    const userIdentifier = userFromString(user.uniqueID);
    if (!PersonValidate.domain(userIdentifier.domain)) throw new ValidationError(ERS.UNRECOGNIZED_DOMAIN, [userIdentifier.domain]);
    // check user existance 
    if (await Person.isDomainUserExist(userIdentifier)) {
      throw new ValidationError(ERS.DOMAIN_EXISTS, [{...userIdentifier}.toString()]);
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
      throw new ValidationError(ERS.DOMAINUSER_DOESNT_BELONGS_TO_PERSON, [uniqueId, personId]);
    }
    // if trying to remove the last domain user from a specific entity type - it's an error
    if (person.entityType === consts.ENTITY_TYPE[2] && person.domainUsers.length === 1) {
      throw new ValidationError(ERS.INCORRECT_AMOUNT_OF_DOMAINUSERS, [consts.ENTITY_TYPE[2]]);
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
      throw new ValidationError(ERS.DOMAINUSER_DOESNT_BELONGS_TO_PERSON, [uniqueId, personId]);
    }
    // current domain and name
    const { name: currentName, domain: currentDomain } = userFromString(uniqueId);
    let newUserIdentifier = null;
    // in case of uniqueId update: check if the new uniqueId already exists
    // and also that the the new uniqueId has the same domain 
    if (updateObj.uniqueID && (updateObj.uniqueID !== uniqueId)) {
      newUserIdentifier = userFromString(updateObj.uniqueID);
      if (await Person.isDomainUserExist(newUserIdentifier)) { // already exists
        throw new ValidationError(ERS.DOMAIN_EXISTS, [{ ...newUserIdentifier }.toString()]);  
      } else if (newUserIdentifier.domain !== currentDomain) { // change of domain
        throw new ValidationError(ERS.CANT_CHANGE_DOMAINUSER);
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
      throw new ValidationError(ERS.PERSON_NEEDS_GROUP);
    }  
    // delete empty or null field that are not necessary
    utils.filterEmptyField(person, ['rank', 'phone', 'mobilePhone', 'address', 'job', 'serviceType']);
    
    // Chack some validation
    // Check if personalNumber equal to identityCard
    if (person.personalNumber && person.identityCard && person.personalNumber === person.identityCard) {
      throw new ValidationError(ERS.PERSONALNUMBER_EQUALS_IDENTITYCARD);
    }
    // Checks if there is a rank for the person who needs to
    if (person.entityType === consts.ENTITY_TYPE[1] && !person.rank) person.rank = consts.RANK[0];
    // run validators
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, person);
    if (!validatorsResult.isValid) {
      throw new ValidationError(ERS.PARAM, [validatorsResult.messages.toString()]);
    }

    // Checks whether the value in personalNumber or identityNumber exists in one of them
    // Checks value that exist
    const existValue = [person.personalNumber, person.identityCard].filter(x => x != null);
    const result = await Person._personRepository.findOr(['personalNumber', 'identityCard'], existValue);
    if (result.length > 0) throw new ValidationError(ERS.PERSONALNUMBER_OR_IDENTITYCARD_EXISTS);
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
    return result.deletedCount > 0 ? result : Promise.reject(new ResourceNotFoundError(ERS.PERSON_NOT_FOUND, [personID]));
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
      throw new ValidationError(ERS.PARAM, [validatorsResult.messages.toString()]);
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
      throw new ValidationError(ERS.PERSON_NOT_MEMBER_OF_THIS_GROUP);
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
