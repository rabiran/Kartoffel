import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ValidationError, ResourceNotFoundError } from '../types/error';
import { PersonRepository } from './person.repository';
import { IPerson } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { userFromString } from '../domainUser/domainUser.utils';
import { DomainUserController } from '../domainUser/domainUser.controller';
import { IDomainUser } from '../domainUser/domainUser.interface';
import * as utils from '../utils.js';
import { filterPersonDomainUsers } from './person.utils';
import { DomainUserValidate } from '../domainUser/domainUser.validators';
import  * as consts  from '../config/db-enums';
import { PersonValidate } from './person.validate';

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
    let persons: IPerson[] = await Person._personRepository.find(cond, 'primaryDomainUser secondaryDomainUsers');
    persons = persons.map(person => filterPersonDomainUsers(person));
    return <IPerson[]>persons;
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
    let person: IPerson = await Person.getPersonById(personID);
    person = filterPersonDomainUsers(person);
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
    let person: IPerson = await Person._personRepository.findOne(cond);
    if (!person) throw new ResourceNotFoundError(`Cannot find person with ${nameField}: '${identityValue}'`);
    person = filterPersonDomainUsers(person);
    return person;
  }

  /**
   * get by multiple fields, applying 'or' between the fields
   * @param nameFields the name of the fields
   * @param identityValue the value to find
   */
  static async getPersonByIdentifier(nameFields: string[], identityValue: string) {
    let person: IPerson = await Person._personRepository.findOneOr(nameFields, [identityValue]);
    if (!person) throw new ResourceNotFoundError(`Cannot find person with identityValue: '${identityValue}'`);
    person = filterPersonDomainUsers(person);
    return person;
  }
  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await Person._personRepository.getUpdatedFrom(from, to);
    return <IPerson[]>persons;
  }

  static async getByDomainUserString(userString: string): Promise<IPerson> {
    const user = await DomainUserController.getByUniqueID(userString);
    if (user && user.personId) {
      return await Person.getPersonByIdWithFilter(<string>user.personId);
    }
    return null;
  }

  static async addNewUser(personId: string, user: IDomainUser | string, isPrimary: boolean):
    Promise<IPerson> {
    if (!personId) throw new ValidationError(`The system needs a personId to create a domain user ${JSON.stringify(user)}`);
    if (!user) throw new ValidationError(`The system needs a user name and domain to create a domain user for a personId ${personId}`);
    const userObj: IDomainUser = typeof user === 'string' ? userFromString(user) : user;
    if (!DomainUserValidate.domain(userObj.domain)) throw new ValidationError(`'The "${userObj.domain}" is not a recognized domain'`);
    // get the person and check that the person exists)
    const person = await Person.getPersonById(personId);
    // connect the user to the person
    userObj.personId = personId;
    const newUser = await DomainUserController.create(userObj);
    // connect the person to the user
    if (isPrimary) {
      // if the person already has primary user - make it secondary
      if (person.primaryDomainUser) {
        // the primary user is populated 
        (<IDomainUser[]>person.secondaryDomainUsers).push(<IDomainUser>person.primaryDomainUser);
      }
      person.primaryDomainUser = newUser;
    } else {
      // fuck you mongoose! I am using copy only because of your stupid 'push'
      const copy: IDomainUser[] = <IDomainUser[]>person.secondaryDomainUsers.slice();
      copy.push(newUser);
      person.secondaryDomainUsers = copy;
    }
    const updatedPerson = await Person.updatePerson(personId, person);
    return updatedPerson;
  }

  /**
   * Delete domain user from person
   * @param personId Person to delete from him
   * @param uniqueId The domain user to delete
   */
  static async deleteDomainUser(personId: string, uniqueId: string) : Promise<any> {
    const domainUser: IDomainUser = await DomainUserController.getByUniqueID(uniqueId);    
    // Checks if domainUser belongs to this person
    if (String(domainUser.personId) === personId) {
      // Update person - remove user from person
      const person = await Person.getPersonById(personId);
      // Checks if primary
      if (person.primaryDomainUser && (String((<IDomainUser>person.primaryDomainUser).id) === domainUser.id)) {
        person.primaryDomainUser = undefined;
        // Else delete user from secondaryUseres
      } else {
        const index = (<IDomainUser[]>person.secondaryDomainUsers).map(item => item.id).indexOf(domainUser.id);
        person.secondaryDomainUsers.splice(index, 1);
      }
      // update person record
      Person.updatePerson(person.id, person);
      // Delete domainUser
      const result = await DomainUserController.delete(domainUser.id);
      return result.deletedCount > 0 ? `The domain user: ${uniqueId} successfully deleted from person with id: ${personId}` : 
        Promise.reject(new ApplicationError('There was an error deleting the domain user'));        
    }
    // If domain user dont belong specific person
    throw new ValidationError(`The domain user: ${uniqueId} doesn't belong to person with id: ${personId}`);
  }

  /**
   * Update domainUser fields (name and\or primary)
   * @param personId 
   * @param oldUniqueId the current uniqueId
   * @param newUniqueId the uniqueId to change
   * @param isPrimary change primary to secondary and vice versa
   */
  static async updateDomainUser(personId: string, oldUniqueId: string, newUniqueId?: string, isPrimary?: Boolean) : Promise<IPerson> {
    const domainUser: IDomainUser = await DomainUserController.getByUniqueID(oldUniqueId);        
    // Checks if domainUser belongs to this person
    if (String(domainUser.personId) === personId) {  
      const person = await Person.getPersonById(personId);
      // Checks if there is something to change     
      if (!newUniqueId && (isPrimary === null || isPrimary === undefined)) {
        throw new ValidationError(`You have not entered a parameter to change`);
      }
      // Change name of uniqueId
      if (newUniqueId) {
        const userUpdate = userFromString(newUniqueId);
        if (userUpdate.domain !== domainUser.domain) throw new ValidationError(`Can't change domain of user`);
        domainUser.name = userUpdate.name;
        await DomainUserController.update(domainUser.id, domainUser);
      }
      // If get 'isPrimary' field
      if (isPrimary !== null && isPrimary !== undefined) {        
        // Checks if user should be primary and is not 
        if (isPrimary && (!(<IDomainUser>person.primaryDomainUser) || ((<IDomainUser>person.primaryDomainUser) && domainUser.id !== String((<IDomainUser>person.primaryDomainUser).id)))) {
          // If a another user already exsit in primary, it transfers it to a secondary
          if (person.primaryDomainUser) {
            (<IDomainUser[]>person.secondaryDomainUsers).push(<IDomainUser>person.primaryDomainUser);            
          }
          // Remove user from secondary and puts it in primary
          const index = (<IDomainUser[]>person.secondaryDomainUsers).map(item => item.id).indexOf(domainUser.id);
          const primaryUser = person.secondaryDomainUsers.splice(index, 1);
          person.primaryDomainUser = primaryUser[0];          
          // If the user does not have to be in primary, he transfers to a secondary
        } else if (!isPrimary && (<IDomainUser>person.primaryDomainUser) && domainUser.id === String((<IDomainUser>person.primaryDomainUser).id)) {          
          (<IDomainUser[]>person.secondaryDomainUsers).push(<IDomainUser>person.primaryDomainUser);
          person.primaryDomainUser = undefined;
        }       
      }
      return await Person.updatePerson(person.id, person);      
    }
    // If domain user dont belong specific person
    throw new ValidationError(`The domain user: ${oldUniqueId} doesn't belong to person with id: ${personId}`);
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
    const newPerson = await Person._personRepository.create(person);
    return newPerson;
  }

  /**
   * maybe in the future we will support creating the person and it's users at the same time
   */
  // static async createPerson(person: IPerson): Promise<IPerson> {
  //   const { primaryDomainUser, secondaryDomainUsers, ...toCreate } = person;
  //   const tmpPerson = await Person._personRepository.create(toCreate);
  //   // create the domain users while ignoring illegals
  //   const domainUsers = [primaryDomainUser, ...secondaryDomainUsers];
  //   const [primaryUser, ...secondaryUsers] = await DomainUserController
  //     .createManyFromString(<string[]>domainUsers, tmpPerson.id);
  //   const SecondaryUsersIds = secondaryUsers.filter(u => u ? true : false).map(u => u.id);
  //   const primaryUserId = primaryUser? primaryUser.id : null;
  //   // add the created domain users to the person
  //   let update: Partial<IPerson> = {};
  //   if (SecondaryUsersIds.length !== 0) {
  //     update.secondaryDomainUsers = SecondaryUsersIds;
  //   }
  //   if (primaryUserId) {
  //     update.primaryDomainUser = primaryUserId;
  //   }
  //   const createdPerson = await Person.updatePerson(tmpPerson.id, update);
  //   return createdPerson;
  // }

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
    // validate the merged object
    const validatorsResult = utils.validatorRunner(PersonValidate.multiFieldValidators, mergedPerson);
    if (!validatorsResult.isValid) {
      throw new ValidationError(validatorsResult.messages.toString());
    }
    // perform the actual update
    let updatedPerson = await Person._personRepository.update(id, mergedPerson, 'primaryDomainUser secondaryDomainUsers');
    updatedPerson = filterPersonDomainUsers(updatedPerson);
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
}
