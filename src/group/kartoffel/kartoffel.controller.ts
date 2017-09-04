import { Request, Response, NextFunction } from 'express';
import { KartoffelRepository } from './kartoffel.repository';
import { IKartoffel } from './kartoffel.interface';
import { User } from '../../user/user.controller';
import { Document } from 'mongoose';
import * as _ from 'lodash';

export class Kartoffel {
    static _kartoffelRepository: KartoffelRepository = new KartoffelRepository;

    static async getAllKartoffeln(): Promise<IKartoffel[]> {
        const kartoffeln = await Kartoffel._kartoffelRepository.getAll();
        return <IKartoffel[]>kartoffeln;
    }

    static async createKartoffel( kartoffel: IKartoffel, parentID: string = undefined ): Promise<IKartoffel> {
        if (parentID) {
            // Create group hierarchy
            const parentsHierarchy = await Kartoffel.getHierarchy(parentID);
            parentsHierarchy.push(parentID);
            kartoffel.ancestors = parentsHierarchy;
        }
        // Create the Group
        const newKartoffel = await Kartoffel._kartoffelRepository.create(kartoffel);
        if (parentID) {
            // Update the parent
            Kartoffel.adoptChildren(parentID, [newKartoffel._id]);
        }
        return <IKartoffel>newKartoffel;
    }

    static async getKartoffel(kartoffelID: string): Promise<IKartoffel> {
        const kartoffel = await Kartoffel._kartoffelRepository.findById(kartoffelID);
        if (!kartoffel) throw new Error('Cannot find group with ID: ' + kartoffelID);
        return <IKartoffel>kartoffel;
    }

    static async updateKartoffel(updateTo: IKartoffel): Promise<IKartoffel> {
        const updated = await Kartoffel._kartoffelRepository.update(updateTo);
        if (!updated) throw new Error('Cannot find group with ID: ' + updateTo._id);
        return <IKartoffel>updated;
    }

    static async addUsers(kartoffelID: string, users: Array<string>, areAdmins: boolean = false): Promise<IKartoffel> {
        if (areAdmins) {
            if (!(await Kartoffel.isMember)) {
                throw new Error('This user is not a member in this group, hence can not be appointed as a leaf');
            }
        }
        const type = areAdmins ? 'admins' : 'members';
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        kartoffel[type].push(...users);
        return await Kartoffel.updateKartoffel(kartoffel);
    }

    static async removeUsers(kartoffelID: string, users: Array<string>, areAdmins: boolean = false): Promise<IKartoffel> {
        const type = areAdmins ? 'admins' : 'members';
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        _.pull(kartoffel[type], ...users);
        return Kartoffel.updateKartoffel(kartoffel);
    }

    static async transferUsers(from: string, to: string, users: Array<string>, areAdmins: boolean = false): Promise<void> {
        if (areAdmins) {
            Kartoffel.transferUsers(from, to, users);
        }
        await Kartoffel.removeUsers(from, users, areAdmins);
        await Kartoffel.addUsers(to, users, areAdmins);
    }

    static async childrenAdoption(parentID: string, childrenIDs: Array<string>): Promise<void> {
        // Update the children's previous parents
        const children = <IKartoffel[]>(await Kartoffel._kartoffelRepository.getSome(childrenIDs));
        await Promise.all(children.map(child => Kartoffel.disownChild(child.ancestors[0], child._id)));
        // Update the parent and the children
        await Promise.all([
                Kartoffel.adoptChildren(parentID, childrenIDs),
                Kartoffel.updateChildrenHierarchy(parentID, childrenIDs)
            ]);
        return;
    }

    static async adoptionWrapper(parentID: string, childrenIDs: Array<string>): Promise<void> {
        // Update Group Members
        const parent = await Kartoffel.getKartoffel(parentID);
        const members = parent.members;
        await Promise.all(members.map(member => User.updateTeam(<string>member, parentID)));
        // Update the Groups
        return await Kartoffel.childrenAdoption(parentID, childrenIDs);
    }

    private static async updateChildrenHierarchy(parentID: string, childrenIDs: Array<string> = []): Promise<void> {
        if (childrenIDs.length == 0) {
            const parent = await Kartoffel.getKartoffel(parentID);
            childrenIDs = <string[]>(parent.children);
        }
        const hierarchy = await Kartoffel.getHierarchy(parentID);
        hierarchy.unshift(parentID);
        const updated = await Kartoffel._kartoffelRepository.findAndUpdateSome(childrenIDs, { ancestors: hierarchy});
        await Promise.all(childrenIDs.map((childID => Kartoffel.updateChildrenHierarchy(childID))));
        return;
    }

    // Update the father about his child
    private static async adoptChildren(kartoffelID: string, childrenIDs: Array<string>): Promise<IKartoffel> {
        const parent = await Kartoffel.getKartoffel(kartoffelID);
        parent.children.push(...childrenIDs);
        return await Kartoffel.updateKartoffel(parent);
    }

    private static async disownChild(parentID: string, childID: string): Promise<IKartoffel> {
        if (!parentID) return;
        const parent = await Kartoffel.getKartoffel(parentID);
        _.pull(parent.children, childID);
        return await Kartoffel.updateKartoffel(parent);
    }

    private static async getHierarchy(kartoffelID: string): Promise<Array<string>> {
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        if (!kartoffel.ancestors) return [];
        return <string[]>kartoffel.ancestors;
    }

    private static async isMember(groupID: string, userID: string): Promise<boolean> {
        const group = await Kartoffel.getKartoffel(groupID);
        const members = group.members;
        return _.includes(members, userID);
    }
}