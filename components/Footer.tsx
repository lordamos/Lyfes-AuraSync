
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AuraSync. All rights reserved. Insights for self-discovery purposes only.
        </p>
      </div>
    </footer>
  );
};
