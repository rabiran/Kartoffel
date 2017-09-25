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
            const parentsHierarchy = await Kartoffel.getAncestors(parentID);
            parentsHierarchy.unshift(parentID);
            kartoffel.ancestors = parentsHierarchy;
            await Kartoffel.getHierarchyFromAncestors(kartoffel._id, kartoffel);
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

    static async getUpdatedFrom(from: Date, to: Date) {
        const users = await Kartoffel._kartoffelRepository.getUpdatedFrom(from, to);
        return <IKartoffel[]>users;
    }

    static async updateKartoffel(updateTo: IKartoffel): Promise<IKartoffel> {
        const updated = await Kartoffel._kartoffelRepository.update(updateTo);
        if (!updated) throw new Error('Cannot find group with ID: ' + updateTo._id);
        return <IKartoffel>updated;
    }

    static async changeName(groupID: string, name: string): Promise<IKartoffel> {
        return;
    }

    static async addAdmin(kartoffelID: string, userID: string): Promise<IKartoffel> {
        const isMember = await Kartoffel.isMember(kartoffelID, userID);
        if (!isMember) {
            throw new Error('This user is not a member in this group, hence can not be appointed as a leaf');
        } else {
            const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
            kartoffel.admins = _.union(kartoffel.admins, [userID]);
            return await Kartoffel.updateKartoffel(kartoffel);
        }
    }

    static async addUsers(kartoffelID: string, users: Array<string>, areAdmins: boolean = false): Promise<IKartoffel> {
        const type = areAdmins ? 'admins' : 'members';
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        kartoffel[type] = _.union(kartoffel[type], users);
        return await Kartoffel.updateKartoffel(kartoffel);
    }

    static async dismissMember(kartoffelID: string, member: string): Promise<void> {
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        _.pull(kartoffel.members, member);
        // If the member is an admin as well, remove him from the admins list
        if (kartoffel.admins.indexOf(member) != -1) {
            _.pull(kartoffel.admins, member);
        }
        await Kartoffel.updateKartoffel(kartoffel);
        return;
    }

    static async fireAdmin(kartoffelID: string, manager: string): Promise<void> {
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        _.pull(kartoffel.members, manager);
        await Kartoffel.updateKartoffel(kartoffel);
        return;
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

    static async deleteGroup(groupID: string): Promise<any> {
        const group = await Kartoffel.getKartoffel(groupID);
        // Check that the group has no members or children
        if (group.children.length > 0) {
            throw new Error('Can not delete a group with sub groups!');
        }
        if (group.members.length > 0) {
            throw new Error('Can not delete a group with members!');
        }
        // Find the parent, if there is one
        let parentID = undefined;
        if (group.ancestors.length > 0) {
            parentID = group.ancestors[0];
        }
        // Delete the group
        const res = await Kartoffel._kartoffelRepository.delete(groupID);
        // Inform the parent about his child's death
        if (parentID) {
            await Kartoffel.disownChild(parentID, groupID);
        }
        return res.result;
    }

    private static async updateChildrenHierarchy(parentID: string, childrenIDs: Array<string> = []): Promise<void> {
        const parent = await Kartoffel.getKartoffel(parentID);
        if (childrenIDs.length == 0) {
            childrenIDs = <string[]>(parent.children);
        }
        const ancestors = await Kartoffel.getAncestors(parentID);
        ancestors.unshift(parentID);
        const hierarchy = await Kartoffel.getHierarchyFromAncestors(parentID);
        hierarchy.unshift(parent.name);
        const updated = await Kartoffel._kartoffelRepository.findAndUpdateSome(childrenIDs, { ancestors, hierarchy });
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

    private static async getAncestors(kartoffelID: string): Promise<Array<string>> {
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        if (!kartoffel.ancestors) return [];
        return <string[]>kartoffel.ancestors;
    }

    private static async isMember(groupID: string, userID: string): Promise<boolean> {
        const group = await Kartoffel.getKartoffel(groupID);
        const members = group.members;
        return _.includes(members, userID);
    }
    private static async getHierarchyFromAncestors(groupID: string, group?: IKartoffel): Promise<Array<string>> {
        if (!group) {
            group = await Kartoffel.getKartoffel(groupID);
        }
        const parentID = group.ancestors[0];
        if (!parentID) return [];
        const parent = await Kartoffel.getKartoffel(parentID);
        const newHierarchy = parent.hierarchy.concat(parent.name);
        group.hierarchy = newHierarchy;
        return newHierarchy;
    }
}