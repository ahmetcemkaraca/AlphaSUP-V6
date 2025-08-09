/**
 * Async Handler Middleware
 * Wraps async functions to catch errors automatically
 */
import { NextFunction, Request, Response } from 'express';
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncHandler.d.ts.map