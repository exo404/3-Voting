import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { Votation } from './Votation';
import { DatabaseManager } from './DatabaseManager';
import dotenv from 'dotenv';

// === SETUP ===

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

const db = new DatabaseManager();

const treesDir = process.env.TREES_PATH || path.join(__dirname, 'trees');
if (!fs.existsSync(treesDir)) {
  fs.mkdirSync(treesDir, { recursive: true });
}

app.use(bodyParser.json())

// === API ===

app.post("/votations/new", async (req, res) => {
  try {
    const {
      name,
      description,
      isPublic,
      startDate,
      endDate,
      createdBy,
      createdAt
    } = req.body;

    //TODO add candidates
    //TODO set requisito startDate > creationDate

    if (!name) {
      return res.status(400).json({ error: 'Votation name is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    //TODO change to checkExists method
    const existingVotation = await db.getVotationByName(name);

    if (existingVotation) {
      return res.status(400).json({ error: `A votation "${name}" already exists` });
    }

    const votation = new Votation(
      name,
      description,
      isPublic,
      startDate,
      endDate,
      createdBy,
      createdAt || new Date(Date.now())
    );

    const votationId = await votation.save();

    return res.status(201).json({
      message: `Votation "${votation.name}" created successfully with id "${votationId}"`,
      votation: votation,
    });
  } catch (error: any) {
    console.error('Error creating votation:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get("/votations/:name", async (req, res) => {
  //TODO get infos
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
