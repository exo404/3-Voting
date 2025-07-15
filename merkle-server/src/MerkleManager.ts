import { MerkleTree } from 'merkletreejs'
import { poseidon } from 'poseidon-hash'
import fs from 'fs'
import path from 'path'
import { Votation } from './Votation';

const TREES_PATH = process.env.TREES_PATH || path.join(__dirname, 'trees');

export class MerkleManager {

    private votationTree?: MerkleTree
    private leaves: Buffer[] = []

    private treeFilename?: string

    private associatedVotation: Votation

    constructor(votation: Votation) {
        this.associatedVotation = votation;

        this.setupTree();
    }

    private setupTree() {
        this.treeFilename = this.associatedVotation.name + ".json";

        try {
            if (fs.existsSync(path.join(TREES_PATH, this.treeFilename))) {
                const treeData = this.readTree();
                this.leaves = treeData.leaves!.map((l: string) => Buffer.from(l, 'hex'));
                this.votationTree = new MerkleTree(this.leaves, hashFunction, { sort: true });

                return;
            }
        } catch (error) {
            console.error('Error setting up Merkle tree:', error);
        }

        this.leaves = []
        this.votationTree = new MerkleTree(this.leaves, hashFunction, { sort: true });
        this.saveTree();
    }


    addLeaf(commitment: string) {
        const leaf = Buffer.from(commitment, 'hex')
        this.votationTree!.addLeaf(leaf)
        //TODO check

        this.saveTree()
    }

    getRoot(): string {
        return this.votationTree!.getRoot().toString('hex')
    }

    saveTree() {
        const json = {
            leaves: this.leaves.map((l) => l.toString('hex')),
            root: this.getRoot()
        }

        fs.writeFileSync(path.join(TREES_PATH, this.treeFilename!), JSON.stringify(json, null, 2))
    }

    private readTree() {
        try {
            const filepath = path.join(TREES_PATH, this.treeFilename!)
            const raw = fs.readFileSync(filepath, 'utf-8')

            return JSON.parse(raw)
        } catch (error) {
            console.error('Error reading Merkle tree from file:', error);
            throw error;
        }
    }

}

function hashFunction(data: Buffer) {
    return poseidon([BigInt('0x' + data.toString('hex'))])
}
