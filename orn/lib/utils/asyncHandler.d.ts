/**
 * Express async handler utility
 * Wraps async route handlers to catch errors
 *
 * @usage: router.get('/', asyncHandler(myAsyncHandler))
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';
export declare function asyncHandler<T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>): RequestHandler;
//# sourceMappingURL=asyncHandler.d.ts.map