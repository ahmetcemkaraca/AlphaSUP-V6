import 'express';
import { UserRole } from '../middleware/auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      uid: string;
      email?: string;
      role: UserRole;
      isAdmin: boolean;
      isEditor: boolean;
    };
  }
}
