import {
    Request,
    Response,
    NextFunction
} from 'express';
import {
    User
} from '../user/user.controller';

// TODO: Implement this!
export class PermissionMiddleware {

    // Permission to view

    public static allowedFieldsOnly(entity, op) {

        op = op || 'view';

        return function(req: Request, res: Response, next: NextFunction) {

            var allowed = fields[entity][op][req.user['role']].concat(fields[entity][op].all);

            // this  is not effieient as an array - just for demo
            var notAllowed = false;

            for (var index in req.body) {

                if (allowed.indexOf(index) == -1) {
                    // you can be nice and tell them which one
                    return res.status(403).json({
                        message: 'No permission to edit field ' + index
                    })
                }
            }

            return next();
        }
    }


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


let fields = {
    'user': {
        'edit': {
            'boss': ['role'],
            'worker': [],
            'all': ['name']
        },
        'view': {
            'boss': ['role'],
            'worker': [],
            'all': ['name']
        }

    }
}