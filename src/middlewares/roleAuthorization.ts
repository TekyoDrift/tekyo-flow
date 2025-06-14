import { Request, Response, NextFunction } from 'express';
import { AccountRole } from '../types';
import { authToken } from './authToken';

/**
 * @brief List of roles that are considered office roles.
 * These roles typically have administrative privileges.
 */
export const OFFICE_ROLES: AccountRole[] = [
  AccountRole.PRESIDENT,
  AccountRole.VICE_PRESIDENT,
  AccountRole.SECRETARY,
  AccountRole.TREASURER
];

/**
 * @brief Middleware to whitelist roles for accessing certain routes.
 * @param roles - The roles that are allowed to access the route.
 */
export function whitelistRoles(...roles: AccountRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    authToken(req, res, () => {
      const userRole = req.user?.role;

      if (!userRole || !roles.includes(userRole)) {
        res.status(403).json({
          status: 403,
          message: 'Forbidden, you do not have the required role to access this resource.',
        });
        return;
      }

      next();
    });
  };
}

/**
 * @brief Middleware to blacklist certain roles from accessing a route.
 * @param roles - The roles to blacklist.
 */
export function blacklistRoles(...roles: AccountRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    authToken(req, res, () => {
      const userRole = req.user?.role;

      if (!userRole || roles.includes(userRole)) {
        res.status(403).json({
          status: 403,
          message: 'Forbidden, you do not have the required role to access this resource.'
        });
        return;
      }

      next();
    });
  };
}
