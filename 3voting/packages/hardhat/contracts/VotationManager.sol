// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IVotationManager} from "./interfaces/IVotationManager.sol";

/**
 * @title VotationManager
 * @notice Implementazione dell'interfaccia IVotationManager per la gestione delle elezioni
 * @dev Fornisce funzionalità per creare, chiudere elezioni e gestire i voti
 * @author exo404, simonemontella, valeriooconte
 */
contract VotationManager is IVotationManager {
    uint256 private nextElectionId = 1;

    /*
     * @notice Mapping che associa l'ID di un'elezione alla sua struttura dati
     * @dev Per memorizzare le elezioni create
     */
    mapping(uint256 => Votation) public votations;

    /**
     * @notice Mapping che associa l'ID di un'elezione al numero di voti per ciascun candidato
     * @dev Per memorizzare i risultati delle elezioni
     */
    mapping(uint256 => mapping(uint256 => uint256)) public votationCandidatesVotes;

    /// @inheritdoc IVotationManager
    function createElection(Votation memory _newVotation) external {
        if (_newVotation.startTime >= _newVotation.endTime) revert InvalidTimeInterval();
        if (block.timestamp < _newVotation.startTime || block.timestamp > _newVotation.endTime) revert InvalidTimeInterval();
        if (bytes(_newVotation.name).length == 0) revert InvalidName();

        _newVotation.id = nextElectionId;
        _newVotation.isActive = false;
        votations[nextElectionId] = _newVotation;
        nextElectionId++;

        emit VotationCreated(nextElectionId, _newVotation.name, _newVotation.startTime, _newVotation.endTime);
    }

    /// @inheritdoc IVotationManager
    function startVotation(uint256 votationId) external {
        Votation storage votation = votations[votationId];

        if (votation.id == 0) revert VotationNotFound(votationId);
        if (votation.isActive) revert VotationAlreadyActive(votationId);

        votations[votationId].isActive = true;

        emit VotationStarted(votationId, votation.name, votation.endTime);
    }

    /// @inheritdoc IVotationManager
    function vote(uint256 votationId, uint256 candidateId, bytes32 root, bytes32 nullifierHash) external {
        Votation storage votation = votations[votationId];

        if (votation.id == 0) revert VotationNotFound(votationId);
        if (!votation.isActive) revert VotationNotActive(votationId);
        if (block.timestamp < votation.startTime || block.timestamp > votation.endTime) revert VotingWindowClosed(votationId);
        
        
    }

}