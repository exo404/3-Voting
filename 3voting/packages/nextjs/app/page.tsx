"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CheckCircleIcon, CogIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">3Voting</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <p className="text-center text-lg mb-8">
            A decentralized voting system built on Ethereum{" "}
            <br />
            <span className="text-sm text-gray-600">
              Secure, transparent, and anonymous voting powered by Web3
            </span>
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/vote" className="btn btn-primary">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Start Voting
            </Link>
            <Link href="/admin" className="btn btn-secondary">
              <CogIcon className="h-5 w-5 mr-2" />
              Admin Panel
            </Link>
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <CheckCircleIcon className="h-8 w-8 fill-secondary" />
              <p>
                Participate in active votations by visiting the{" "}
                <Link href="/vote" passHref className="link">
                  Vote
                </Link>{" "}
                page.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <CogIcon className="h-8 w-8 fill-secondary" />
              <p>
                Create and manage votations using the{" "}
                <Link href="/admin" passHref className="link">
                  Admin Dashboard
                </Link>{" "}
                .
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <ChartBarIcon className="h-8 w-8 fill-secondary" />
              <p>
                View voting results and statistics in the{" "}
                <Link href="/admin" passHref className="link">
                  Admin Panel
                </Link>{" "}
                statistics tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
