// SPDX-License-Identifier: MIT 
pragma solidity >=0.8.0 <0.9.0;

import {ERC5192} from "../ERC5192.sol";

/**
 * @title ISBT 
 * @notice Interfaccia di un token soulbound per E-Voting (non trasferibile) basato su ERC5192
 * @author exo404, simonemontella, valeriooconte
 */
interface ISBT {

    ///////////////////// DATA STRUCTURES /////////////////////

    /**
     * @notice Struttura dati per memorizzare le informazioni di un SBT
     * @param issueDate Data di emissione del token (timestamp)
     * @param name Nome del possessore del token
     * @param surname Cognome del possessore del token
     * @param birthDate Data di nascita del possessore (timestamp)
     * @param birthPlace Luogo di nascita del possessore
     */
    struct SBTData {
        uint256 issueDate;
        string name;
        string surname;
        uint256 birthDate;
        string birthPlace;
    }

    ///////////////////// EVENTS /////////////////////

    /**
     * @notice Evento emesso quando viene creato un nuovo SBT
     * @param owner Indirizzo del proprietario del nuovo SBT
     * @param tokenId ID del token creato
     * @param issueDate Data di emissione del token
     */
    event SBTCreated(address indexed owner, uint256 indexed tokenId, uint256 issueDate);

    ///////////////////// ERRORS /////////////////////

    /**
     * @notice Errore emesso quando un indirizzo tenta di creare un SBT ma ne possiede già uno
     */
    error AlreadyOwned();

    /**
     * @notice Errore emesso quando si tenta di creare un SBT con dati vuoti
     */
    error InvalidData();

    ///////////////////// FUNCTIONS /////////////////////

    /**
     * @notice Crea un nuovo SBT con i dati forniti per il mittente della transazione
     * @param _data Struttura SBTData contenente le informazioni del token (issueDate verrà sovrascritto)
     * @dev Reverte con AlreadyOwned se il mittente possiede già un SBT
     * @dev Reverte con InvalidData se i dati essenziali sono vuoti
     * @dev Crea un token nel contratto corrente, memorizza i dati e incrementa il contatore
     * @dev Aggiunge automaticamente la data di emissione al momento della creazione
     */
    function createSBT(SBTData memory _data) external;

    /**
     * @notice Restituisce i dati completi di un SBT dato l'indirizzo del proprietario
     * @param owner Indirizzo del proprietario del SBT
     * @return SBTData Struttura contenente tutti i dati del SBT
     * @dev Restituisce una struttura vuota se l'indirizzo non possiede alcun SBT
     */
    function getSBTData(address owner) external view returns (SBTData memory);

    /**
     * @notice Restituisce il numero totale di SBT emessi
     * @return uint256 Numero totale di SBT creati
     */
    function totalSupply() external view returns (uint256);
}