import { MerkleManager } from "../managers/MerkleManager";
import { DatabaseManager } from "../managers/DatabaseManager";

// TODO check/mantain coerence between database and object (instance)

export class Votation {

    public votationId?: number;
    public name: string;
    public description: string;
    public startDate: Date;
    public endDate: Date;
    public createdBy: string;
    public createdAt: Date;

    public isPublic: boolean;
    public isActive: boolean;

    public candidates: { name: string; surname: string }[];
    public voters: string[] = [];

    private treeManager: MerkleManager;

    constructor(
        name: string,
        description: string = '',
        isPublic: boolean = true,
        startDate: Date,
        endDate: Date,
        candidates: { name: string; surname: string }[] = [],
        voters: string[] = [],
        createdBy: string = '',
        createdAt: Date = new Date()
    ) {
        this.name = name;
        this.description = description;
        this.isPublic = isPublic;
        this.isActive = false;
        this.startDate = startDate || new Date();
        this.endDate = endDate || new Date();
        this.createdBy = createdBy;
        this.createdAt = createdAt;

        this.candidates = candidates;
        this.voters = voters;

        this.treeManager = new MerkleManager(this);
    }

    async save(): Promise<number> {
        const db = new DatabaseManager();

        try {
            const votationId = await db.saveVotation(this);
            this.votationId = votationId;

            if (this.voters.length > 0) {
                db.addVoters(votationId, this.voters);
            }

            if (this.candidates.length > 0) {
                db.addCandidates(votationId, this.candidates);
            }

            return votationId;
        } catch (error) {
            console.error('Failed to save votation:', error);
            throw error;
        } finally {
            db.close();
        }
    }

    async addVoter(commitment: string): Promise<void> {
        this.treeManager.addLeaf(commitment);
        this.voters.push(commitment);

        const db = new DatabaseManager();

        db.addVoter(this.votationId!, commitment);
        db.updateMerkleRoot(this.votationId!, this.getMerkleRoot());

        db.close();
    }

    async addVoters(commitments: string[]): Promise<void> {
        this.treeManager.addLeaves(commitments);
        this.voters.push(...commitments);

        const db = new DatabaseManager();
        db.addVoters(this.votationId!, commitments);
        db.updateMerkleRoot(this.votationId!, this.getMerkleRoot());

        db.close();
    }

    async addCandidate(name: string, surname: string): Promise<void> {
        this.candidates.push({ name, surname });

        const db = new DatabaseManager();
        db.addCandidate(this.votationId!, name, surname);

        db.close();
    }

    getId(): number | undefined {
        return this.votationId;
    }

    getMerkleRoot(): string {
        return this.treeManager.getRoot();
    }

    getMerkleProof(commitment: string): { pathElements: bigint[], pathIndices: number[] } {
        return this.treeManager.getProof(commitment);
    }
}
