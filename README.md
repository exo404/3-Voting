# 3-Voting, NapulETH Hackathon 2025

<img text-align="center" width="300" height="300" alt="logo" src="https://github.com/user-attachments/assets/13cf68e3-b5d8-4813-8254-e7bbaf05d3e0" />

# Diagrammi di sequenza iniziali

```mermaid
sequenceDiagram
  participant Voter
  participant Frontend
  participant MerkleServer
  participant ZKContract
  participant SoulboundRegistry

  Voter->>Frontend: Connette wallet
  Frontend->>SoulboundRegistry: Verifica possesso SBT
  SoulboundRegistry-->>Frontend: true/false

  Frontend->>MerkleServer: Richiede lista voters + root Merkle
  MerkleServer-->>Frontend: Lista + Merkle Root

  Frontend->>MerkleServer: Richiede circuiti ZK (zkey, wasm)
  MerkleServer-->>Frontend: Invia zkey + wasm

  Frontend->>Frontend: Genera identityCommitment, MerkleProof, nullifierHash
  Frontend->>Frontend: Genera zk-SNARK proof

  Frontend->>ZKContract: castVote(vote, nullifierHash, root, zkProof)

  ZKContract->>ZKContract: Verifica validità del voto
  ZKContract-->>Frontend: Success/Fail
```

### Flusso del voto

```mermaid
sequenceDiagram
  participant Voter
  participant Browser
  participant MerkleServer
  participant ZKeyServer
  participant VotingContract

  Voter->>Browser: Connetti wallet e seleziona voto
  Browser->>MerkleServer: Ottieni Merkle Tree + root
  MerkleServer-->>Browser: Leaf list + root

  Browser->>ZKeyServer: Richiedi zkey + wasm
  ZKeyServer-->>Browser: Invia zkey + wasm

  Browser->>Browser: Calcola Merkle proof + nullifier hash
  Browser->>Browser: Genera zk-proof

  Browser->>VotingContract: castVote(vote, nullifierHash, root, zkProof)
  VotingContract->>VotingContract: Verifica zk-proof
  VotingContract->>VotingContract: Controlla doppio voto (nullifierHash)
  VotingContract->>VotingContract: Aggiorna conteggio se valido

```

### Creazione voto e pubblicazione root

```mermaid
sequenceDiagram
  participant Admin
  participant MerkleServer
  participant VotingCoordinator

  Admin->>MerkleServer: Crea Merkle Tree da SBT attivi
  MerkleServer->>MerkleServer: Calcola Merkle Root

  MerkleServer->>Admin: Restituisce Merkle Root

  Admin->>VotingCoordinator: publishMerkleRoot(voteId, root)
  VotingCoordinator->>VotingCoordinator: Salva root come valida per il voto

```

### Verifica on-chain del voto

```mermaid
sequenceDiagram
  participant User
  participant Contract

  User->>Contract: castVote(vote, nullifierHash, root, zkProof)

  Contract->>Contract: Verifica zk-proof
  Contract->>Contract: Verifica che root sia autorizzato
  Contract->>Contract: Controlla che nullifierHash non sia già usato

  alt Proof valida e nullifier nuovo
    Contract->>Contract: Salva nullifier
    Contract->>Contract: Registra voto
    Contract-->>User: Voto accettato
  else Errore
    Contract-->>User: Voto respinto
  end

```

### Mint del SBT

```mermaid
sequenceDiagram
  participant Admin
  participant SoulboundRegistry
  participant Voter

  Admin->>SoulboundRegistry: mintSBT(voterAddress)
  SoulboundRegistry->>Voter: Assegna SBT (non trasferibile)
  Voter-->>SoulboundRegistry: Verifica possesso via wallet

```

### Generazione ed invio della zkp

```mermaid
sequenceDiagram
  participant Voter
  participant Browser
  participant ZKeyServer

  Voter->>Browser: Avvia procedura di voto
  Browser->>ZKeyServer: Richiede file .zkey e .wasm
  ZKeyServer-->>Browser: Invia i circuiti

  Browser->>Browser: Costruisce Merkle proof e nullifier
  Browser->>Browser: Crea zk-proof con snarkjs
  Browser-->>Voter: Proof pronta per l’invio on-chain

```
