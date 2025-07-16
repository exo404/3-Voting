"use client";

import React, { useEffect, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface CreateVotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Candidate {
  id: string;
  name: string;
}

export const CreateVotationModal = ({ isOpen, onClose }: CreateVotationModalProps) => {
  const [votationName, setVotationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: "1", name: "" },
    { id: "2", name: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<any>(null);

  const { writeContractAsync: createVotation } = useScaffoldWriteContract({contractName: "VotationManager"});

  const addCandidate = () => {
    const newId = (candidates.length + 1).toString();
    setCandidates([...candidates, { id: newId, name: "" }]);
  };

  const removeCandidate = (id: string) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter(candidate => candidate.id !== id));
    }
  };

  const updateCandidate = (id: string, name: string) => {
    setCandidates(candidates.map(candidate => 
      candidate.id === id ? { ...candidate, name } : candidate
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!votationName || !startDate || !endDate) {
      notification.error("Please fill in all required fields");
      return;
    }

    const validCandidates = candidates.filter(c => c.name.trim() !== "");
    if (validCandidates.length < 2) {
      notification.error("At least 2 candidates are required");
      return;
    }

    setIsLoading(true);

    try {
      const startTime = Math.floor(new Date(startDate).getTime() / 1000);
      const endTime = Math.floor(new Date(endDate).getTime() / 1000);
      
      useEffect(() => {
        fetch('http://localhost:3000/api/votation') // Cambia l'URL con quello del tuo backend
        .then((res) => {
          if (!res.ok) throw new Error("Errore nella risposta del server");
          return res.json();
        })
        .then((json) => setData(json))
        .catch((err) => console.error("Errore:", err));
      }, []);

      const votationId = data.las

      const candidateIds = validCandidates.map((_, index) => index + 1);

      const votationData = {
        id: votationId,
        name: votationName,
        startTime: startTime,
        endTime: endTime,
        isActive: false,
        candidates: candidateIds,
      };

      await createVotation({
        functionName: "createVotation",
        args: [votationData],
      });

      notification.success("Votation created successfully!");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating votation:", error);
      notification.error("Failed to create votation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVotationName("");
    setStartDate("");
    setEndDate("");
    setCandidates([
      { id: "1", name: "" },
      { id: "2", name: "" },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create New Votation</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Votation Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter votation name"
              className="input input-bordered w-full"
              value={votationName}
              onChange={(e) => setVotationName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Start Date *</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">End Date *</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label">
                <span className="label-text">Candidates *</span>
              </label>
            </div>

            <div className="space-y-2">
              {candidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Candidate ${index + 1} name`}
                    className="input input-bordered flex-1"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(candidate.id, e.target.value)}
                  />
                  {candidates.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(candidate.id)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                "Create Votation"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
