import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

const treesDir = process.env.TREES_PATH || path.join(__dirname, 'trees');
if (!fs.existsSync(treesDir)) {
  fs.mkdirSync(treesDir, { recursive: true });
}

app.use(bodyParser.json());
app.use("/votations", require("./routes/votations"));

app.listen(PORT);