'use client'

import React from 'react';
import Link from 'next/link';
import { useWalletsState } from './context/WalletContext';
import { useSpl } from './context/SplContext';

/**
 * Home component: The main landing page of the Loyalty Pass application
 * It displays different content based on the user's wallet and token status
 */
const Home: React.FC = () => {
  const { wallet } = useWalletsState();
  const { splToken } = useSpl();

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Welcome to Loyalty Pass</h1>
      <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
        Create and manage Apple Wallet passes for your loyalty program.
      </p>
      
      {renderContent(wallet, splToken)}
    </div>
  );
};

/**
 * Renders the appropriate content based on the user's wallet and token status
 * @param wallet - The user's wallet object
 * @param splToken - The user's SPL token object
 * @returns JSX.Element - The rendered content
 */
const renderContent = (wallet: any, splToken: any): JSX.Element => {
  if (!wallet) {
    return (
      <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
        Please wait for your wallet to be generated.
      </p>
    );
  }

  if (!splToken) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Create a Loyalty Token</h2>
        <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
          You haven't created your loyalty token yet. Let's get started!
        </p>
        <Link href="/token" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded inline-block">
          Create Loyalty Token
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ActionCard
        title="Create a Pass"
        description="Start by creating your custom Solana-enabled Apple Wallet pass."
        linkText="Get Started"
        linkHref="/passes/create"
      />
      <ActionCard
        title="Learn More"
        description="Discover how Loyalty Pass can enhance your loyalty program."
        linkText="View Docs"
        linkHref="/docs"
      />
    </div>
  );
};

/**
 * ActionCard component: Renders a card with a title, description, and action link
 */
const ActionCard: React.FC<{
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}> = ({ title, description, linkText, linkHref }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
    <p className="mb-4 text-gray-600 dark:text-gray-400">{description}</p>
    <Link href={linkHref} className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-2 px-4 rounded inline-block">
      {linkText}
    </Link>
  </div>
);

export default Home;
