import express from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import routes from './routes';

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

app.use((_, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Next.js static files
app.use('/_next', express.static(path.join(__dirname, '../client/.next')));
app.use(express.static(path.join(__dirname, '../client/public')));
app.use(express.static(path.join(__dirname, '../client/.next/server/app')));

// API routes
app.use('/api', routes);

export async function startServer(): Promise<void> {
  return new Promise((resolve, rejects) => {
    try {
      server.listen(PORT, () => {
        console.log('Server is listenning on port:', PORT);
        resolve();
      });
    } catch (error) {
      rejects(error);
    }
  });
}
