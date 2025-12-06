
import React from 'react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({ toggleTheme, theme }) => {
  return (
    <header className="glass-card rounded-none sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <svg
            className="w-8 h-8 text-brand-primary dark:text-indigo-400 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
            <path
              d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">AuraSync</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Unlock Your Energetic Blueprint</p>
          </div>
        </div>
        <ThemeToggle toggleTheme={toggleTheme} theme={theme} />
      </div>
    </header>
  );
};