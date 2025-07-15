// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title IVotationManager
 * @notice Interfaccia per la gestione di elezioni decentralizzate
 * @dev Definisce le funzionalità core per creare elezioni, gestire i voti e verificare i risultati
  * @author exo404, simonemontella, valeriooconte
 */
interface IVotationManager {

    ///////////////////// DATA STRUCTURES /////////////////////
    
    /**
     * @notice Struttura che rappresenta un'elezione
     * @dev Contiene tutti i dati necessari per identificare e gestire un'elezione
     * @param id ID univoco dell'elezione
     * @param name Nome descrittivo dell'elezione
     * @param startTime Timestamp di inizio dell'elezione
     * @param endTime Timestamp di fine dell'elezione
     * @param isActive Stato dell'elezione
     */
    struct Votation {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256[] candidates; 
    }

    ///////////////////// EVENTS /////////////////////

    /**
     * @notice Emesso quando viene creata una nuova elezione
     * @param votationId ID univoco della nuova elezione
     * @param name Nome dell'elezione
     * @param startTime Timestamp di inizio dell'elezione
     * @param endTime Timestamp di fine dell'elezione
     */
    event VotationCreated(uint256 indexed votationId, string name, uint256 startTime, uint256 endTime);

    /**
     * @notice Emesso quando un'elezione viene avviata
     * @param votationId ID dell'elezione avviata
     * @param name Nome dell'elezione avviata
     * @param endTime Timestamp di fine dell'elezione
     */
    event VotationStarted(uint256 indexed votationId, string name, uint256 endTime);

    /**
     * @notice Emesso quando un'elezione viene chiusa
     * @param votationId ID dell'elezione chiusa
     * @param name Nome dell'elezione chiusa
     */
    event VotationClosed(uint256 indexed votationId, string name);

    /**
     * @notice Emesso quando un voto viene registrato
     * @param votationId ID dell'elezione per cui è stato espresso il voto
     * @param voter Indirizzo del votante
     */
    event VoteCast(uint256 indexed votationId, address indexed voter);
    
    /**
     * @notice Emesso quando un voto viene verificato con successo
     * @param votationId ID dell'elezione per cui è stato verificato il voto
     * @param voter Indirizzo del votante verificato
     */
    event VoteVerified(uint256 indexed votationId, address indexed voter);

    
    ///////////////////// ERRORS /////////////////////

    /**
     * @notice Errore lanciato quando si tenta di creare un'elezione con ID già esistente
     * @param votationId ID dell'elezione che già esiste
     */
    error VotationAlreadyExists(uint256 votationId);
    
    /**
     * @notice Errore lanciato quando si tenta di accedere a un'elezione inesistente
     * @param votationId Id ID dell'elezione non trovata
     */
    error VotationNotFound(uint256 votationId);

    /**
     * @notice Errore lanciato quando si tenta di avviare un'elezione già attiva
     * @param votationId ID dell'elezione già attiva
     */
    error VotationAlreadyActive(uint256 votationId);

    /**
     * @notice Errore lanciato quando si tenta di operare su un'elezione non attiva
     * @param votationId ID dell'elezione non attiva
     */
    error VotationNotActive(uint256 votationId);

    /**
     * @notice Errore lanciato quando si tenta di creare un'elezione con un intervallo di tempo non valido
     */
    error InvalidTimeInterval();

    /**
     * @notice Errore lanciato quando si tenta di creare un'elezione con un nome vuoto
     */
    error InvalidName();

    /**
     * @notice Errore lanciato quando si tenta di votare fuori dalla finestra temporale consentita
     * @param votationId ID dell'elezione per cui la finestra di voto è chiusa
     */
    error VotingWindowClosed(uint256 votationId);
    
    /**
     * @notice Errore lanciato quando si specifica un candidato non valido
     * @param candidateId ID del candidato non valido
     */
    error InvalidCandidate(uint256 candidateId);
    
    /**
     * @notice Errore lanciato quando si esprime un voto non valido
     */
    error InvalidVote();


    ///////////////////// FUNCTIONS /////////////////////

    /**
     * @notice Crea una nuova elezione
     * @dev La funzione deve verificare che i parametri siano validi e che l'elezione non esista già
     * @param name Nome descrittivo dell'elezione
     * @param startTime Timestamp di inizio dell'elezione (deve essere futuro)
     * @param endTime Timestamp di fine dell'elezione (deve essere dopo startTime)
     * @return ID univoco dell'elezione creata
     */
    function createVotation(string memory name, uint256 startTime, uint256 endTime) external returns (uint256);

    /**
     * @notice Chiude un'elezione esistente
     * @dev Deve verificare che l'elezione sia attiva e che l'ID sia valido
     * @param votationId ID dell'elezione da chiudere
     */
    function startVotation(uint256 votationId) external;

    /**
     * @notice Esprime un voto per un candidato in una specifica elezione
     * @dev Deve verificare che l'elezione sia attiva, che sia nella finestra temporale corretta,
     *      che il candidato sia valido e che il votante non abbia già votato
     * @param votationId ID dell'elezione per cui votare
     * @param candidateId ID del candidato per cui votare
     */
    function vote(uint256 votationId, uint256 candidateId) external;

    /**
     * @notice Verifica se un voto è stato correttamente registrato
     * @dev Funzione di sola lettura per verificare l'integrità del voto
     * @param votationId ID dell'elezione da verificare
     * @param candidateId ID del candidato per cui è stato espresso il voto
     * @return true se il voto è valido e correttamente registrato, false altrimenti
     */
    function verifyVote(uint256 votationId, uint256 candidateId) external view returns (bool);

    /**
     * @notice Restituisce i risultati di un'elezione
     * @dev Può essere chiamata solo per elezioni esistenti
     * @param votationId ID dell'elezione di cui ottenere i risultati
     * @return candidateIds Array degli ID dei candidati
     * @return votes Array del numero di voti ricevuti da ciascun candidato (stesso ordine di candidateIds)
     */
    function votationResults(uint256 votationId) external view returns (uint256[] memory candidateIds, uint256[] memory votes);

    /**
     * @notice Verifica se una elezione è attualmente nella finestra temporale di voto
     * @dev Controlla che l'orario corrente sia tra startTime e endTime e che l'elezione sia attiva
     * @param votationId ID dell'elezione da verificare
     * @return true se è possibile votare, false altrimenti
     */
    function checkVotingWindow(uint256 votationId) external view returns (bool);

    /**
     * @notice Restituisce i dettagli di un'elezione specifica
     * @dev Funzione di sola lettura per ottenere informazioni complete su un'elezione
     * @param votationId ID dell'elezione di cui ottenere i dettagli
     * @return Votation struct contenente tutti i dati dell'elezione
     */
    function getVotation(uint256 votationId) external view returns (Votation memory);
}