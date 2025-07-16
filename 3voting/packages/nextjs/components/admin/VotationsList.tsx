"use client";

import { useState, useEffect } from "react";
import { PlayIcon, PauseIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface Votation {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  candidates: number[];
}

export const VotationsList = () => {
  const [votations, setVotations] = useState<Votation[]>([]);
  const [loading, setLoading] = useState(true);

  const { writeContractAsync: startVotation } = useScaffoldWriteContract("VotationManager");
  const { writeContractAsync: closeVotation } = useScaffoldWriteContract("VotationManager");

  // Mock data - in a real app, this would come from the contract
  useEffect(() => {
    const mockVotations: Votation[] = [
      {
        id: 1,
        name: "Student Council Election 2024",
        startTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        endTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        isActive: false,
        candidates: [1, 2, 3]
      },
      {
        id: 2,
        name: "Community Project Vote",
        startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        isActive: true,
        candidates: [1, 2]
      }
    ];
    setVotations(mockVotations);
    setLoading(false);
  }, []);

  const handleStartVotation = async (votationId: number) => {
    try {
      await startVotation({
        functionName: "startVotation",
        args: [votationId],
      });
      
      setVotations(prev => prev.map(v => 
        v.id === votationId ? { ...v, isActive: true } : v
      ));
      
      notification.success("Votation started successfully!");
    } catch (error) {
      console.error("Error starting votation:", error);
      notification.error("Failed to start votation");
    }
  };

  const handleCloseVotation = async (votationId: number) => {
    try {
      await closeVotation({
        functionName: "closeVotation",
        args: [votationId],
      });
      
      setVotations(prev => prev.map(v => 
        v.id === votationId ? { ...v, isActive: false } : v
      ));
      
      notification.success("Votation closed successfully!");
    } catch (error) {
      console.error("Error closing votation:", error);
      notification.error("Failed to close votation");
    }
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

  const getStatus = (votation: Votation) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < votation.startTime) return "scheduled";
    if (now > votation.endTime) return "ended";
    return votation.isActive ? "active" : "paused";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Active</span>;
      case "scheduled":
        return <span className="badge badge-warning">Scheduled</span>;
      case "paused":
        return <span className="badge badge-error">Paused</span>;
      case "ended":
        return <span className="badge badge-neutral">Ended</span>;
      default:
        return <span className="badge badge-ghost">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-32">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Votations</h2>
        <div className="text-sm text-gray-600">
          {votations.length} total votations
        </div>
      </div>

      {votations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No votations created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {votations.map((votation) => {
            const status = getStatus(votation);
            const now = Math.floor(Date.now() / 1000);
            const canStart = now >= votation.startTime && now <= votation.endTime && !votation.isActive;
            const canClose = votation.isActive && now <= votation.endTime;

            return (
              <div key={votation.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="card-title">{votation.name}</h3>
                        {getStatusBadge(status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Start: {formatDate(votation.startTime)}</p>
                        <p>End: {formatDate(votation.endTime)}</p>
                        <p>Candidates: {votation.candidates.length}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {/* TODO: Implement view details */}}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      {canStart && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStartVotation(votation.id)}
                        >
                          <PlayIcon className="h-4 w-4" />
                          Start
                        </button>
                      )}

                      {canClose && (
                        <button
                          className="btn btn-error btn-sm"
                          onClick={() => handleCloseVotation(votation.id)}
                        >
                          <PauseIcon className="h-4 w-4" />
                          Close
                        </button>
                      )}

                      {status === "ended" && (
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => {/* TODO: Implement delete */}}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
