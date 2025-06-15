import { config } from 'dotenv';
import { sequelize } from './config';
import { startServer } from './server';
import './models';

config();

async function main() {
  try {
    await sequelize.sync();
  } catch (error) {
    console.error('Error syncing the database:', error);
    throw error;
  }

  try {
    await startServer();
  } catch (error) {
    console.error('Error starting the server:', error);
    throw error;
  }
}

main().catch(() => process.exit(1));

// (async () => {
//   console.log('Starting HTML to PDF conversion...');

//   const converter = new HtmlToPdfConverter();

//   try {
//     console.log('Initializing converter...');
//     await converter.initialize();

//     console.log('Converter initialized successfully.');
//     await converter.convertToPdf({
//       inputHtmlPath: './templates/budget-template.html',
//       outputPdfPath: './output.pdf',
//       variables: {
//         ITEM_NAME: 'Saladier rond kraft avec couvercle',
//         ITEM_DESCRIPTION: '30 Pcs - Saladier rond kraft avec couvercle - Ø150 mm, Hauteur: 60 mm',
//         ITEM_QUANTITY: 30,
//         PRICE_PER_UNIT: 0.16,
//         TOTAL_PRICE: 4.94,
//         ITEM_LINK: 'https://www.ecolomique.com/saladiers/3312-product.html?gad_campaignid=22603604319',
//         ITEM_IMAGE: 'https://images-ext-1.discordapp.net/external/_l_0X3tUEBRW6DQfW1rl-m1gsaqe5rX1REwYttjaK1w/https/www.ecolomique.com/39503-large_default/product.jpg?format=webp',
//         CONTACT_NAME: 'MALLORY SCOTTON',
//         CONTACT_EMAIL: 'mallory-scotton@epitech.eu',
//         CONTACT_ROLE: 'Vice-Président',
//       },
//       pdfOptions: {
//         format: 'A4',
//         printBackground: true,
//         margin: {
//           top: '0.5mm',
//           right: '0.5mm',
//           bottom: '0.5mm',
//           left: '0.5mm'
//         }
//       }
//     });

//     console.log('HTML to PDF conversion completed successfully.');
//   } catch (error) {
//     console.error('Conversion failed:', error);
//     process.exit(1);
//   } finally {
//     await converter.close();
//   }
// })();
