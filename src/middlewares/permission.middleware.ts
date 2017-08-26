import { Request, Response, NextFunction } from 'express';
import { User } from '../user/user.controller';

// TODO: Implement this!
export class PermissionMiddleware {
    // Permission to view
    public static async hasBasicPermission(req: Request, res: Response, next: NextFunction) {
        return next();
    }
    // Permission to change user custom data
    public static async hasUsersPermission(req: Request, res: Response, next: NextFunction) {
        return next();
    }
    // Stronger Permissions
    public static async hasAdvancedPermission(req: Request, res: Response, next: NextFunction) {
        return next();
    }
}