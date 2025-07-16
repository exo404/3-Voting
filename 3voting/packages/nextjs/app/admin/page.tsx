"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { PlusIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { CreateVotationModal } from "~~/components/admin/CreateVotationModal";
import { VotationsList } from "~~/components/admin/VotationsList";
import { VotationStats } from "~~/components/admin/VotationStats";

const AdminDashboard = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"create" | "manage" | "stats">("create");
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">Please connect your wallet to access the admin dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create New Votation
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <a
          className={`tab ${activeTab === "create" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Create Votation
        </a>
        <a
          className={`tab ${activeTab === "manage" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Manage Votations
        </a>
        <a
          className={`tab ${activeTab === "stats" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          Statistics
        </a>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === "create" && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Create New Votation</h2>
              <p className="text-gray-600 mb-6">
                Use the button above to create a new votation with candidates and voting parameters.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat">
                  <div className="stat-title">Active Votations</div>
                  <div className="stat-value text-primary">0</div>
                  <div className="stat-desc">Currently running</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total Votations</div>
                  <div className="stat-value text-secondary">0</div>
                  <div className="stat-desc">All time</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total Votes</div>
                  <div className="stat-value text-accent">0</div>
                  <div className="stat-desc">Cast across all votations</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <VotationsList />
        )}

        {activeTab === "stats" && (
          <VotationStats />
        )}
      </div>

      {/* Create Votation Modal */}
      {showCreateModal && (
        <CreateVotationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
