"use client";

import { useState } from "react";
import { ClockIcon, UserIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface Candidate {
  id: number;
  name: string;
}

interface Votation {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  candidates: Candidate[];
}

interface VotingCardProps {
  votation: Votation;
  timeRemaining: string;
  onVote: (votationId: number, candidateId: number) => void;
}

export const VotingCard = ({ votation, timeRemaining, onVote }: VotingCardProps) => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false); // In a real app, this would be checked from the contract

  const { writeContractAsync: vote } = useScaffoldWriteContract("VotationManager");

  const handleVote = async () => {
    if (!selectedCandidate) {
      notification.error("Please select a candidate");
      return;
    }

    setIsVoting(true);

    try {
      // In a real implementation, you would need to handle Merkle proofs and nullifier hashes
      await vote({
        functionName: "vote",
        args: [votation.id, selectedCandidate, "0x" + "0".repeat(64), "0x" + "0".repeat(64)],
      });

      setHasVoted(true);
      onVote(votation.id, selectedCandidate);
      notification.success("Vote cast successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      notification.error("Failed to cast vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="card-title text-xl mb-2">{votation.name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>{timeRemaining}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>{votation.candidates.length} candidates</span>
              </div>
            </div>
          </div>
          <div className="badge badge-success">Active</div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Started: {formatDate(votation.startTime)}</p>
          <p>Ends: {formatDate(votation.endTime)}</p>
        </div>

        {hasVoted ? (
          <div className="alert alert-success">
            <CheckIcon className="h-5 w-5" />
            <span>You have already voted in this election. Thank you for participating!</span>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold">Select a candidate:</h3>
              {votation.candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCandidate === candidate.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`candidate-${votation.id}`}
                    value={candidate.id}
                    checked={selectedCandidate === candidate.id}
                    onChange={() => setSelectedCandidate(candidate.id)}
                    className="radio radio-primary mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{candidate.name}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="card-actions justify-end">
              <button
                onClick={handleVote}
                disabled={!selectedCandidate || isVoting}
                className="btn btn-primary"
              >
                {isVoting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Casting Vote...
                  </>
                ) : (
                  "Cast Vote"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
