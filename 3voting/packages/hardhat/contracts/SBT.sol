// SPDX-License-Identifier: MIT 
pragma solidity >=0.8.0 <0.9.0;

import {ERC5192} from "./ERC5192.sol";
import {ISBT} from "./interfaces/ISBT.sol";

/**
 * @title SBT - Soulbound Token
 * @notice Implementazione di un token soulbound per E-Voting (non trasferibile) basato su ERC5192
 * @dev Estende ERC5192 per creare token legati permanentemente a un indirizzo
 * @author exo404, simonemontella, valeriooconte
 */
contract SBT is ERC5192, ISBT {

    uint256 public nextSBTId = 1;

    /**
     * @notice Mapping che associa ogni indirizzo all'ID del suo SBT
     * @dev Restituisce 0 se l'indirizzo non possiede alcun SBT
     */
    mapping(address => uint256) public hasSBT;

    /**
     * @notice Mapping che associa ogni indirizzo ai dati del suo SBT
     * @dev Contiene le informazioni personali associate al token
     */
    mapping(address => SBTData) public sbts;

    /**
     * @notice Costruttore del contratto SBT
     * @dev Inizializza il contratto padre ERC5192 con i parametri forniti
     */
    constructor() ERC5192("3VT SBT", "3VSBT", true) {}

    /// @inheritdoc ISBT
    function createSBT(SBTData memory _data) external {

        if (hasSBT[msg.sender] != 0) revert AlreadyOwned();
        if (bytes(_data.name).length == 0 || bytes(_data.surname).length == 0) {
            revert InvalidData();
        }
        
        _data.issueDate = block.timestamp;
        
        sbts[msg.sender] = _data;
        hasSBT[msg.sender] = nextSBTId;

        _safeMint(msg.sender, nextSBTId);
        emit SBTCreated(msg.sender, nextSBTId, _data.issueDate);
        nextSBTId++;
    }


    /// @inheritdoc ISBT
    function getSBTData(address owner) external view returns (SBTData memory) {
        return sbts[owner];
    }

    /// @inheritdoc ISBT
    function totalSupply() external view returns (uint256) {
        return nextSBTId - 1;
    }
}