"use client";

import { useState, useEffect } from "react";
import { ChartBarIcon, UsersIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface VotationResult {
  id: number;
  name: string;
  totalVotes: number;
  candidates: {
    id: number;
    name: string;
    votes: number;
  }[];
}

export const VotationStats = () => {
  const [results, setResults] = useState<VotationResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the contract
  useEffect(() => {
    const mockResults: VotationResult[] = [
      {
        id: 1,
        name: "Student Council Election 2024",
        totalVotes: 150,
        candidates: [
          { id: 1, name: "Alice Johnson", votes: 75 },
          { id: 2, name: "Bob Smith", votes: 45 },
          { id: 3, name: "Carol Brown", votes: 30 }
        ]
      },
      {
        id: 2,
        name: "Community Project Vote",
        totalVotes: 89,
        candidates: [
          { id: 1, name: "New Library", votes: 52 },
          { id: 2, name: "Community Garden", votes: 37 }
        ]
      }
    ];
    setResults(mockResults);
    setLoading(false);
  }, []);

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getWinner = (candidates: VotationResult['candidates']) => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) => 
      prev.votes > current.votes ? prev : current
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-32">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalVotesAllTime = results.reduce((sum, result) => sum + result.totalVotes, 0);
  const totalVotations = results.length;
  const activeVotations = 1; // Mock data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Votation Statistics</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-primary">
            <ChartBarIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">Total Votations</div>
          <div className="stat-value text-primary">{totalVotations}</div>
          <div className="stat-desc">All time</div>
        </div>

        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-secondary">
            <UsersIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">Total Votes</div>
          <div className="stat-value text-secondary">{totalVotesAllTime}</div>
          <div className="stat-desc">Cast across all votations</div>
        </div>

        <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-accent">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">Active Votations</div>
          <div className="stat-value text-accent">{activeVotations}</div>
          <div className="stat-desc">Currently running</div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Detailed Results</h3>
        
        {results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No votation results available yet.</p>
          </div>
        ) : (
          results.map((result) => {
            const winner = getWinner(result.candidates);
            
            return (
              <div key={result.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="card-title">{result.name}</h4>
                    <div className="badge badge-outline">
                      {result.totalVotes} total votes
                    </div>
                  </div>

                  {winner && (
                    <div className="alert alert-success mb-4">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>
                        <strong>{winner.name}</strong> won with {winner.votes} votes 
                        ({getPercentage(winner.votes, result.totalVotes)}%)
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {result.candidates
                      .sort((a, b) => b.votes - a.votes)
                      .map((candidate) => {
                        const percentage = getPercentage(candidate.votes, result.totalVotes);
                        const isWinner = winner && candidate.id === winner.id;
                        
                        return (
                          <div key={candidate.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${isWinner ? 'text-success' : ''}`}>
                                {candidate.name}
                                {isWinner && <span className="ml-2 badge badge-success badge-sm">Winner</span>}
                              </span>
                              <span className="text-sm text-gray-600">
                                {candidate.votes} votes ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${isWinner ? 'bg-success' : 'bg-primary'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
