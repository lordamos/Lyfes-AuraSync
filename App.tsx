
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BirthForm } from './components/BirthForm';
import { ChartDisplay } from './components/ChartDisplay';
import { Loader } from './components/Loader';
import { generateAllReports } from './services/geminiService';
import type { AllReports, IndividualBirthData } from './types';
import { useTheme } from './hooks/useTheme';
import { useTextToSpeech } from './hooks/useTextToSpeech'; // Import the new hook

const App: React.FC = () => {
  const [individuals, setIndividuals] = useState<IndividualBirthData[]>([]);
  const [allReports, setAllReports] = useState<AllReports | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { speak, currentSpeakingId, stopSpeaking } = useTextToSpeech(); // Use the new hook

  const handleGenerateReports = useCallback(async (data: IndividualBirthData[]) => {
    setIsLoading(true);
    setError(null);
    setAllReports(null);
    setIndividuals(data); // Store individuals for display in ChartDisplay
    try {
      const result = await generateAllReports(data);
      setAllReports(result);
    } catch (err) {
      console.error(err);
      setError('Failed to generate your charts and reports. The energies might be in flux. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Shared URL on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    
    if (sharedData) {
      try {
        // Decode Base64 to JSON string, handling potential unicode characters
        const jsonStr = decodeURIComponent(
          Array.prototype.map.call(atob(sharedData), (c: string) => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join('')
        );
        
        const data = JSON.parse(jsonStr);
        
        if (Array.isArray(data) && data.length > 0) {
          // Remove the query param from URL without refreshing to clean up
          window.history.replaceState({}, document.title, window.location.pathname);
          // Automatically generate reports
          handleGenerateReports(data);
        }
      } catch (e) {
        console.error("Failed to load shared report:", e);
        setError("Invalid or expired share link.");
      }
    }
  }, [handleGenerateReports]);
  
  const handleReset = () => {
    stopSpeaking(); // Stop any speech on reset
    setIndividuals([]);
    setAllReports(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans text-gray-800 dark:text-gray-200 ${theme}`}>
      <Header toggleTheme={toggleTheme} theme={theme} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center relative z-10">
        {isLoading && <Loader />}
        
        {!isLoading && !allReports && !error && (
          <div className="w-full max-w-2xl text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white drop-shadow-lg">Unlock Your Energetic Blueprint</h1>
            <p className="text-lg mt-4 mb-8 text-gray-700 dark:text-gray-300 drop-shadow-sm">Enter birth details to generate unique Human Design charts, numerology reports, and family synastry insights.</p>
            <BirthForm onGenerate={handleGenerateReports} />
          </div>
        )}

        {error && (
          <div className="text-center animate-fade-in glass-card p-8 rounded-2xl">
            <p className="text-red-400 text-xl mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-opacity-75 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && allReports && (
          <ChartDisplay 
            allReports={allReports} 
            individuals={individuals} 
            onReset={handleReset} 
            speak={speak} // Pass speak function
            currentSpeakingId={currentSpeakingId} // Pass speaking status ID
            stopSpeaking={stopSpeaking} // Pass stop function
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
