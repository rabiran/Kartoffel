import { Request, Response, NextFunction, Router } from 'express';

export class GroupRouteParamsValidate {

    static startsWithAnA(str: string) {
        if (str[0] != 'A') {
            throw new Error('Does not start with an A!');
        }
    }

    static toDo() {
        return;
    }

    static differentParams(param_1: any, param_2: any) {
        if (param_1 == param_2) {
            throw new Error('Cannot receive identical parameters!');
        }
    }
}

export const validatorMiddleware =
    (validator: Function, varNames: Array<string>, path: string = 'body') =>
    (req: Request, res: Response, next: NextFunction) => {
        const vars = varNames.map(varName => req[path][varName]);
        try {
            const result = validator(...vars);
            next();
        } catch (err) {
            res.status(400).send(err.message);
        }
};