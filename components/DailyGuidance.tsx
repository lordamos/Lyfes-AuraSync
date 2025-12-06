
import React from 'react';
import { DailyGuidanceReport } from '../types';
import { Volume2, VolumeX } from 'lucide-react'; // Import lucide icons

interface DailyGuidanceProps {
  report: DailyGuidanceReport;
  speak: (text: string, id: string) => Promise<void>;
  currentSpeakingId: string | null;
}

export const DailyGuidance: React.FC<DailyGuidanceProps> = ({ report, speak, currentSpeakingId }) => {
  const pId = report.personId;
  const colorId = `daily-color-${pId}`;
  const crystalId = `daily-crystal-${pId}`;
  const themeId = `daily-theme-${pId}`;

  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in animate-slide-in-up">
      <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-6 text-center">Your Daily Energetic Guidance</h3>
      
      <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
        {/* Daily Color Card */}
        <div className="col-span-1 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center shadow-lg bg-gradient-to-br from-brand-dark-secondary/50 to-brand-dark/50 relative">
          <button
            onClick={() => speak(`Daily Color: ${report.dailyColor.name}. ${report.dailyColor.explanation}`, colorId)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${currentSpeakingId === colorId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-white'}`}
            aria-label={currentSpeakingId === colorId ? "Stop" : `Listen to daily color`}
          >
            {currentSpeakingId === colorId ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/30 mb-4 shadow-inner"
            style={{ backgroundColor: report.dailyColor.hex, color: report.dailyColor.hex && (parseInt(report.dailyColor.hex.substring(1), 16) > 0xffffff / 2) ? '#333' : '#fff' }}
          >
            {report.dailyColor.name.charAt(0)}
          </div>
          <h4 className="text-xl font-bold text-white mb-2" style={{ color: report.dailyColor.hex }}>{report.dailyColor.name}</h4>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.dailyColor.explanation}</p>
        </div>

        {/* Daily Crystal Card */}
        <div className="col-span-1 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center shadow-lg bg-gradient-to-br from-brand-dark-secondary/50 to-brand-dark/50 relative">
          <button
            onClick={() => speak(`Daily Crystal: ${report.dailyCrystal.name}. ${report.dailyCrystal.explanation}`, crystalId)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${currentSpeakingId === crystalId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-white'}`}
            aria-label={currentSpeakingId === crystalId ? "Stop" : `Listen to daily crystal`}
          >
            {currentSpeakingId === crystalId ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <svg className="w-24 h-24 text-brand-accent mb-4 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L6 12H18L12 2Z" /> {/* Simple crystal/gem icon */}
            <path opacity="0.5" d="M12 22L18 12H6L12 22Z" />
          </svg>
          <h4 className="text-xl font-bold text-white mb-2">{report.dailyCrystal.name}</h4>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.dailyCrystal.explanation}</p>
        </div>

        {/* Daily Theme Card */}
        <div className="col-span-1 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center shadow-lg bg-gradient-to-br from-brand-dark-secondary/50 to-brand-dark/50 relative">
          <button
            onClick={() => speak(`Daily Theme: ${report.dailyTheme}`, themeId)}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${currentSpeakingId === themeId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-white'}`}
            aria-label={currentSpeakingId === themeId ? "Stop" : `Listen to daily theme`}
          >
            {currentSpeakingId === themeId ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <svg className="w-24 h-24 text-brand-primary mb-4 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.5V.75M.75 12h15M7.5 7.5L3 12m4.5 4.5L3 12" /> {/* Abstract theme icon */}
          </svg>
          <h4 className="text-xl font-bold text-white mb-2">Daily Theme</h4>
          <p className="text-sm italic text-gray-300 leading-relaxed pr-8">"{report.dailyTheme}"</p>
        </div>
      </div>
    </div>
  );
};
