import { Request, Response } from 'express';
import { genSaltSync, hashSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Account } from '../models';
import { AccountRole } from '../types';
import { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } from '../config';

/**
 * @brief Validates the user registration data.
 */
const REGISTER_SCHEMA = Joi.object({
  firstname: Joi.string().trim().min(2).max(50).required(),
  lastname: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required()
});

/**
 * @brief Validates the user login credentials.
 */
const LOGIN_SCHEMA = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().min(6).required()
});

class AuthController {
  /**
   * @brief Logs in a user.
   * @param req - The request object containing user credentials.
   * @param res - The response object used to send the result.
   */
  public async login(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = LOGIN_SCHEMA.validate(req.body);
      if (error) {
        res.status(400).json({
          status: 400,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message)
        });
        return;
      }

      // Destructure validated value
      const { email, password } = value;

      // Find account by email
      const account = await Account.findOne({ where: { email } });
      if (!account) {
        res.status(401).json({
          status: 401,
          message: 'Invalid email or password'
        });
        return;
      }

      // Verify password
      const hashedPassword = hashSync(password, account.salt);
      if (hashedPassword !== account.hashed_password) {
        res.status(401).json({
          status: 401,
          message: 'Invalid email or password'
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
        token,
        account: {
          firstname: account.firstname,
          lastname: account.lastname,
          email: account.email,
          role: account.role,
          created_at: account.created_at
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @brief Registers a new user.
   * @param req - The request object containing user registration data.
   * @param res - The response object used to send the result.
   */
  public async register(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = REGISTER_SCHEMA.validate(req.body);
      if (error) {
        res.status(400).json({
          status: 400,
          message: 'Validation error',
          errors: error.details.map((detail) => detail.message)
        });
        return;
      }

      // Destructure validated value
      const { firstname, lastname, email, password } = value;

      // Check if account already exists
      const existingAccount = await Account.findOne({ where: { email } });
      if (existingAccount) {
        res.status(409).json({
          status: 409,
          message: 'Account with this email already exists'
        });
        return;
      }

      // Generate salt and hash password
      const salt = genSaltSync(SALT_ROUNDS);
      const hashed_password = hashSync(password, salt);

      // Create new account
      const account = await Account.create({
        firstname: firstname.trim().toUpperCase(),
        lastname: lastname.trim().toUpperCase(),
        email,
        hashed_password,
        salt,
        role: AccountRole.GUEST
      });

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

      res.status(201).json({
        token,
        account: {
          firstname: account.firstname,
          lastname: account.lastname,
          email: account.email,
          role: account.role,
          created_at: account.created_at
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }
}

export const authController = new AuthController();
