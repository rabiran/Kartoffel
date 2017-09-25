import * as chai from 'chai';
import { Kartoffel } from './kartoffel.controller';
import { KartoffelModel } from './kartoffel.model';
import { IKartoffel } from './kartoffel.interface';
import { expectError } from '../../helpers/spec.helper';


const should = chai.should();
const expect = chai.expect;
chai.use(require('chai-http'));


before(async () => {
    KartoffelModel.remove({}, (err) => {});
});

const ID_EXAMPLE = '59a56d577bedba18504298df';
const idXmpls = ['59a6aa1f5caa4e4d2ac39797', '59a56d577bedba18504298df'];


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
    describe('#get updated groups from a given date', () => {
        it('Should throw an error when date is undefined', async() => {
            expectError(Kartoffel.getUpdatedFrom, []);
        });
        it('Should get the current groups', async () => {
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_-2'});
            const update_1 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_-1'});
            const from = new Date();
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_1'});
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_2'});
            const update_2 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_3'});
            await Kartoffel.updateKartoffel(update_1);
            const to = new Date();
            await Kartoffel.createKartoffel(<IKartoffel>{name: 'group_4'});
            await Kartoffel.updateKartoffel(update_2);
            const groups = await Kartoffel.getUpdatedFrom(from, to);

            groups.should.exist;
            // groups.should.have.lengthOf(3);
            groups[0].should.have.property('name', 'group_-1');
            groups[1].should.have.property('name', 'group_1');
            groups[2].should.have.property('name', 'group_2');

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
            group.hierarchy.should.have.lengthOf(0);
        });
        it('Should throw an error when parent doesn\'t exist', async () => {
            await expectError(Kartoffel.createKartoffel, [<IKartoffel>{name: 'Biran'}, '597053012c3b60031211a063'] );
        });
        it('Should throw an error when group is undefined', async () => {
            await expectError(Kartoffel.createKartoffel, [undefined] );
        });
        it('Should create a group correctly with one parent', async () => {
            const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'Ido'});
            const child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'Elad'}, parent.id);
            child.should.exist;
            child.should.have.property('ancestors');
            child.ancestors.should.have.lengthOf(1);
            const hisParent = child.ancestors[0].toString();
            hisParent.should.equal(parent.id);
            child.hierarchy.should.have.lengthOf(1);
            child.hierarchy[0].should.be.equal(parent.name);
        });
        it('Should create a group correctly with two ancestors', async () => {
            const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'grandparent'});
            const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent'}, grandparent.id);
            const child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'child'}, parent.id);
            child.should.exist;
            child.should.have.property('ancestors');
            child.ancestors.should.have.lengthOf(2);
            const hisParent = child.ancestors[0].toString();
            const hisGrandparent = child.ancestors[1].toString();
            hisParent.should.equal(parent.id);
            hisGrandparent.should.equal(grandparent.id);
            child.hierarchy.should.have.lengthOf(2);
            child.hierarchy[0].should.be.equal(grandparent.name);
            child.hierarchy[1].should.be.equal(parent.name);
        });
    });
    describe('#getKartoffelByID', () => {
        it('Should throw an error when there is no matching group', async () => {
            await expectError(Kartoffel.getKartoffel, [ID_EXAMPLE]);
        });
        it('Should return the group if existed', async () => {
            const kartoffel = await Kartoffel.createKartoffel(<IKartoffel>{name: 'myGroup'});
            const res = await Kartoffel.getKartoffel(kartoffel.id);

            res.should.exist;
            res.should.have.property('id', kartoffel.id);
            res.should.have.property('name', kartoffel.name);
        });
    });
    describe('Update Kartoffel', () => {
        describe('#updateKartoffel', () => {
            it('Should throw an error if the group doesn\'t exist', async () => {
                // Kartoffel.updateKartoffelDry(ID_EXAMPLE, <IKartoffel>{name: 'newName'});
                await expectError(Kartoffel.updateKartoffel, [<IKartoffel>{_id: ID_EXAMPLE, name: 'newName'}]);
            });
            it('Should update the group', async() => {
                const kartoffel = await Kartoffel.createKartoffel(<IKartoffel>{name: 'myTeam'});
                const updated = await Kartoffel.updateKartoffel(<IKartoffel>{_id: kartoffel.id, name: 'newName'});

                updated.should.exist;
                updated.should.have.property('name', 'newName');
            });


        });
        describe('#childrenAdoption', () => {
            it('Should throw an error if parent does not exist', async () => {
                await expectError(Kartoffel.childrenAdoption, [ID_EXAMPLE]);
            });
            it('Should update a child\'s parent', async () => {
                const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent'});
                let child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'child'});

                await Kartoffel.childrenAdoption(parent._id, [child._id]);

                child = await Kartoffel.getKartoffel(child._id);

                child.should.exist;
                child.should.have.property('ancestors');
                child.ancestors.should.have.lengthOf(1);
                expect(child.ancestors[0].toString() == parent._id.toString()).to.be.ok;
                child.should.have.property('hierarchy');
                child.hierarchy.should.have.lengthOf(1);
                child.hierarchy[0].should.be.equal(parent.name);
            });
            it('Should update the child\'s previous parent', async () => {
                const parent_old = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent_old'});
                let child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'child'});
                const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent'});

                await Kartoffel.childrenAdoption(parent_old._id, [child._id]);
                await Kartoffel.childrenAdoption(parent._id, [child._id]);
                child = await Kartoffel.getKartoffel(child._id);

                child.should.exist;
                child.should.have.property('ancestors');
                child.ancestors.should.have.lengthOf(1);
                expect(child.ancestors[0].toString() == parent._id.toString()).to.be.ok;
            });
            it('Should update a child\'s hierarchy', async () => {
                const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'grandparent'});
                const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent'});
                let child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'child'});

                await Kartoffel.childrenAdoption(grandparent._id, [parent._id]);
                await Kartoffel.childrenAdoption(parent._id, [child._id]);

                child = await Kartoffel.getKartoffel(child._id);

                child.should.exist;
                child.should.have.property('ancestors');
                child.ancestors.should.have.lengthOf(2);
                expect(child.ancestors[0].toString() == parent._id.toString()).to.be.ok;
                expect(child.ancestors[1].toString() == grandparent._id.toString()).to.be.ok;
            });
            it('Should update a child\'s hierarchy multiple times', async () => {
                const grandparent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'grandparent'});
                const grandparent_2 = await Kartoffel.createKartoffel(<IKartoffel>{name: 'grandparent_2'});
                const parent = await Kartoffel.createKartoffel(<IKartoffel>{name: 'parent'});
                let child = await Kartoffel.createKartoffel(<IKartoffel>{name: 'child'});

                await Kartoffel.childrenAdoption(grandparent._id, [parent._id]);
                await Kartoffel.childrenAdoption(parent._id, [child._id]);
                await Kartoffel.childrenAdoption(grandparent_2._id, [parent._id]);

                child = await Kartoffel.getKartoffel(child._id);

                child.should.exist;
                child.should.have.property('ancestors');
                child.ancestors.should.have.lengthOf(2);
                expect(child.ancestors[0].toString() == parent._id.toString()).to.be.ok;
                expect(child.ancestors[1].toString() == grandparent_2._id.toString()).to.be.ok;
            });
        });
    });
    describe('#deleteKartoffel', () => {
        it('Should throw an error if the group does not exist', async () => {
            expectError(Kartoffel.deleteGroup, [ID_EXAMPLE]);
        });
        it('Should delete the group', async () => {
            const group = await Kartoffel.createKartoffel(<IKartoffel>{_id: ID_EXAMPLE, name: 'group'});
            const res = await Kartoffel.deleteGroup(group._id);
            res.should.exist;
            res.should.have.property('ok', 1);
            res.should.have.property('n', 1);
            expectError(Kartoffel.getKartoffel, [group._id]);
        });
        it('Should not remove a group with children', async () => {
            const group = await Kartoffel.createKartoffel(<IKartoffel>{_id: ID_EXAMPLE, name: 'group'});
            const child = await Kartoffel.createKartoffel(<IKartoffel>{_id: idXmpls[0], name: 'child'});
            await Kartoffel.childrenAdoption(group._id, [child._id]);
            expectError(Kartoffel.deleteGroup, [group._id]);
        });
    });
});