import { Request, Response, NextFunction } from 'express';
import { PersonRepository } from './person.repository';
import { IPerson } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { isLegalUserString, userFromString } from '../domainUser/domainUser.utils';
import { DomainUserController } from '../domainUser/domainUser.controller';
import { reflectPromise, wrapIgnoreCatch } from '../helpers/utils';
import { IDomainUser } from '../domainUser/domainUser.interface';

const populateFields = 'primaryDomainUser secondaryDomainUsers';


export class Person {
  static _personRepository: PersonRepository = new PersonRepository();
  _personService: PersonRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();
  
  constructor() {
    this._personService = new PersonRepository();
  }

  static async getPersons(query = {}): Promise<IPerson[]> {
    const cond = {};
    if (!('dead' in query)) cond['alive'] = 'true';
    const persons = await Person._personRepository.find(cond, populateFields);
    return <IPerson[]>persons;
  }

  static async getPersonById(personID: string): Promise<IPerson> {
    const person = await Person._personRepository.findById(personID, populateFields);
    if (!person) return Promise.reject(new Error('Cannot find person with ID: ' + personID));
    return person;
  }

  static async getPerson(nameField: string, identityValue: string): Promise<IPerson> {
    const cond = {};
    cond[nameField] = identityValue;
    const person = await Person._personRepository.findOne(cond, populateFields);
    if (!person) return Promise.reject(new Error(`Cannot find person with ${nameField}: '${identityValue}'`));
    return <IPerson>person;
  }

  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await Person._personRepository.getUpdatedFrom(from, to);
    return <IPerson[]>persons;
  }

  static async getOrganizationGroupMembers(groupID: string): Promise<IPerson[]> {
    // check that this group exists
    const group = await OrganizationGroup.getOrganizationGroupOld(groupID);

    const offsprings = <IOrganizationGroup[]>(await this._organizationGroupRepository.getOffsprings(groupID));
    const membersIDs = offsprings.map(offspring => offspring.members).reduce((a, b) => (<string[]>a).concat(<string[]>b));
    const members = <IPerson[]>await this._personRepository.getSome(<string[]>membersIDs);
    return members;
  }

  static async addNewUser(personId: string, user: IDomainUser | string, isPrimary: boolean): 
  Promise<IPerson> {
    const userObj: IDomainUser = typeof user === 'string' ? userFromString(user) : user;
    // get the person (it also checks that the person exists)
    const person = await Person.getPersonById(personId);
    // connect the user to the person
    userObj.personId = personId;
    const newUser = await DomainUserController.create(userObj);
    // connect the person to the user
    if (isPrimary) {
      // if the person already has primary user - make it secondary
      if (person.primaryDomainUser) {
        // wtf to do here? the array is actually ObjectId[]
        (<string[]>person.secondaryDomainUsers).push(<string>person.primaryDomainUser);
      }
      person.primaryDomainUser = newUser.id;
    } else { // also here it's actually ObjectId[]
      (<string[]>person.secondaryDomainUsers).push(newUser.id); 
    }
    const updatedPerson = Person.updatePerson(personId, person);
    return updatedPerson;
  }


  static async createPerson(person: IPerson): Promise<IPerson> {
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

  static async discharge(personID: string): Promise<any> {
    const person = await Person.getPersonById(personID);
    // remove the person from his direct organization group
    person.directGroup = null;
    person.alive = false;
    if (person.managedGroup) {
      person.managedGroup = null;
    }
    const res = await Person.updatePerson(personID, person);
    return res;
  }

  static async removePerson(personID: string): Promise<any> {
    const res = await Person._personRepository.delete(personID);
    return res.result.n > 0 ? res.result : Promise.reject(new Error('Cannot find person with ID: ' + personID));
  }

  static async updatePerson(id: string, change: Partial<IPerson>): Promise<IPerson> {
    const updatedPerson = await Person._personRepository.update(id, change);
    if (!updatedPerson) return Promise.reject(new Error('Cannot find person with ID: ' + id));
    return <IPerson>updatedPerson;
  }

  static async updateTeam(personID: string, newTeamID: string): Promise<IPerson> {
    const person = await Person.getPersonById(personID);
    person.directGroup = newTeamID;
    return await Person.updatePerson(personID ,person);
  }

  // Will transfer person between groups automatically. Is that what we want?
  static async assign(personID: string, groupID: string): Promise<IPerson> {
    let person = await Person.getPersonById(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    person.directGroup = group.id;
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

  static async manage(personID: string, groupID: string) {
    const person = await Person.getPersonById(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);
    
    if (String(person.directGroup) !== String(groupID)) {
      return Promise.reject(new Error('This person is not a member in this group, hence can not be appointed as a leaf'));
    }
    // else
    person.managedGroup = group.id;
    await Person.updatePerson(personID, person);
    return;
  }

  static async resign(personID: string) {
    const person = await Person.getPersonById(personID);
    person.managedGroup = undefined;
    await Person.updatePerson(personID, person);
  }
}