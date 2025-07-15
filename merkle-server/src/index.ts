import express from 'express';
import fs from 'fs';
import path from 'path';
import { MerkleTree } from 'merkletreejs';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

// === Utility per hash ===
const hash = (data: string) =>
  crypto.createHash('sha256').update(data).digest();

// === Caricamento votanti ===
const votersPath = path.join(__dirname, 'data', 'voters.json');
const voters: string[] = JSON.parse(fs.readFileSync(votersPath, 'utf-8'));

// === Costruzione Merkle Tree ===
const leaves = voters.map(v => hash(v));
const merkleTree = new MerkleTree(leaves, crypto.createHash('sha256'), { sortPairs: true });
const merkleRoot = merkleTree.getRoot().toString('hex');

// === API ===

// Lista votanti
app.get('/voters', (_req, res) => {
  res.json(voters);
});

// Merkle Root
app.get('/merkle-root', (_req, res) => {
  res.json({ merkleRoot });
});

// Proof per un votante
app.get('/proof/:address', (req, res) => {
  const address = req.params.address;
  const index = voters.indexOf(address);

  if (index === -1) {
    return res.status(404).json({ error: 'Voter not found' });
  }

  const leaf = hash(address);
  const proof = merkleTree.getProof(leaf);

  res.json({ proof });
});

// Circuiti zk
app.get('/circuit/wasm', (_req, res) => {
  const wasmPath = path.join(__dirname, 'circuits', 'vote.wasm');
  res.sendFile(wasmPath);
});

app.get('/circuit/zkey', (_req, res) => {
  const zkeyPath = path.join(__dirname, 'circuits', 'vote.zkey');
  res.sendFile(zkeyPath);
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
