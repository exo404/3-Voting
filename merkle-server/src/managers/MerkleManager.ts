import { MerkleTree } from 'merkletreejs'
import { poseidon } from 'poseidon-hash'
import fs from 'fs'
import path from 'path'
import { Votation } from '../models/Votation';

const TREES_PATH = process.env.TREES_PATH || 'data/trees';
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

    getProof(commitment: string): { pathElements: bigint[], pathIndices: number[] } {
        const commitmentHex = BigInt(commitment).toString(16).padStart(64, '0');
        const commitmentBuf = Buffer.from(commitmentHex, 'hex');
        const proof = this.votationTree!.getProof(commitmentBuf);

        const pathElements = proof.map(p => BigInt('0x' + p.data.toString('hex')));
        const pathIndices = proof.map(p => p.position === 'left' ? 1 : 0);

        return { pathElements, pathIndices };
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
}

function poseidonHash(data: Buffer) {
    return poseidon([BigInt('0x' + data.toString('hex'))]);
}
