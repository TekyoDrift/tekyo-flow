import express from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ status: 200, message: 'Hello World' });
});

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
