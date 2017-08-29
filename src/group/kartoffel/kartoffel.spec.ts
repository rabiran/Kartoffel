import * as chai from 'chai';
import { Kartoffel } from './kartoffel.controller';
import { KartoffelModel } from './kartoffel.model';
import { IKartoffel } from './kartoffel.interface';
import { expectError } from '../../helpers/spec.helper';


const should = chai.should();
chai.use(require('chai-http'));


before(async () => {
    KartoffelModel.remove({}, (err) => {});
});

describe('Strong Groups', () => {
    describe('#getKartoffeln', () => {
        it('Should be empty if there are no groups', async () => {
            const groups = await Kartoffel.getAllKartoffeln();
            groups.should.be.a('array');
            groups.should.have.lengthOf(0);
        });
        it('Should get all the groups', async () => {
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'myGroup'});

            let groups = await Kartoffel.getAllKartoffeln();
            groups.should.be.a('array');
            groups.should.have.lengthOf(1);
            should.exist(groups[0]);
            groups[0].should.have.property('name', 'myGroup');


            await Kartoffel.createKartoffel(<IKartoffel>{name: 'yourGroup'});
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'hisGroup'});

            groups = await Kartoffel.getAllKartoffeln();
            groups.should.be.a('array');
            groups.should.have.lengthOf(3);
            groups[0].should.have.property('name', 'myGroup');
            groups[1].should.exist;
            groups[2].should.have.property('name', 'hisGroup');
        });
    });
    describe('#createKartoffel', () => {
        it('Should create a simple group', async () => {
            const group = await Kartoffel.createKartoffel(<IKartoffel>{name: 'Biran'});
            group.should.exist;
            group.should.have.property('name', 'Biran');
            group.should.have.property('ancestors');
            group.ancestors.should.be.an('array');
            group.ancestors.should.have.lengthOf(0);
        });
        it('Should throw an error when parent doesn\'t exist', async () => {
            expectError(Kartoffel.createKartoffel, [<IKartoffel>{name: 'Biran'}, '597053012c3b60031211a063'] );
        });
        it('Should throw an error when group is undefined', async () => {
            expectError(Kartoffel.createKartoffel, [undefined] );
        });
        it('Should create a group correctly with one parent', async () => {
            const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'Ido'});
            const child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'Elad'}, parent.id);
            child.should.exist;
            child.should.have.property('ancestors');
            child.ancestors.should.have.lengthOf(1);
            const hisParent = child.ancestors[0].toString();
            hisParent.should.equal(parent.id);
        });
    });
});