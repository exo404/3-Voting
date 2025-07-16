import { MerkleTree } from 'merkletreejs'
import { poseidon } from 'poseidon-hash'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util';
import { Votation } from '../models/Votation';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const TREES_PATH = process.env.TREES_PATH || path.join(__dirname, 'trees');

const CIRCUIT_WASM_PATH = "../zkproof/vote.wasm"
const WITNESS_CALC_PATH = "../zkproof/witness_calculator.js"

export class MerkleManager {

    private votationTree?: MerkleTree

    private treeFilename: string

    private associatedVotation: Votation

    constructor(votation: Votation) {
        this.associatedVotation = votation;

        this.treeFilename = this.associatedVotation.name + ".json";
        this.setupTree();
    }

    private setupTree() {
        try {
            if (fs.existsSync(path.join(TREES_PATH, this.treeFilename))) {
                this.votationTree = this.readTree();

                return;
            }
        } catch (error) {
            console.error('Error setting up Merkle tree:', error);

            //NEW TREE
            this.votationTree = new MerkleTree(this.getLeavesFromVotation(), hashFunction, { sort: true });
            this.saveTree();
        }
    }

    addLeaf(commitment: string) {
        const leaf = Buffer.from(commitment, 'hex')
        this.votationTree!.addLeaf(leaf)

        this.saveTree()
    }

    addLeaves(commitments: string[]) {
        const leaves = commitments.map(c => Buffer.from(c, 'hex'));
        this.votationTree!.addLeaves(leaves);

        this.saveTree();
    }

    getRoot(): string {
        return this.votationTree!.getRoot().toString('hex')
    }

    getLeaves(): string[] {
        return this.votationTree!.getLeaves().map((l) => l.toString('hex'))
    }

    getLeavesFromVotation(): Buffer[] {
        return this.associatedVotation.voters.map(voter => Buffer.from(voter, 'hex'));
    }

    private saveTree() {
        const json = {
            leaves: this.votationTree!.getLeaves().map((l) => l.toString('hex')),
            root: this.getRoot()
        }

        fs.writeFileSync(path.join(TREES_PATH, this.treeFilename!), JSON.stringify(json, null, 2))
    }

    private readTree() {
        try {
            const filepath = path.join(TREES_PATH, this.treeFilename!)
            const raw = fs.readFileSync(filepath, 'utf-8')

            const treeData = JSON.parse(raw)
            return new MerkleTree(treeData.leaves.map((l: string) => Buffer.from(l, 'hex')), hashFunction, { sort: true });
        } catch (error) {
            console.error('Error reading Merkle tree from file:', error);
            throw error;
        }
    }

    // secret: un random nonce unico per ogni utente o una chiave privata lato client
    // nullifier: altro valore random genereato a partire dal secret sempre lato client
    // NB: l'utente non deve fornire questi valori, al limite un seed per generarli
    async generateCircuitInputAndWitness(secret: bigint, nullifier: bigint, vote: number) {
        const commitment = poseidon([secret, nullifier]);
        const commitmentHex = BigInt(commitment).toString(16).padStart(64, '0');
        const commitmentBuf = Buffer.from(commitmentHex, 'hex');

        const proof = this.votationTree!.getProof(commitmentBuf);

        if (!proof || proof.length === 0) {
        throw new Error('Commitment non trovato nell’albero Merkle.');
        }

        const pathElements = proof.map(p => BigInt('0x' + p.data.toString('hex')));
        // NB: la logica dipende dal circuito
        // se dovessero esserci incongruenze sostituire left con right
        const pathIndices = proof.map(p => p.position === 'left' ? 1 : 0);

        const merkleRoot = BigInt('0x' + this.getRoot());
        const nullifierHash = poseidon([nullifier]);
        const voteHash = poseidon([BigInt(vote)]);

        const input = {
            secret: secret.toString(),
            nullifier: nullifier.toString(),
            vote: vote.toString(),
            pathElements: pathElements.map(e => e.toString()),
            pathIndices: pathIndices.map(i => i.toString()),
            merkleRoot: merkleRoot.toString(),
            nullifierHash: BigInt(nullifierHash).toString(),
            voteHash: BigInt(voteHash).toString()
        };

        const inputJsonPath = path.join('/tmp', 'input.json');
        const witnessOutputPath = path.join('/tmp', 'witness.wtns');

        fs.writeFileSync(inputJsonPath, JSON.stringify(input, null, 2));

        // Calcolo del witness usando witness_calculator
        await execAsync(`node ${WITNESS_CALC_PATH} ${CIRCUIT_WASM_PATH} ${inputJsonPath} ${witnessOutputPath}`);

        return {input, witnessPath: witnessOutputPath};
    }

}

function hashFunction(data: Buffer) {
    return poseidon([BigInt('0x' + data.toString('hex'))])
}
