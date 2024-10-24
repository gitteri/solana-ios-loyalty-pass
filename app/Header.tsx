'use client'

import { FC, useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletsState } from './context/WalletContext';
import { useSpl } from './context/SplContext';

/**
 * Header component for the application
 * Includes navigation menu and dark mode toggle
 */
const Header: FC = () => {
  const { wallet } = useWalletsState();
  const { splToken } = useSpl();
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, _] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const router = useRouter()

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  /**
   * Handle navigation and close menu
   * @param {string} path - The path to navigate to
   */
  const handleNavigation = (path: string) => {
    setIsMenuOpen(false)
    router.push(path)
  }

  return (
    <header className="bg-white dark:bg-gray-800 py-4 shadow-md my-4">
      <nav className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <a href="/" onClick={() => handleNavigation('/')} className="text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            LoyaltyPass
          </a>
        </h1>
        <div className="flex items-center">
          {/* Mobile menu toggle button */}
          <button
            className="md:hidden text-gray-800 dark:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
        {/* Navigation menu */}
        <ul className={`md:flex md:space-x-6 ${isMenuOpen ? 'block' : 'hidden'} absolute md:relative top-16 md:top-0 left-0 right-0 bg-white dark:bg-gray-800 md:bg-transparent md:dark:bg-transparent p-4 md:p-0 shadow-lg md:shadow-none`}>
          {wallet && splToken && (
            <Fragment>
              <li><button onClick={() => handleNavigation('/wallet')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Wallet</button></li>
              <li><button onClick={() => handleNavigation('/token')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Loyalty Token</button></li>
              <li><button onClick={() => handleNavigation('/passes/redeem')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Redeem Pass</button></li>
              <li><button onClick={() => handleNavigation('/passes/create')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Create Pass</button></li>
              <li><button onClick={() => handleNavigation('/passes')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Passes</button></li>
              <li><button onClick={() => handleNavigation('/about')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">About</button></li>
            </Fragment>
          )}
          {wallet && !splToken && (
            <Fragment>
              <li><button onClick={() => handleNavigation('/wallet')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Wallet</button></li>
              <li><button onClick={() => handleNavigation('/token')} className="block py-2 md:py-0 text-gray-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Loyalty Token</button></li>
            </Fragment>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
