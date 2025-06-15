import { Request, Response } from 'express';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import fs from 'fs/promises';
import Joi from 'joi';
import { Account } from '../models';
import path from 'path';

/**
 * @brief Schema for validating budget request data.
 */
const BUDGET_REQUEST_SCHEMA = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  quantity: Joi.number().required(),
  price_per_unit: Joi.number().required(),
  image: Joi.string().uri().required(),
  link: Joi.string().uri().required()
});

interface TemplateVariables {
  [key: string]: string | number | boolean;
}

interface PdfOptions {
  inputHtmlPath: string;
  outputPdfPath: string;
  variables?: TemplateVariables;
  pdfOptions?: {
    format?: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Legal' | 'Letter' | 'Tabloid';
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    landscape?: boolean;
    scale?: number;
  };
}

/**
 * @brief Class for converting HTML to PDF using Puppeteer.
 */
class HtmlToPdfConverter {
  private browser: Browser | null = null;
  public isInitialized: boolean = false;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    this.isInitialized = true;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private replaceTemplateVariables(htmlContent: string, variables: TemplateVariables): string {
    let processedHtml = htmlContent;

    for (const [key, value] of Object.entries(variables)) {
      // Replace all occurrences of {{ KEY }} with the value
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, String(value));
    }

    return processedHtml;
  }

  public getTemplatedHtml(inputHtmlPath: string, variables: TemplateVariables): Promise<string> {
    return fs.readFile(inputHtmlPath, 'utf-8').then((htmlContent) => {
      return this.replaceTemplateVariables(htmlContent, variables);
    });
  }

  async convertToPdf(options: PdfOptions): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    try {
      // Read the HTML file
      const htmlContent = await fs.readFile(options.inputHtmlPath, 'utf-8');

      // Replace template variables if provided
      const processedHtml = options.variables
        ? this.replaceTemplateVariables(htmlContent, options.variables)
        : htmlContent;

      // Create a new page
      const page = await this.browser.newPage();

      // Set content and wait for it to load
      await page.setContent(processedHtml, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // Configure PDF options with defaults similar to Opera's Save as PDF
      const pdfConfig: PDFOptions = {
        path: options.outputPdfPath,
        format: options.pdfOptions?.format || 'A4',
        printBackground: options.pdfOptions?.printBackground ?? true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          ...options.pdfOptions?.margin
        },
        landscape: options.pdfOptions?.landscape || false,
        scale: options.pdfOptions?.scale || 1,
        preferCSSPageSize: true
      };

      // Generate PDF
      await page.pdf(pdfConfig);

      await page.close();
      console.log(`PDF generated successfully: ${options.outputPdfPath}`);
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw error;
    }
  }
}

const htmlToPdfConverter = new HtmlToPdfConverter();

/**
 * @brief Controller for handling PDF-related operations.
 */
class PDFController {
  /**
   * @brief Generates a budget request PDF from the provided data.
   * @param req - The request object containing the budget request data.
   * @param res - The response object to send the generated PDF.
   * @throws Will throw an error if the PDF generation fails.
   */
  async generateBudgetPdf(req: Request, res: Response) {
    try {
      // Validate the request query against the schema
      const { error, value } = BUDGET_REQUEST_SCHEMA.validate(req.query);
      if (error) {
        res.status(400).json({
          status: 400,
          message: 'Validation error',
          details: error.details.map((detail) => detail.message)
        });
        return;
      }

      // Get the user from the request (assuming user is set in middleware)
      const account = await Account.findByPk(req.user?.id);

      // Check if the account exists
      if (!account) {
        res.status(404).json({
          status: 404,
          message: 'Account not found'
        });
        return;
      }

      if (!htmlToPdfConverter.isInitialized) {
        await htmlToPdfConverter.initialize();
      }

      // Generate the PDF output path
      const outputPdfPath = `./pdfs/budget-${Date.now()}.pdf`;

      // Ensure the pdfs directory exists
      await fs.mkdir('./pdfs', { recursive: true });

      // Check if the request or response has been destroyed
      if (req.destroyed || res.destroyed) {
        console.log('Client disconnected during setup, aborting PDF generation');
        return;
      }

      //  Convert HTML to PDF
      await htmlToPdfConverter.convertToPdf({
        inputHtmlPath: './templates/budget-template.html',
        outputPdfPath: outputPdfPath,
        variables: {
          ITEM_NAME: value.name,
          ITEM_DESCRIPTION: value.description,
          ITEM_QUANTITY: value.quantity,
          PRICE_PER_UNIT: value.price_per_unit,
          TOTAL_PRICE: (value.quantity * value.price_per_unit).toFixed(2),
          ITEM_LINK: value.link,
          ITEM_IMAGE: value.image,
          CONTACT_NAME: `${account.firstname} ${account.lastname}`,
          CONTACT_EMAIL: account.email,
          CONTACT_ROLE: account.role
        },
        pdfOptions: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '0.5mm',
            right: '0.5mm',
            bottom: '0.5mm',
            left: '0.5mm'
          }
        }
      });

      // Check if the request or response has been destroyed
      if (req.destroyed || res.destroyed) {
        console.log('Client disconnected during setup, aborting PDF generation');
        return;
      }

      // Verify the file was created and get its stats
      const fileStats = await fs.stat(outputPdfPath);

      if (fileStats.size === 0) {
        throw new Error('Generated PDF file is empty');
      }

      // Send the file
      res.status(200).json({
        status: 200,
        filename: path.basename(outputPdfPath),
        message: 'PDF generated successfully'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @brief Fetches the base template for a budget request.
   * @param req - The request object containing the budget request data.
   * @param res - The response object to send the HTML template.
   * @throws Will throw an error if the template fetching fails.
   */
  async getBaseTemplate(req: Request, res: Response) {
    try {
      // Validate the request query against the schema
      const { error, value } = BUDGET_REQUEST_SCHEMA.validate(req.query);
      if (error) {
        res.status(400).json({
          status: 400,
          message: 'Validation error',
          details: error.details.map((detail) => detail.message)
        });
        return;
      }

      // Get the user from the request (assuming user is set in middleware)
      const account = await Account.findByPk(req.user?.id);

      // Check if the account exists
      if (!account) {
        res.status(404).json({
          status: 404,
          message: 'Account not found'
        });
        return;
      }

      const templatePath = './templates/budget-template.html';
      const templateContent = await htmlToPdfConverter.getTemplatedHtml(templatePath, {
        ITEM_NAME: value.name,
        ITEM_DESCRIPTION: value.description,
        ITEM_QUANTITY: value.quantity,
        PRICE_PER_UNIT: value.price_per_unit,
        TOTAL_PRICE: (value.quantity * value.price_per_unit).toFixed(2),
        ITEM_LINK: value.link,
        ITEM_IMAGE: value.image,
        CONTACT_NAME: `${account.firstname} ${account.lastname}`,
        CONTACT_EMAIL: account.email,
        CONTACT_ROLE: account.role
      });

      res.status(200).send(templateContent);
    } catch (error) {
      console.error('Error fetching base template:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  /**
   * @brief Downloads a PDF file by its filename.
   * @param req - The request object containing the filename in the URL parameters.
   * @param res - The response object to send the PDF file.
   * @throws Will throw an error if the file does not exist or if there is an internal server error.
   */
  async downloadPdf(req: Request, res: Response) {
    try {
      const { filename } = req.params;

      // Validate filename to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.status(400).json({
          status: 400,
          message: 'Invalid filename'
        });
        return;
      }

      const filePath = path.join('./pdfs', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        res.status(404).json({
          status: 404,
          message: 'File not found'
        });
        return;
      }

      // Get file stats
      const fileStats = await fs.stat(filePath);

      // Set headers and send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', fileStats.size.toString());

      res.sendFile(path.resolve(filePath), (err) => {
        if (err) {
          console.error('Error sending PDF file:', err);
        }
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }

  async listAllPdfs(req: Request, res: Response) {
    try {
      const pdfsDir = './pdfs';
      const files = await fs.readdir(pdfsDir);

      // Filter for PDF files
      const pdfFiles = files.filter((file) => file.endsWith('.pdf'));

      res.status(200).json({
        status: 200,
        pdfs: pdfFiles
      });
    } catch (error) {
      console.error('Error listing PDFs:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  }
}

export const pdfController = new PDFController();
