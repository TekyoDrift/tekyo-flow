import { config } from 'dotenv';
import { sequelize } from './config';
import { startServer } from './server';

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

main()
  .catch(() => process.exit(1));
