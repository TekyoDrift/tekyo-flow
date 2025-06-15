import { Router } from 'express';
import authRouter from './auth';
import accountRouter from './account';
import pdfRouter from './pdf';

const router = Router();

router.use('/auth', authRouter);
router.use('/account', accountRouter);
router.use('/pdf', pdfRouter);

export default router;
