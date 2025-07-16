import sqlite3 from 'sqlite3';
import { Votation } from '../models/Votation';
const fs = require('fs');
const path = require('path');

export class DatabaseManager {

    private db: sqlite3.Database;

    constructor(dbPath: string = process.env.DATABASE_PATH || 'data/votations.db') {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                throw err;
            } else {
                console.log('Connected to the SQLite database'); // TODO remove
                this.initTables();
            }
        });
    }

    private initTables(): void {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS votations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                isPublic BOOLEAN DEFAULT 1,
                isActive BOOLEAN DEFAULT 0,
                startDate TEXT,
                endDate TEXT,
                merkleRoot TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                createdBy TEXT
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS voters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                votationId INTEGER NOT NULL,
                commitment TEXT NOT NULL,
                FOREIGN KEY (votationId) REFERENCES votations (id) ON DELETE CASCADE
            )`);

            // TODO define needed fields for voters and candidates

            this.db.run(`CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                votationId INTEGER NOT NULL,
                name TEXT NOT NULL,
                surname TEXT NOT NULL,
                FOREIGN KEY (votationId) REFERENCES votations (id) ON DELETE CASCADE
            )`);
        });
    }

    async saveVotation(votation: Votation): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO votations (name, description, isPublic, isActive, startDate, endDate, merkleRoot, createdAt, createdBy) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            let resultId = -1;
            this.db.run(sql, [
                votation.name,
                votation.description,
                votation.isPublic ? 1 : 0,
                votation.isActive ? 1 : 0,
                votation.startDate.toISOString(),
                votation.endDate.toISOString(),
                votation.getMerkleRoot(),
                votation.createdAt.toISOString(),
                votation.createdBy
            ], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                    resultId = this.lastID;
                }
            });

            if (resultId !== -1) {
                if (votation.candidates.length > 0) {
                    this.addCandidates(resultId, votation.candidates);
                }

                if (votation.voters.length > 0) {
                    this.addVoters(resultId, votation.voters);
                }
            }

        });
    }

    async addVoter(votationId: number, commitment: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO voters (votationId, commitment) VALUES (?, ?)`;
            this.db.run(sql, [votationId, commitment], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async addVoters(votationId: number, commitments: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO voters (votationId, commitment) VALUES (?, ?)`;
            const stmt = this.db.prepare(sql);
            commitments.forEach(commitment => {
                stmt.run(votationId, commitment);
            });
            stmt.finalize(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async addCandidates(votationId: number, candidates: { name: string, surname: string }[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO candidates (votationId, name, surname) VALUES (?, ?, ?)`;
            const stmt = this.db.prepare(sql);
            candidates.forEach(candidate => {
                stmt.run(votationId, candidate.name, candidate.surname);
            });
            stmt.finalize(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async addCandidate(votationId: number, name: string, surname: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO candidates (votationId, name, surname) VALUES (?, ?, ?)`;
            this.db.run(sql, [votationId, name, surname], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async getVotationByName(name: string): Promise<Votation | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM votations WHERE name = ?`, [name], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row as Votation : null);
                }
            });
        });
    }

    async getVotationCandidates(votationId: number): Promise<{ name: string, surname: string }[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT name, surname FROM candidates WHERE votationId = ?`, [votationId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map((row: any) => ({ name: row.name, surname: row.surname })));
                }
            });
        });
    }

    async getVotationVoters(votationId: number): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT commitment FROM voters WHERE votationId = ?`, [votationId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map((row: any) => row.commitment));
                }
            });
        });
    }

    async updateMerkleRoot(votationId: number, merkleRoot: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE votations SET merkle_root = ? WHERE id = ?`,
                [merkleRoot, votationId],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    }

    close(): void {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}