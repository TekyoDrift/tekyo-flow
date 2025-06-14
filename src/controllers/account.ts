import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { Account } from '../models';
import { Request, Response } from 'express';
import { AccountRole } from '../types';
import { OFFICE_ROLES } from '../middlewares';
import { genSaltSync, hashSync } from 'bcrypt';
import { SALT_ROUNDS, JWT_EXPIRES_IN, JWT_SECRET } from '../config';
import { Op } from 'sequelize';

/**
 * @brief Schema for validating profile update requests.
 */
const PROFILE_UPDATE_SCHEMA = Joi.object({
  firstname: Joi.string().trim().min(2).max(50).optional(),
  lastname: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().trim().email().optional(),
  password: Joi.string().trim().min(6).optional()
}).or('firstname', 'lastname', 'email', 'password');

/**
 * @brief Controller for handling account-related operations.
 */
class AccountController {
  /**
   * @brief Fetches the profile of the authenticated user.
   * @param req - The request object containing user information.
   * @param res - The response object to send the profile data.
   * @returns A JSON response with the user's profile data or an error message.
   */
  public async getProfile(req: Request, res: Response) {
    try {
      // Get account email from request
      const email = req.user?.email;

      // Find account by ID
      const account = await Account.findOne({
        where: { email: email },
        attributes: ['firstname', 'lastname', 'email', 'role', 'created_at', 'updated_at']
      });

      // If account is not found, return a 404 error
      if (!account) {
        res.status(404).json({
          status: 404,
          message: 'Account not found'
        });
        return;
      }

      res.status(200).json({
        ...account.dataValues
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @brief Updates the profile of the authenticated user.
   * @param req - The request object containing the profile data to update.
   * @param res - The response object to send the updated profile data or an error message.
   * @returns A JSON response with the updated profile data or an error message.
   */
  public async updateProfile(req: Request, res: Response) {
    try {
      // Validate the request body against the schema
      const { error, value } = PROFILE_UPDATE_SCHEMA.validate(req.body);
      if (error) {
        res.status(400).json({
          status: 400,
          message: 'Validation error',
          details: error.details.map((detail) => detail.message)
        });
        return;
      }

      // Get account email from request
      const email = req.user?.email;

      // Create a new object to hold the updated values
      let newValue = { ...value };

      // Hash password if provided
      if (newValue.password) {
        // Generate salt and hash the password
        newValue.salt = genSaltSync(SALT_ROUNDS);
        newValue.password = hashSync(newValue.password, newValue.salt);
      }

      if (newValue.lastname) {
        newValue.lastname = (newValue.lastname as string).trim().toUpperCase();
      }

      if (newValue.firstname) {
        newValue.firstname = (newValue.firstname as string).trim().toUpperCase();
      }

      // Find account by email and update with new data
      const [updated] = await Account.update(newValue, {
        where: { email: email }
      });

      if (!updated) {
        res.status(404).json({
          status: 404,
          message: 'Account not found'
        });
        return;
      }

      // Fetch the updated account data
      const account = await Account.findOne({
        where: { email: newValue.email || email },
        attributes: ['id', 'firstname', 'lastname', 'email', 'role', 'created_at', 'updated_at']
      });

      if (!account) {
        res.status(404).json({
          status: 404,
          message: 'Account not found'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: account.id,
          email: account.email,
          role: account.role
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN
        } as jwt.SignOptions
      );

      res.setHeader('Authorization', `Bearer ${token}`);

      res.status(200).json({
        firstname: account.firstname,
        lastname: account.lastname,
        email: account.email,
        role: account.role,
        created_at: account.created_at,
        updated_at: account.updated_at
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @brief Fetches all accounts in the system.
   * @param req - The request object.
   * @param res - The response object to send the accounts data.
   * @returns A JSON response with the list of accounts or an error message.
   */
  public async getAllAccounts(req: Request, res: Response) {
    try {
      // Ensure the user has the required role to access this endpoint
      let attributes = ['firstname', 'lastname', 'role'];

      const isOfficeRole = OFFICE_ROLES.includes(req.user?.role as AccountRole);

      if (isOfficeRole) {
        attributes.push('email');
        attributes.push('updated_at');
        attributes.push('created_at');
      }

      // Fetch all accounts with specified attributes
      const accounts = await Account.findAll({
        attributes,
        where: isOfficeRole
          ? {}
          : {
              role: {
                [Op.not]: AccountRole.GUEST
              }
            }
      });

      res.status(200).json(accounts.map((account) => account.dataValues));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }
}

// Export an instance of the AccountController
export const accountController = new AccountController();
