import { Router } from 'express';
import { pdfController } from '../controllers/pdf';
import { whitelistRoles, OFFICE_ROLES } from '../middlewares/roleAuthorization';

const pdfRouter = Router();

pdfRouter.get('/budget-request', whitelistRoles(...OFFICE_ROLES), pdfController.generateBudgetPdf);
pdfRouter.get('/download/:filename', whitelistRoles(...OFFICE_ROLES), pdfController.downloadPdf);
pdfRouter.get('/html-budget-request', whitelistRoles(...OFFICE_ROLES), pdfController.getBaseTemplate);
pdfRouter.get('/list', whitelistRoles(...OFFICE_ROLES), pdfController.listAllPdfs);

export default pdfRouter;
