import express from 'express';
import { DatabaseManager } from '../managers/DatabaseManager';
import { Votation } from '../models/Votation';

const app = express();
const router = express.Router();

const db = new DatabaseManager();

app.post("/new", async (req, res) => {
    try {
        const {
            name,
            description,
            isPublic,
            startDate,
            endDate,
            candidates = [],
            voters = [],
            createdBy,
            createdAt = new Date(Date.now())
        } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Votation name is required' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        if (new Date(startDate) < new Date(createdAt || Date.now())) {
            return res.status(400).json({ error: 'Start date must be after creation date' });
        }

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
            candidates || [],
            voters || [],
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

app.get("/:name", async (req, res) => {
    const { name } = req.params;

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        return res.status(200).json(votation);
    } catch (error: any) {
        console.error('Error fetching votation:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get("/:name/candidates", async (req, res) => {
    const { name } = req.params;

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        const candidates = await db.getVotationCandidates(votation.votationId!);
        return res.status(200).json(candidates);
    } catch (error: any) {
        console.error('Error fetching votation candidates:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get("/:name/voters", async (req, res) => {
    const { name } = req.params;

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        const voters = await db.getVotationVoters(votation.votationId!);
        return res.status(200).json(voters);
    } catch (error: any) {
        console.error('Error fetching votation voters:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post("/:name/add-voter", async (req, res) => {
    const { name } = req.params;
    const { commitment } = req.body;

    if (!commitment) {
        return res.status(400).json({ error: 'Commitment is required' });
    }

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        votation.addVoter(commitment);

        return res.status(200).json({ message: 'Voter added successfully', commitment });
    } catch (error: any) {
        console.error('Error adding voter:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post("/:name/add-voters", async (req, res) => {
    const { name } = req.params;
    const { commitments } = req.body;

    if (!Array.isArray(commitments) || commitments.length === 0) {
        return res.status(400).json({ error: 'Commitments array is required and cannot be empty' });
    }

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        votation.addVoters(commitments);

        return res.status(200).json({ message: 'Voters added successfully', commitments });
    } catch (error: any) {
        console.error('Error adding voters:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post("/:name/add-candidate", async (req, res) => {
    const { name } = req.params;
    const { candidate } = req.body;

    if (!candidate || !candidate.name || !candidate.surname) {
        return res.status(400).json({ error: 'Candidate name and surname are required' });
    }

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        await votation.addCandidate(candidate.name, candidate.surname);

        return res.status(200).json({ message: 'Candidate added successfully', candidate });
    } catch (error: any) {
        console.error('Error adding candidate:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.post("/:name/add-candidates", async (req, res) => {
    const { name } = req.params;
    const { candidates } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: 'Candidates array is required and cannot be empty' });
    }

    try {
        const votation = await db.getVotationByName(name);

        if (!votation) {
            return res.status(404).json({ error: `Votation "${name}" not found` });
        }

        for (const candidate of candidates) {
            if (!candidate.name || !candidate.surname) {
                return res.status(400).json({ error: 'Each candidate must have a name and surname' });
            }

            await votation.addCandidate(candidate.name, candidate.surname);
        }

        return res.status(200).json({ message: 'Candidates added successfully', candidates });
    } catch (error: any) {
        console.error('Error adding candidates:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

module.exports = router;