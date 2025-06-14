import { Account } from '../models';
import { Request, Response } from 'express';

class AccountController {
  public async getProfile(req: Request, res: Response) {
    try {
      // Get account email from request
      const email = req.user?.email;

      // Find account by ID
      const account = await Account.findOne({
        where: { email: email },
        attributes: ['firstname', 'lastname', 'email', 'role', 'created_at', 'updated_at']
      });

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
}

export const accountController = new AccountController();
