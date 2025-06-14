import { Request, Response } from 'express';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { Account } from '../models';
import { AccountRole } from '../types';

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

class AuthController {
  /**
   * @brief Validates the user registration data.
   */
  private REGISTER_SCHEMA = Joi.object({
    firstname: Joi.string().min(2).max(50).required(),
    lastname: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  /**
   * @brief Validates the user login credentials.
   */
  private LOGIN_SCHEMA = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  /**
   * @brief Generates a JWT token for the user.
   * @param id - The user's ID.
   * @param email - The user's email.
   * @param role - The user's role.
   * @returns A JWT token as a string.
   */
  private generateToken(id: number, email: string, role: AccountRole): string {
    const payload = { id, email, role };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * @brief Logs in a user.
   * @param req - The request object containing user credentials.
   * @param res - The response object used to send the result.
   */
  public async login(req: Request, res: Response) {}

  /**
   * @brief Registers a new user.
   * @param req - The request object containing user registration data.
   * @param res - The response object used to send the result.
   */
  public async register(req: Request, res: Response) {
    try {
      // Validate request body
      const { error, value } = this.REGISTER_SCHEMA.validate(req.body);
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
        firstname,
        lastname,
        email,
        hashed_password,
        salt,
        role: AccountRole.GUEST
      });

      // Generate JWT token
      const token = this.generateToken(account.id, account.email, account.role);

      res.status(201).json({
        token,
        account: {
          id: account.id,
          firstname: account.firstname.toUpperCase(),
          lastname: account.lastname.toUpperCase(),
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
