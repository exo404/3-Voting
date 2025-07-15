import { MerkleManager } from "./MerkleManager";
import { DatabaseManager } from "./DatabaseManager";

export class Votation {

    public votationId?: number;
    public name: string;
    public description: string;
    public startDate: Date;
    public endDate: Date;
    public createdBy: string;
    public createdAt: Date;

    public isPublic: boolean;
    public isOpen: boolean;

    private treeManager: MerkleManager;

    constructor(
        name: string,
        description: string = '',
        isPublic: boolean = true,
        startDate: Date,
        endDate: Date,
        createdBy: string = '',
        createdAt: Date = new Date()
    ) {
        this.name = name;
        this.description = description;
        this.isPublic = isPublic;
        this.isOpen = false;
        this.startDate = startDate || new Date();
        this.endDate = endDate || new Date();
        this.createdBy = createdBy;
        this.createdAt = createdAt;

        this.treeManager = new MerkleManager(this);
    }

    async save(): Promise<number> {
        const db = new DatabaseManager();

        try {
            const votationId = await db.saveVotation(this);

            //TODO save merkle tree

            this.votationId = votationId;
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

        const db = new DatabaseManager();
        if (this.votationId) {
            await db.updateMerkleRoot(this.votationId, this.treeManager.getRoot());

            //TODO await this.db.addVoter(this.votationId, commitment);
        } else {
            throw new Error('Votation must be saved before adding voters');
        }

        db.close();
    }

    //TODO add candidates
    getId(): number | undefined {
        return this.votationId;
    }

    getMerkleRoot(): string {
        return this.treeManager.getRoot();
    }
}
