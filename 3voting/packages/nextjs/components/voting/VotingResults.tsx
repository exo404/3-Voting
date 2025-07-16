"use client";

import { useState, useEffect } from "react";
import { ChartBarIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

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

interface VotationResultsProps {
  votation: Votation;
}

interface CandidateResult {
  id: number;
  name: string;
  votes: number;
}

export const VotingResults = ({ votation }: VotationResultsProps) => {
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);

  // Mock data - in a real app, this would come from the contract
  useEffect(() => {
    const mockResults: CandidateResult[] = votation.candidates.map((candidate, index) => ({
      id: candidate.id,
      name: candidate.name,
      votes: Math.floor(Math.random() * 100) + 10 // Random votes for demo
    }));

    // Sort by votes descending
    mockResults.sort((a, b) => b.votes - a.votes);
    
    const total = mockResults.reduce((sum, candidate) => sum + candidate.votes, 0);
    
    setResults(mockResults);
    setTotalVotes(total);
    setLoading(false);
  }, [votation.candidates]);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const getWinner = () => {
    return results.length > 0 ? results[0] : null;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-center items-center min-h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const winner = getWinner();

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="card-title text-xl mb-2">{votation.name}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Started: {formatDate(votation.startTime)}</p>
              <p>Ended: {formatDate(votation.endTime)}</p>
            </div>
          </div>
          <div className="badge badge-neutral">Completed</div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold">Total Votes: {totalVotes}</span>
          </div>
          {winner && (
            <div className="flex items-center gap-2 text-success">
              <TrophyIcon className="h-5 w-5" />
              <span className="font-semibold">Winner: {winner.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Results:</h3>
          
          {results.map((candidate, index) => {
            const percentage = getPercentage(candidate.votes);
            const isWinner = index === 0 && results.length > 1;
            
            return (
              <div key={candidate.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isWinner ? 'text-success' : ''}`}>
                      {index + 1}. {candidate.name}
                    </span>
                    {isWinner && (
                      <div className="badge badge-success badge-sm">Winner</div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {candidate.votes} votes ({percentage}%)
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isWinner ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No results available for this votation.
          </div>
        )}
      </div>
    </div>
  );
};
