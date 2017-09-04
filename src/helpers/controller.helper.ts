import { Request, Response, NextFunction, Router } from 'express';

/**
 * Handles controller execution and responds to user (API Express version).
 * Web socket has a similar handler implementation.
 * @param promise Controller Promise. I.e. getUser.
 * @param params A function (req, res, next), all of which are optional
 * that maps our desired controller parameters. I.e. (req) => [req.params.username, ...].
 */
export const controllerHandler = (promise: Function, params: Function, errorCode: number = 500) => async (req: Request, res: Response, next: NextFunction) => {
    const boundParams = params ? params(req, res, next) : [];
    try {
        const result = await promise(...boundParams);
        return res.json(result || { message: 'OK' });
    } catch (error) {
        return res.status(errorCode).send({ error: error + '' });
    }
};