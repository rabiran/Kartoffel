import { Request, Response, NextFunction } from 'express';
import { Person } from '../person/person.controller';

// TODO: Implement this!
export class PermissionMiddleware {
    // Permission to view
  public static async hasBasicPermission(req: Request, res: Response, next: NextFunction) {
    return next();
  }
    // Permission to change person custom data
  public static async hasPersonsPermission(req: Request, res: Response, next: NextFunction) {
    return next();
  }
    // Stronger Permissions
  public static async hasAdvancedPermission(req: Request, res: Response, next: NextFunction) {
    return next();
  }
}
