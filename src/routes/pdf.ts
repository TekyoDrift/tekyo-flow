import { Router } from 'express';
import { pdfController } from '../controllers/pdf';
import { authToken } from '../middlewares';

const pdfRouter = Router();

pdfRouter.get('/budget-request', authToken, pdfController.generateBudgetPdf);
pdfRouter.get('/download/:filename', pdfController.downloadPdf);

export default pdfRouter;
