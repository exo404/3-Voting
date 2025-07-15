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
    function createVotation(Votation memory _newVotation) external {
        if (_newVotation.startTime >= _newVotation.endTime) revert InvalidTimeInterval();
        if (block.timestamp < _newVotation.startTime || block.timestamp > _newVotation.endTime) revert InvalidTimeInterval();
        if (bytes(_newVotation.name).length == 0) revert InvalidName();

        _newVotation.isActive = false;
        votations[_newVotation.id] = _newVotation;

        emit VotationCreated(_newVotation.id, _newVotation.name, _newVotation.startTime, _newVotation.endTime);
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
        if (!_checkVotingWindow(votationId)) revert VotingWindowClosed(votationId);

        if (!_verifyVote(votationId, candidateId)) revert InvalidVote();

        votationCandidatesVotes[votationId][candidateId] += 1;
        emit VoteCast(votationId, msg.sender);
    }

    /// @inheritdoc IVotationManager
    function verifyVote(uint256 votationId, uint256 candidateId) external view returns (bool) {
        return _verifyVote(votationId, candidateId);
    }

    /// @inheritdoc IVotationManager
    function votationResults(uint256 votationId) external view returns (uint256[] memory candidateIds, uint256[] memory votes) {
        Votation storage votation = votations[votationId];

        if (votation.id == 0) revert VotationNotFound(votationId);

        uint256 candidateCount = votation.candidates.length;
        uint256 candidateId;

        votes = new uint256[](candidateCount);

        for (uint256 i = 0; i < candidateCount; i++) {
            candidateId = votation.candidates[i];
            votes[i] = votationCandidatesVotes[votationId][candidateId];
        }

        return (votation.candidates, votes);
    }

    /// @inheritdoc IVotationManager
    function checkVotingWindow(uint256 votationId) external view returns (bool) {
        return _checkVotingWindow(votationId);      
    }

    /// @inheritdoc IVotationManager
    function getVotation(uint256 votationId) external view returns (Votation memory) {
        Votation storage votation = votations[votationId];

        if (votation.id == 0) revert VotationNotFound(votationId);

        return votation;
    }

    function _verifyVote(uint256 votationId, uint256 candidateId) internal view returns (bool) {
    }

    function _checkVotingWindow(uint256 votationId) internal view returns (bool) {
        Votation storage votation = votations[votationId];

        if (votation.id == 0) revert VotationNotFound(votationId);
        if (!votation.isActive) revert VotationNotActive(votationId);

        return (block.timestamp >= votation.startTime && block.timestamp <= votation.endTime);
    }
}