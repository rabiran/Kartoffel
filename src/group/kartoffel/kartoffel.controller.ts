import { Request, Response, NextFunction } from 'express';
import { KartoffelRepository } from './kartoffel.repository';
import { IKartoffel } from './kartoffel.interface';
import { Document } from 'mongoose';

export class Kartoffel {
    static _kartoffelRepository: KartoffelRepository = new KartoffelRepository;

    static async getAllKartoffeln(): Promise<IKartoffel[]> {
        const kartoffeln = await Kartoffel._kartoffelRepository.getAll();
        return <IKartoffel[]>kartoffeln;
    }

    static async createKartoffel( kartoffel: IKartoffel, parentID: string = undefined ): Promise<IKartoffel> {
        if (parentID) {
            const parentsHierarchy = await Kartoffel.getHierarchy(parentID);
            parentsHierarchy.push(parentID);
            kartoffel.ancestors = parentsHierarchy;
        }
        const newKartoffel = await Kartoffel._kartoffelRepository.create(kartoffel);
        return <IKartoffel>newKartoffel;
    }

    static async getKartoffel(kartoffelID: string): Promise<IKartoffel> {
        const kartoffel = await Kartoffel._kartoffelRepository.findById(kartoffelID);
        return <IKartoffel>kartoffel;
    }

    private static async getHierarchy(kartoffelID: string): Promise<Array<string>> {
        const kartoffel = await Kartoffel.getKartoffel(kartoffelID);
        if (!kartoffel.ancestors) return [];
        return <string[]>kartoffel.ancestors;
    }
}