import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ValidationError, ResourceNotFoundError } from '../types/error';
import { PersonRepository } from './person.repository';
import { IPerson, IDomainUser } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { userFromString, getAllPossibleDomains } from './person.utils';
import * as utils from '../utils.js';
import  * as consts  from '../config/db-enums';
import { PersonValidate } from './person.validate';
import { search } from '../search/elasticsearch';
import { config } from '../config/config';

export class Person {
  static _personRepository: PersonRepository = new PersonRepository();
  _personService: PersonRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();

  constructor() {
    this._personService = new PersonRepository();
  }

  static async getPersons(query?: any): Promise<IPerson[]> {
    const cond = {};
    if (!(query && query.alsoDead && query.alsoDead === 'true')) cond['alive'] = 'true';
    const persons: IPerson[] = await Person._personRepository.find(cond);
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
  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await Person._personRepository.getUpdatedFrom(from, to);
    return <IPerson[]>persons;
  }

  /**
   * Returns whether the given domain user exists
   * @param domainUser 
   */
  static async isDomainUserExist(domainUser: IDomainUser): Promise<boolean> {
    const person = await Person._personRepository.findByDomainUser(domainUser, null, { id: 1 });
    return !!person;
  }

  /**
   * get a person with domain user corresponding to the given domain user string
   * @param userString 
   */
  static async getByDomainUserString(userString: string): Promise<IPerson> {
    const userObj = userFromString(userString);
    const domains = getAllPossibleDomains(userObj);
    const person = await Person._personRepository.findByMultiDomainUser(userObj.name, domains);
    if (!person) {
      throw new ResourceNotFoundError(`person with domainUser: ${userString} does not exist`);
    }
    return person;
  }

  /**
   * Add new domain user to an existing person
   * @param personId 
   * @param user user object or string representation of a user
   */
  static async addNewUser(personId: string, user: IDomainUser | string):
    Promise<IPerson> {
    if (!personId) throw new ValidationError(`The system needs a personId to create a domain user ${JSON.stringify(user)}`);
    if (!user) throw new ValidationError(`The system needs a user name and domain to create a domain user for a personId ${personId}`);
    const userObj: IDomainUser = typeof user === 'string' ? userFromString(user) : user;
    if (!PersonValidate.domain(userObj.domain)) throw new ValidationError(`'The "${userObj.domain}" is not a recognized domain'`);
    // check user existance 
    if (await Person.isDomainUserExist(userObj)) {
      throw new ValidationError(`domain user: ${{ ...userObj }} already exists`);
    }
    // get the person and check that the person exists
    const person = await Person.getPersonById(personId);
    const updatedPerson = await Person._personRepository.insertDomainUser(personId, userObj);
    // (person.domainUsers as IDomainUser[]).push(userObj);
    // const updatedPerson = await Person.updatePerson(personId, person);
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
    // if trying to remove the last domain user from a specific entity type - it's an error
    if (person.entityType === consts.ENTITY_TYPE[2] && person.domainUsers.length === 1) {
      throw new ValidationError(`entityType: ${consts.ENTITY_TYPE[2]} requires at leat 1 domainuser`);
    }
    const userObj = userFromString(uniqueId);
    const domains = getAllPossibleDomains(userObj);
    const updatedPerson = await Person._personRepository.deleteMultiDomainUser(personId, userObj.name, domains);
    return updatedPerson;
  }

  /**
   * Update domainUser name
   * @param personId 
   * @param oldUniqueId the current uniqueId
   * @param newUniqueId the uniqueId to change into
   */
  static async updateDomainUser(personId: string, oldUniqueId: string, newUniqueId?: string) : Promise<IPerson> {
    // Checks if domainUser belongs to this person
    const person = await Person.getByDomainUserString(oldUniqueId);
    if (person.id !== personId) {
      throw new ValidationError(`The domain user: ${oldUniqueId} doesn't belong to person with id: ${personId}`);
    }
    // check if the new domain user already exists 
    const newUserObj = userFromString(newUniqueId);
    if (await Person.isDomainUserExist(newUserObj)) {
      throw new ValidationError(`domain user: ${{ ...newUserObj }} already exists`);
    }
    // check that the update doesn't change the domain 
    const oldUserObj = userFromString(oldUniqueId);
    if (oldUserObj.domain !== newUserObj.domain) {
      throw new ValidationError(`Can't change domain of user`);
    }
    const domains = getAllPossibleDomains(oldUserObj);
    const updatedPerson = await Person._personRepository.updateMultiDomainUser(personId, oldUserObj.name, domains, newUserObj);
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
      const domainUsers = person.domainUsers as string[];
      person.domainUsers = domainUsers.map(userString => userFromString(userString));
    }
    const newPerson = await Person._personRepository.create(person);
    return newPerson;
  }

  static async discharge(personId: string): Promise<any> {
    const person = await Person.getPersonById(personId);
    person.alive = false;
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
      throw new ValidationError(validatorsResult.messages.toString());
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

  /**
   * Returns array of autocomplete suggestions on the "fullName" field
   * @param partialName the text to autocomplete, with minmum length of 2
   */
  static async autocomplete(partialName: string) {
    if (!partialName || partialName.trim().length < 2) {
      return [];
    }
    const match_query = {
      match: {
        'fullName.autocomplete': {
          query: partialName,
        },
      },
    };
    const match_query_fuzzy = {
      match: {
        'fullName.autocomplete': {
          query: partialName,
          fuzziness: 'AUTO',
        },
      },
    };
    const filter_alive = {
      term: { alive: 'true' },
    };
    const query = {
      query: {
        bool: {
          should: [
            match_query, match_query_fuzzy,
          ],
          filter: filter_alive,
          minimum_should_match: 1,
        },  
      },
    };
    return await search<IPerson>('kartoffel.people', config.elasticSearch.defaultResultLimit, query);
  }
}
