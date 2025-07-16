"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { VotingCard } from "~~/components/voting/VotingCard";
import { VotingResults } from "~~/components/voting/VotingResults";

interface Votation {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  candidates: {
    id: number;
    name: string;
  }[];
}

const VotingPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeVotations, setActiveVotations] = useState<Votation[]>([]);
  const [completedVotations, setCompletedVotations] = useState<Votation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Mock data - in a real app, this would come from the contract
  useEffect(() => {
    const mockActiveVotations: Votation[] = [
      {
        id: 1,
        name: "Student Council Election 2024",
        startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        endTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        isActive: true,
        candidates: [
          { id: 1, name: "Alice Johnson" },
          { id: 2, name: "Bob Smith" },
          { id: 3, name: "Carol Brown" }
        ]
      },
      {
        id: 2,
        name: "Community Project Vote",
        startTime: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        isActive: true,
        candidates: [
          { id: 1, name: "New Library" },
          { id: 2, name: "Community Garden" }
        ]
      }
    ];

    const mockCompletedVotations: Votation[] = [
      {
        id: 3,
        name: "Budget Allocation 2023",
        startTime: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        endTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        isActive: false,
        candidates: [
          { id: 1, name: "Education" },
          { id: 2, name: "Infrastructure" },
          { id: 3, name: "Healthcare" }
        ]
      }
    ];

    setActiveVotations(mockActiveVotations);
    setCompletedVotations(mockCompletedVotations);
    setLoading(false);
  }, []);

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining <= 0) return "Ended";
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (!connectedAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Wallet to Vote</h2>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to participate in voting
            </p>
            <XCircleIcon className="h-16 w-16 text-error mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Voting Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Connected as:</span>
          <span className="font-mono text-xs">
            {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <a
          className={`tab ${activeTab === "active" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Active Votations ({activeVotations.length})
        </a>
        <a
          className={`tab ${activeTab === "completed" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Completed ({completedVotations.length})
        </a>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === "active" && (
          <div className="space-y-6">
            {activeVotations.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No Active Votations</h3>
                <p className="text-gray-600">
                  There are currently no active votations available for voting.
                </p>
              </div>
            ) : (
              activeVotations.map((votation) => (
                <VotingCard
                  key={votation.id}
                  votation={votation}
                  timeRemaining={formatTimeRemaining(votation.endTime)}
                  onVote={(votationId, candidateId) => {
                    console.log(`Voting for candidate ${candidateId} in votation ${votationId}`);
                    // TODO: Implement actual voting logic
                  }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-6">
            {completedVotations.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No Completed Votations</h3>
                <p className="text-gray-600">
                  No completed votations to display results for.
                </p>
              </div>
            ) : (
              completedVotations.map((votation) => (
                <VotingResults
                  key={votation.id}
                  votation={votation}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingPage;
