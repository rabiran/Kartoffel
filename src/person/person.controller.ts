import { Request, Response, NextFunction } from 'express';
import { PersonRepository } from './person.repository';
import { IPerson } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { Rank } from '../utils';
import { Document } from 'mongoose';
import { ObjectId } from 'bson';
import { IPersonModel } from './person.model';

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
    const persons = await Person._personRepository.find(cond);
    return <IPerson[]>persons;
  }

  static async getPerson(personID: ObjectId): Promise<IPerson> {
    const person = await Person._personRepository.findById(personID);
    if (!person) return Promise.reject(new Error('Cannot find person with ID: ' + personID));
    return <IPersonModel>person;
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

  static async createPerson(person: IPerson): Promise<IPerson> {
    const newPerson = await Person._personRepository.create(person);
    return <IPerson>newPerson;
  }

  static async discharge(personID: ObjectId): Promise<any> {
    let person = await Person.getPerson(personID);

    // If the person was in a group, notify it
    if (person && person.directGroup) {
      person = await Person.dismiss(personID);
    }

    person.alive = false;
    const res = await Person._personRepository.update(personID, person);
    return res;
  }

  static async removePerson(personID: ObjectId): Promise<any> {
    const res = await Person._personRepository.delete(personID);
    return res.result.n > 0 ? res.result : Promise.reject(new Error('Cannot find person with ID: ' + personID));
  }

  static async updatePerson(person: IPerson): Promise<IPerson> {
    const updatedPerson = await Person._personRepository.update(person.id, person);
    if (!updatedPerson) return Promise.reject(new Error('Cannot find person with ID: ' + person.id));
    return <IPerson>updatedPerson;
  }

  static async updateTeam(personID: ObjectId, newTeamID: ObjectId): Promise<IPerson> {
    const person = await Person.getPerson(personID);
    person.directGroup = newTeamID;
    return await Person.updatePerson(person);
  }

  // Will transfer person between groups automatically. Is that what we want?
  static async assign(personID: ObjectId, groupID: string): Promise<IPerson> {
    let person = await Person.getPerson(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    person.directGroup = group._id;
    person = await Person.updatePerson(person);
    return <IPerson>person;
  }

  // Will delete managedGroup too
  static async dismiss(personID: ObjectId) {
    let person = await Person.getPerson(personID);
    if (!person.directGroup) return;

    person.directGroup = null;
    if (person.managedGroup) person.managedGroup = null;
    person = await Person.updatePerson(person);
    return person;
  }

  static async manage(personID: ObjectId, groupID: string) {
    const person = await Person.getPerson(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);
    
    if (String(person.directGroup) !== String(groupID)) {
      return Promise.reject(new Error('This person is not a member in this group, hence can not be appointed as a leaf'));
    }
    // else
    person.managedGroup = group._id;
    await Person.updatePerson(person);
    return;
  }

  static async resign(personID: ObjectId) {
    const person = await Person.getPerson(personID);
    person.managedGroup = undefined;
    await Person.updatePerson(person);
  }
}
