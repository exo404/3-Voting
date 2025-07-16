import { MerkleTree } from 'merkletreejs'
import { poseidon } from 'poseidon-hash'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util';
import { Votation } from '../models/Votation';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const TREES_PATH = process.env.TREES_PATH || 'data/trees';

const CIRCUIT_WASM_PATH = "../zkproof/vote.wasm"
const WITNESS_CALC_PATH = "../zkproof/witness_calculator.js"

export class MerkleManager {

    private votationTree: MerkleTree
    private treeFilePath: string
    private associatedVotation: Votation

    constructor(votation: Votation) {
        this.associatedVotation = votation;
        this.treeFilePath = path.join(TREES_PATH, this.associatedVotation.name + ".json");

        this.votationTree = this.initTree();
        this.saveTree();
    }

    private initTree(): MerkleTree {
        if (!fs.existsSync(TREES_PATH)) {
            fs.mkdirSync(TREES_PATH, { recursive: true });
        }

        if (fs.existsSync(this.treeFilePath)) {
            return this.loadTree();
        } else {
            console.log("buffers" + this.getBuffers(this.associatedVotation.voters).map((l) => l.toString('hex')));
            return new MerkleTree(
                this.getBuffers(this.associatedVotation.voters),
                poseidonHash,
                { sort: true }
            );
        }
    }

    addLeaf(commitment: string) {
        this.votationTree!.addLeaf(Buffer.from(commitment, 'hex'))

        this.saveTree()
    }

    addLeaves(commitments: string[]) {
        this.votationTree!.addLeaves(this.getBuffers(commitments));

        this.saveTree();
    }

    getRoot(): string {
        return this.votationTree!.getRoot().toString('hex')
    }

    getLeaves(): string[] {
        return this.votationTree!.getLeaves().map((l) => l.toString('hex'))
    }

    getBuffers(leaves: string[]): Buffer[] {
        return leaves.map(leaf => Buffer.from(leaf, 'hex'));
    }

    saveTree() {
        const json = {
            leaves: this.votationTree!.getLeaves().map((l) => l.toString('hex')),
            root: this.getRoot()
        }

        fs.writeFileSync(this.treeFilePath, JSON.stringify(json, null, 2))
    }

    loadTree() {
        try {
            const raw = fs.readFileSync(this.treeFilePath, 'utf-8')

            const treeData = JSON.parse(raw)
            return new MerkleTree(treeData.leaves.map((l: string) => Buffer.from(l, 'hex')), poseidonHash, { sort: true });
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

function poseidonHash(data: Buffer) {
    return poseidon([BigInt('0x' + data.toString('hex'))]);
}
