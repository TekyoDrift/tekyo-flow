import { Router } from 'express';
import { accountController } from '../controllers/account';
import { authToken } from '../middlewares/authToken';

const accountRouter = Router();

accountRouter.get('/', authToken, accountController.getProfile);

export default accountRouter;
