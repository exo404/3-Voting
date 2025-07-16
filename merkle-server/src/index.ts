import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import votationsRouter from './routes/votations';
import morgan from 'morgan';
import { DatabaseManager } from './managers/DatabaseManager';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

const initDb = new DatabaseManager();
initDb.initTables();
initDb.close();

const dataDir = process.env.DATA_PATH || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const treesDir = process.env.TREES_PATH || path.join(__dirname, 'data/trees');
if (!fs.existsSync(treesDir!)) {
  fs.mkdirSync(treesDir!, { recursive: true });
}

app.use(bodyParser.json());
app.use(morgan('dev'));

app.use("/votations", votationsRouter);

// TODO vote api call
// TODO add api call log

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});