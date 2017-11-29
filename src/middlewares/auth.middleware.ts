import { Request, Response, NextFunction } from 'express';
import { User } from '../user/user.controller';

import * as passport from 'passport';

// TODO: Implement this!
export class AuthMiddleware {
 
 	// Not sure why you would want to use async here
    public static async verifyClient(req: Request, res: Response, next: NextFunction) {
        return next();
    }
 
    public static async verifyToken(req: Request, res: Response, next: NextFunction) {

    	 passport.authenticate('jwt', { session: false })(req,res,next)

        // await AuthMiddleware.verifyClient(req, res, () => {
        //     return next();
        // });
    }
}