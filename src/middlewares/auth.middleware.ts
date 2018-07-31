import { Request, Response, NextFunction } from 'express';
import { Person } from '../person/person.controller';

// TODO: Implement this!
export class AuthMiddleware {
  public static async verifyClient(req: Request, res: Response, next: NextFunction) {
    return next();
  }
  public static async verifyToken(req: Request, res: Response, next: NextFunction) {
    await AuthMiddleware.verifyClient(req, res, () => {
      return next();
    });
  }
}
