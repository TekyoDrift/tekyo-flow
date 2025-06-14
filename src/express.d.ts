import { Request } from 'express';
import { AccountRole } from './types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: AccountRole;
      };
      token?: string;
    }
  }
}
