import { MerkleTree } from 'merkletreejs'
import { poseidon } from 'poseidon-hash'
import fs from 'fs'
import path from 'path'
import { Votation } from '../models/Votation';

const TREES_PATH = process.env.TREES_PATH || path.join(__dirname, 'data/trees');

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

}

function hashFunction(data: Buffer) {
    return poseidon([BigInt('0x' + data.toString('hex'))])
}
