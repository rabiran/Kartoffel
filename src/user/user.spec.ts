import * as chai from 'chai';
import * as server from '../server';
import * as userRouter from './user.route';
import { User } from './user.controller';


chai.should();
chai.use(require('chai-http'));


describe('Users', () => {
    // describe('GET all users', () => {
    //     it('it should GET an empty array', (done) => {
    //         chai.request(server)
    //             .get('/api/user/getAll')
    //             .end((err, res) => {
    //                 res.should.have.status(200);
    //                 res.body.should.be.a('array');
    //                 res.body.length.should.be.eql(0);
    //                 done();
    //             });
    //     });
    // });
    describe('#getUsers', () => {
        it('Should be empty if there are no users', async () => {
            const res = await User.getUsers();
            res.should.be.a('array');
            res.should.have.lengthOf(0);
            return;
        });
    });
});