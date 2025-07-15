import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { Votation } from './Votation';

export class DatabaseManager {

    private db: sqlite3.Database;

    constructor(dbPath: string = 'votations.db') {
        //TODO check for DATA folder
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                throw err;
            } else {
                console.log('Connected to the SQLite database');
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
                isOpen BOOLEAN DEFAULT 0,
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

            this.db.run(`CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                votationId INTEGER NOT NULL,
                name TEXT NOT NULL,
                surname TEXT NOT NULL
            )`);
        });
    }

    async saveVotation(votation: Votation): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO votations (name, description, isPublic, startDate, endDate, merkleRoot, createdAt, createdBy) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            this.db.run(sql, [
                votation.name,
                votation.description,
                votation.isPublic ? 1 : 0,
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