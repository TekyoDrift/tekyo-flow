import { Router } from 'express';
import { accountController } from '../controllers/account';
import { authToken } from '../middlewares/authToken';
import { whitelistRoles, OFFICE_ROLES } from '../middlewares/roleAuthorization';
import { AccountRole } from '../types';

const accountRouter = Router();

accountRouter.get('/', authToken, accountController.getProfile);
accountRouter.put('/', authToken, accountController.updateProfile);
accountRouter.get('/all', authToken, accountController.getAllAccounts);

export default accountRouter;
