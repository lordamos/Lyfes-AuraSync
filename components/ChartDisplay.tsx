
import React, { useState, useRef } from 'react';
import { Share2, Volume2, VolumeX } from 'lucide-react';
import { HumanDesignChart, Center, ChartProperty, Gate, NumerologyChart, SynastryReport, AllReports, IndividualBirthData, AstrologyChart, PlanetaryPlacement, Aspect, HousePlacement } from '../types';
import { BodyGraph } from './BodyGraph';
import { NatalChart } from './NatalChart';
import { SettingsIcon } from './icons/SettingsIcon';
import { DailyGuidance } from './DailyGuidance';
import { LifeOSSection } from './LifeOSSection';


interface ChartDisplayProps {
  allReports: AllReports;
  individuals: IndividualBirthData[];
  onReset: () => void;
  speak: (text: string, id: string) => Promise<void>; 
  currentSpeakingId: string | null;
  stopSpeaking: () => void;
}

// --- Reusable Card Components (Redesigned) ---

const InfoCard: React.FC<{ title: string; content: string; className?: string; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ title, content, className = '', speak, currentSpeakingId, uniqueId }) => {
  const isPlaying = currentSpeakingId === uniqueId;
  return (
    <div className={`glass-card p-4 rounded-lg text-center ${className} relative group`}>
      <button
        onClick={() => speak(`${title}. ${content}`, uniqueId)}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 ${isPlaying ? 'opacity-100 text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
        aria-label={isPlaying ? "Stop" : `Listen to ${title}`}
      >
        {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <h3 className="font-bold text-brand-primary dark:text-indigo-400">{title}</h3>
      <p className="text-gray-800 dark:text-gray-200 mt-1 font-semibold">{content}</p>
    </div>
  );
};

const DetailCard: React.FC<{ data: ChartProperty; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ data, speak, currentSpeakingId, uniqueId }) => {
  const isPlaying = currentSpeakingId === uniqueId;
  return (
    <div className="glass-card p-6 rounded-xl transform hover:scale-[1.02] transition-transform duration-300 animate-fade-in animate-slide-in-up relative">
      <button
        onClick={() => speak(`${data.name}. ${data.description}`, uniqueId)}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
        aria-label={isPlaying ? "Stop" : `Listen to ${data.name}`}
      >
        {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      <h3 className="text-2xl font-bold text-brand-primary dark:text-indigo-400">{data.name}</h3>
      <p className="mt-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{data.description}</p>
    </div>
  );
};

const CenterCard: React.FC<{ center: Center; highlighted: boolean; isVisible: boolean; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ center, highlighted, isVisible, speak, currentSpeakingId, uniqueId }) => {
    const isPlaying = currentSpeakingId === uniqueId;
    return (
      <div className={`glass-card p-4 rounded-lg transition-all duration-300 ${highlighted ? 'animate-highlight-pulse' : ''} ${!isVisible ? 'hidden' : ''} relative`}>
          <button
            onClick={() => speak(`${center.name} is ${center.defined ? 'defined' : 'undefined'}. ${center.description}`, uniqueId)}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={isPlaying ? "Stop" : `Listen to ${center.name}`}
          >
            {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="font-bold text-lg flex items-center text-gray-900 dark:text-white">
              <span className={`w-3 h-3 rounded-full mr-2 ${center.defined ? 'bg-brand-accent' : 'border-2 border-gray-400'}`}></span>
              {center.name}
              <span className={`ml-2 text-sm font-normal ${center.defined ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500'}`}>
                  ({center.defined ? 'Defined' : 'Undefined'})
              </span>
          </h4>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{center.description}</p>
      </div>
    );
};

const GateDetailCard: React.FC<{ gate: Gate; highlighted: boolean; isVisible: boolean; useSummary: boolean; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ gate, highlighted, isVisible, useSummary, speak, currentSpeakingId, uniqueId }) => {
  const isPlaying = currentSpeakingId === uniqueId;
  return (
    <div 
      id={`gate-card-${gate.id}`} 
      className={`glass-card p-4 rounded-lg animate-fade-in animate-slide-in-up ${highlighted ? 'animate-highlight-pulse' : ''} ${!isVisible ? 'hidden' : ''} relative`}
    >
      <button
        onClick={() => speak(useSummary ? gate.summary : gate.description, uniqueId)}
        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
        aria-label={isPlaying ? "Stop" : `Listen to Gate ${gate.id}`}
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <h4 className="font-bold text-lg text-brand-primary dark:text-indigo-400">
        Gate {gate.id}.{gate.line}: {gate.name} 
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({gate.center} Center)</span>
      </h4>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
        {useSummary ? gate.summary : gate.description}
      </p>
    </div>
  );
};

// --- Section-Specific Components ---

const HumanDesignSection: React.FC<{ chart: HumanDesignChart; isPrimary: boolean; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; }> = ({ chart, isPrimary, speak, currentSpeakingId }) => {
  const [highlightedCenter, setHighlightedCenter] = useState<string | null>(null);
  const [highlightedGateId, setHighlightedGateId] = useState<number | null>(null);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [displayOptions, setDisplayOptions] = useState({
    showCenters: true,
    showChannels: true,
    showGates: true,
    useGateSummaries: false,
  });

  const definedCenters = chart.centers.filter(c => c.defined).map(c => c.name.toLowerCase().replace(/ /g, '-').replace('-center','')) || [];
  
  const handleCenterClick = (centerName: string) => {
    const elementId = `center-card-${chart.personId}-${centerName}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCenter(centerName);
      setTimeout(() => setHighlightedCenter(null), 1500); 
    }
  };

  const handleDisplayOptionChange = (option: keyof typeof displayOptions) => {
    setDisplayOptions(prev => ({...prev, [option]: !prev[option]}));
  };

  const pId = chart.personId;

  return (
    <div className="border-b-2 pb-8 border-white/10 last:border-b-0 last:pb-0 animate-fade-in">
      <h3 className="text-3xl font-bold text-white mb-6 drop-shadow-lg">{chart.profileName}'s Human Design Chart}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isPrimary && (
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-4 rounded-xl">
              <BodyGraph 
                definedCenters={definedCenters} 
                onCenterClick={handleCenterClick} 
                activatedGates={chart.activatedGates} 
                highlightedGateId={highlightedGateId}
                setHighlightedGateId={setHighlightedGateId}
                displayOptions={displayOptions}
              />
            </div>
             <div className="relative glass-card p-4 rounded-xl">
              <button onClick={() => setShowDisplayOptions(!showDisplayOptions)} className="absolute top-2 right-2 p-2 text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-indigo-400">
                <SettingsIcon />
              </button>
              {showDisplayOptions && (
                 <div className="space-y-3 animate-fade-in">
                   <h4 className="font-bold text-brand-primary dark:text-indigo-400">Display Options</h4>
                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={displayOptions.showCenters} onChange={() => handleDisplayOptionChange('showCenters')} className="form-checkbox h-4 w-4 rounded bg-white/30 text-brand-primary"/> <span>Show Centers</span></label>
                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={displayOptions.showChannels} onChange={() => handleDisplayOptionChange('showChannels')} className="form-checkbox h-4 w-4 rounded bg-white/30 text-brand-primary"/> <span>Show Channels</span></label>
                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={displayOptions.showGates} onChange={() => handleDisplayOptionChange('showGates')} className="form-checkbox h-4 w-4 rounded bg-white/30 text-brand-primary"/> <span>Show Gates</span></label>
                   <hr className="border-white/20 my-2" />
                   <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={displayOptions.useGateSummaries} onChange={() => handleDisplayOptionChange('useGateSummaries')} className="form-checkbox h-4 w-4 rounded bg-white/30 text-brand-primary"/> <span>Use Gate Summaries</span></label>
                 </div>
              )}
               {!showDisplayOptions && (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard title="Type" content={chart.type.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-type-short`} />
                    <InfoCard title="Strategy" content={chart.strategy.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-strategy-short`} />
                    <InfoCard title="Authority" content={chart.authority.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-authority-short`} />
                    <InfoCard title="Profile" content={chart.profile.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-profile-short`} />
                    {chart.definition && <InfoCard title="Definition" content={chart.definition.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-definition-short`} />}
                    <InfoCard title="Incarnation Cross" content={chart.incarnationCross.name} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-cross-short`} />
                  </div>
               )}
            </div>
          </div>
        )}
        <div className={isPrimary ? "lg:col-span-2 space-y-8" : "lg:col-span-3 space-y-8"}>
          <DetailCard data={chart.type} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-type`} />
          <DetailCard data={chart.strategy} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-strategy`} />
          <DetailCard data={chart.authority} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-authority`} />
          <DetailCard data={chart.profile} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-profile`} />
          {chart.definition && <DetailCard data={chart.definition} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-definition`} />}
          <DetailCard data={chart.incarnationCross} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-cross`} />
          {displayOptions.showCenters && (
            <div>
              <h4 className="text-2xl font-bold mb-4 text-white drop-shadow-md">Your Energy Centers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chart.centers.sort((a,b) => a.name.localeCompare(b.name)).map(center => {
                  const centerId = center.name.toLowerCase().replace(/ /g, '-').replace('-center','');
                  return (
                    <div key={center.name} id={`center-card-${chart.personId}-${centerId}`}>
                      <CenterCard center={center} highlighted={highlightedCenter === centerId} isVisible={displayOptions.showCenters} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-center-${centerId}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {displayOptions.showGates && chart.activatedGates.length > 0 && (
            <div>
              <h4 className="text-2xl font-bold mb-4 text-white drop-shadow-md">Activated Gates & Their Meanings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chart.activatedGates
                  .sort((a, b) => a.id - b.id)
                  .map(gate => (
                    <GateDetailCard key={`gate-${gate.id}`} gate={gate} highlighted={highlightedGateId === gate.id} isVisible={displayOptions.showGates} useSummary={displayOptions.useGateSummaries} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-hd-gate-${gate.id}`} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Numerology Components ---

const LifePathIcon: React.FC<{ className?: string }> = ({ className = '' }) => (<svg className={`w-6 h-6 text-brand-accent ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-4 8v1m0 4v1m-4-8V9m8 0V9m-4 4v1m0 4v1M4 21h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>);
const ExpressionIcon: React.FC<{ className?: string }> = ({ className = '' }) => (<svg className={`w-6 h-6 text-brand-accent ${className}`} fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674h4.915c.957 0 1.345 1.258.582 1.81l-3.975 2.891 1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.891-3.976 2.891c-.783.57-1.838-.197-1.538-1.118l1.519-4.674-3.976-2.891c-.763-.552-.375-1.81.582-1-81h4.915l1.519-4.674z" /></svg>);
const SoulUrgeIcon: React.FC<{ className?: string }> = ({ className = '' }) => (<svg className={`w-6 h-6 text-brand-accent ${className}`} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2.5a5.5 5.5 0 00-5.5 5.5c0 1.944.801 3.535 2.062 4.939l3.438 3.586a1 1 0 001.414 0l3.438-3.586c1.261-1.404 2.062-2.995 2.062-4.939a5.5 5.5 0 00-5.5-5.5z" clipRule="evenodd" /></svg>);

const NumerologyCard: React.FC<{ numerology: NumerologyChart; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; }> = ({ numerology, speak, currentSpeakingId }) => {
  const pId = numerology.personId;
  const lpId = `${pId}-num-lp`;
  const expId = `${pId}-num-exp`;
  const soulId = `${pId}-num-soul`;

  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in animate-slide-in-up">
      <div className="space-y-6">
        <div className="border-b border-white/10 pb-4 relative">
          <button
            onClick={() => speak(`Life Path Number ${numerology.lifePathNumber}. ${numerology.lifePathDescription}`, lpId)}
            className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === lpId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === lpId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === lpId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white flex items-center"><LifePathIcon className="mr-3" /> Life Path Number: {numerology.lifePathNumber}</h4>
          <p className="mt-2 text-gray-300 whitespace-pre-wrap leading-relaxed">{numerology.lifePathDescription}</p>
        </div>
        <div className="border-b border-white/10 pb-4 relative">
          <button
            onClick={() => speak(`Expression Number ${numerology.expressionNumber}. ${numerology.expressionDescription}`, expId)}
            className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === expId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === expId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === expId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white flex items-center"><ExpressionIcon className="mr-3" /> Expression Number: {numerology.expressionNumber}</h4>
          <p className="mt-2 text-gray-300 whitespace-pre-wrap leading-relaxed">{numerology.expressionDescription}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => speak(`Soul Urge Number ${numerology.soulUrgeNumber}. ${numerology.soulUrgeDescription}`, soulId)}
            className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === soulId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === soulId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === soulId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white flex items-center"><SoulUrgeIcon className="mr-3" /> Soul Urge Number: {numerology.soulUrgeNumber}</h4>
          <p className="mt-2 text-gray-300 whitespace-pre-wrap leading-relaxed">{numerology.soulUrgeDescription}</p>
        </div>
      </div>
    </div>
  );
};

// --- Astrology Components ---

const PlanetaryPlacementCard: React.FC<{ placement: PlanetaryPlacement; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ placement, speak, currentSpeakingId, uniqueId }) => {
  const isPlaying = currentSpeakingId === uniqueId;
  return (
    <div className="p-3 bg-black/10 dark:bg-black/20 rounded-md border border-white/10 relative">
      <button
        onClick={() => speak(`${placement.planet} in ${placement.sign} at ${placement.degree} in House ${placement.house}. ${placement.description}`, uniqueId)}
        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
        aria-label={isPlaying ? "Stop" : `Listen to ${placement.planet}`}
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <h5 className="font-semibold text-white">{PLANET_SYMBOLS[placement.planet] || placement.planet} in {placement.sign} ({placement.degree})</h5>
      <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{placement.description}</p>
    </div>
  );
};

const AspectCard: React.FC<{ aspect: Aspect; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; uniqueId: string }> = ({ aspect, speak, currentSpeakingId, uniqueId }) => {
  const isPlaying = currentSpeakingId === uniqueId;
  return (
    <div className="p-3 bg-black/10 dark:bg-black/20 rounded-md border border-white/10 relative">
      <button
        onClick={() => speak(`${aspect.planet1} ${aspect.type} ${aspect.planet2} with an orb of ${aspect.orb}. ${aspect.description}`, uniqueId)}
        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
        aria-label={isPlaying ? "Stop" : `Listen to aspect`}
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <h5 className="font-semibold text-white">{aspect.planet1} {aspect.type} {aspect.planet2} ({aspect.orb})</h5>
      <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">{aspect.description}</p>
    </div>
  );
};

// Map of common planet symbols, use if PLANET_SYMBOLS not defined elsewhere
const PLANET_SYMBOLS: { [key: string]: string } = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Chiron: '⚷', Lilith: '⚸', Node: '☊', // Example additional bodies
};

const HouseCard: React.FC<{ house: HousePlacement; planets: PlanetaryPlacement[]; houseKeywords: string; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; pId: string }> = ({ house, planets, houseKeywords, speak, currentSpeakingId, pId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const houseId = `${pId}-astro-house-${house.house}`;

  const handleToggleAndScroll = () => {
    if (!isExpanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    setIsExpanded(prev => !prev);
  };

  const isPlaying = currentSpeakingId === houseId;

  return (
    <div ref={cardRef} className={`glass-card rounded-lg transition-all duration-300 overflow-hidden ${isExpanded ? 'p-4' : 'p-3'}`}>
      <button
        onClick={handleToggleAndScroll}
        className="w-full text-left flex justify-between items-center group"
        aria-expanded={isExpanded}
        aria-controls={`house-details-${house.house}`}
      >
        <div>
          <h5 className="font-bold text-md text-white group-hover:text-brand-primary dark:group-hover:text-indigo-400 transition-colors">
            {house.house}. House in {house.sign}
          </h5>
          <p className="text-sm text-gray-300 dark:text-gray-400">{houseKeywords}</p>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {planets.map(p => (
            <span key={p.planet} title={p.planet} className="text-xs font-semibold bg-indigo-200/20 dark:bg-indigo-900/50 text-indigo-200 dark:text-indigo-300 w-6 h-6 flex items-center justify-center rounded-full">{PLANET_SYMBOLS[p.planet] || p.planet.substring(0,1).toUpperCase()}</span>
          ))}
          <svg className={`w-5 h-5 text-gray-300 dark:text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div id={`house-details-${house.house}`} className="mt-4 pt-4 border-t border-white/20 space-y-3 animate-fade-in relative">
          <button
            onClick={() => speak(`House ${house.house} in ${house.sign}. ${house.description}`, houseId)}
            className={`absolute top-4 right-2 p-1 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={isPlaying ? "Stop" : `Listen to House ${house.house}`}
          >
            {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <p className="text-sm text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{house.description}</p>
          {planets.length > 0 ? (
            planets.map(p => <PlanetaryPlacementCard key={p.planet} placement={p} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${houseId}-${p.planet}`} />)
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No planets in this house.</p>
          )}
        </div>
      )}
    </div>
  );
};


const AstrologyCard: React.FC<{ chart: AstrologyChart; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; }> = ({ chart, speak, currentSpeakingId }) => {
  const planetsByHouse = chart.planetaryPlacements.reduce((acc, p) => {
    acc[p.house] = acc[p.house] || [];
    acc[p.house].push(p);
    return acc;
  }, {} as Record<number, PlanetaryPlacement[]>);

  const houseKeywordsMap: { [key: number]: string } = {
    1: "Self, Identity, Appearance",
    2: "Values, Possessions, Security",
    3: "Communication, Siblings, Short Trips",
    4: "Home, Family, Roots",
    5: "Creativity, Romance, Children",
    6: "Health, Work, Daily Routines",
    7: "Partnerships, Marriage, Contracts",
    8: "Transformation, Shared Resources, Intimacy",
    9: "Philosophy, Higher Education, Travel",
    10: "Career, Public Life, Reputation",
    11: "Friendships, Groups, Hopes & Dreams",
    12: "Spirituality, Subconscious, Endings",
  };

  const pId = chart.personId;
  
  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in animate-slide-in-up">
      <div className="space-y-8">
        <div>
          <h4 className="text-xl font-bold text-white">Core Placements</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <InfoCard title="Sun Sign" content={chart.sunSign.sign} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-astro-sun`} />
            <InfoCard title="Moon Sign" content={chart.moonSign.sign} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-astro-moon`} />
            <InfoCard title="Ascendant" content={chart.ascendant.sign} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-astro-asc`} />
          </div>
          <div className="mt-4 space-y-2 relative">
            <button
              onClick={() => speak(`Sun in ${chart.sunSign.sign}. ${chart.sunSign.description}. Moon in ${chart.moonSign.sign}. ${chart.moonSign.description}. Ascendant in ${chart.ascendant.sign}. ${chart.ascendant.description}`, `${pId}-astro-core-summary`)}
              className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-astro-core-summary` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
              aria-label={currentSpeakingId === `${pId}-astro-core-summary` ? "Stop" : "Listen"}
            >
              {currentSpeakingId === `${pId}-astro-core-summary` ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <p className="text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"><strong>Sun:</strong> {chart.sunSign.description}</p>
            <p className="text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"><strong>Moon:</strong> {chart.moonSign.description}</p>
            <p className="text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"><strong>Ascendant:</strong> {chart.ascendant.description}</p>
          </div>
        </div>
        
        {chart.houses && chart.houses.length > 0 && (
          <div>
            <h4 className="text-xl font-bold text-white">The 12 Houses</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
              {chart.houses.sort((a,b) => a.house - b.house).map(house => (
                <HouseCard key={house.house} house={house} planets={planetsByHouse[house.house] || []} houseKeywords={houseKeywordsMap[house.house]} speak={speak} currentSpeakingId={currentSpeakingId} pId={pId} />
              ))}
            </div>
          </div>
        )}

        {chart.majorAspects.length > 0 && (<div><h4 className="text-xl font-bold text-white">Major Aspects</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">{chart.majorAspects.map((aspect, index) => (<AspectCard key={index} aspect={aspect} speak={speak} currentSpeakingId={currentSpeakingId} uniqueId={`${pId}-astro-aspect-${index}`} />))}</div></div>)}
        
        {chart.overallSummary && (
          <div className="relative">
            <button
              onClick={() => speak(`Overall Chart Summary: ${chart.overallSummary}`, `${pId}-astro-summary`)}
              className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-astro-summary` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
              aria-label={currentSpeakingId === `${pId}-astro-summary` ? "Stop" : "Listen"}
            >
              {currentSpeakingId === `${pId}-astro-summary` ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <h4 className="text-xl font-bold text-white">Overall Chart Summary</h4>
            <p className="mt-2 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{chart.overallSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Synastry Components ---

const SynastryReportCard: React.FC<{ report: SynastryReport; speak: (text: string, id: string) => Promise<void>; currentSpeakingId: string | null; }> = ({ report, speak, currentSpeakingId }) => {
  const rId = report.id;
  const teachId = `${rId}-teach`;
  const learnId = `${rId}-learn`;
  const dynId = `${rId}-dyn`;

  return (
    <div className="glass-card p-6 rounded-xl animate-fade-in animate-slide-in-up">
      <h3 className="text-2xl font-bold text-brand-primary dark:text-indigo-400 mb-4">Synastry: {report.person1.name} & {report.person2.name}</h3>
      <div className="space-y-6">
        <div className="relative">
          <button
            onClick={() => speak(`What ${report.person2.name} Teaches ${report.person1.name}. ${report.childTeachingParent.lessonsForParent}. Advice for ${report.person1.name}: ${report.childTeachingParent.howToEmbrace}`, teachId)}
            className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === teachId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === teachId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === teachId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white pr-8">What {report.person2.name} Teaches {report.person1.name}</h4>
          <p className="mt-2 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.childTeachingParent.lessonsForParent}</p>
          <p className="mt-2 text-brand-accent dark:text-amber-400 font-semibold">Advice for {report.person1.name}:</p>
          <p className="mt-1 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.childTeachingParent.howToEmbrace}</p>
        </div>
        <div className="border-t border-white/10 pt-6 relative">
          <button
            onClick={() => speak(`${report.person2.name}'s Soul Journey. ${report.childLearningJourney.lessonsForChild}. How ${report.person1.name} can support: ${report.childLearningJourney.howToSupport}`, learnId)}
            className={`absolute top-6 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === learnId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === learnId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === learnId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white pr-8">{report.person2.name}'s Soul Journey</h4>
          <p className="mt-2 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.childLearningJourney.lessonsForChild}</p>
          <p className="mt-2 text-brand-accent dark:text-amber-400 font-semibold">How {report.person1.name} can support:</p>
          <p className="mt-1 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.childLearningJourney.howToSupport}</p>
        </div>
        <div className="border-t border-white/10 pt-6 relative">
          <button
            onClick={() => speak(`Overall Relationship Dynamics: ${report.relationshipDynamics}`, dynId)}
            className={`absolute top-6 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === dynId ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === dynId ? "Stop" : "Listen"}
          >
            {currentSpeakingId === dynId ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h4 className="text-xl font-bold text-white pr-8">Overall Relationship Dynamics</h4>
          <p className="mt-2 text-gray-200 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pr-8">{report.relationshipDynamics}</p>
        </div>
      </div>
    </div>
  );
};

const SynastryFilter: React.FC<{ individuals: IndividualBirthData[], onFilterChange: (filters: string[]) => void }> = ({ individuals, onFilterChange }) => {
  const [synastryFilter, setSynastryFilter] = useState<string[]>([]);
  
  const handleFilterToggle = (personId: string) => {
    const newFilter = synastryFilter.includes(personId) ? synastryFilter.filter(id => id !== personId) : [...synastryFilter, personId];
    setSynastryFilter(newFilter);
    onFilterChange(newFilter);
  };

  const clearFilter = () => {
    setSynastryFilter([]);
    onFilterChange([]);
  };

  return (
    <div className="mb-8 glass-card p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-semibold text-gray-800 dark:text-gray-300 mr-2">Filter Reports:</span>
        {individuals.filter(ind => ind.role).map(person => (
           <div key={person.id} className="relative">
              <input type="checkbox" id={`filter-checkbox-${person.id}`} checked={synastryFilter.includes(person.id)} onChange={() => handleFilterToggle(person.id)} className="sr-only peer" />
              <label htmlFor={`filter-checkbox-${person.id}`} className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 cursor-pointer bg-white/30 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-white/20 peer-checked:bg-brand-primary peer-checked:text-white peer-checked:border-brand-primary peer-checked:shadow-lg">{person.name}</label>
            </div>
        ))}
        {synastryFilter.length > 0 && (<button onClick={clearFilter} className="text-sm text-brand-primary dark:text-indigo-400 hover:underline ml-2">Clear Filter</button>)}
      </div>
    </div>
  );
};


// --- Main Display Component ---

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ allReports, individuals, onReset, speak, currentSpeakingId, stopSpeaking }) => {
  const availableTabs = ['Human Design'];
  if (allReports.numerologyReports.length > 0) availableTabs.push('Numerology');
  if (allReports.astrologyCharts.length > 0) availableTabs.push('Astrology');
  if (allReports.synastryReports && allReports.synastryReports.length > 0) availableTabs.push('Synastry');
  if (allReports.dailyGuidanceReports && allReports.dailyGuidanceReports.length > 0) availableTabs.push('Daily Guidance');
  // NEW: Add Life OS tab
  availableTabs.push('Lyfe OS');


  const [activeTab, setActiveTab] = useState(availableTabs[0]);
  const [filteredSynastryReports, setFilteredSynastryReports] = useState(allReports.synastryReports || []);

  const primaryIndividual = individuals.find(ind => ind.role === 'primary') || individuals[0];
  const primaryDailyGuidance = allReports.dailyGuidanceReports?.find(report => report.personId === primaryIndividual.id);

  const handleShare = async () => {
    try {
      // Serialize individuals data to JSON
      const jsonStr = JSON.stringify(individuals);
      
      // Encode Unicode to Base64 safely
      const base64Str = window.btoa(
        encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => 
          String.fromCharCode(parseInt(p1, 16))
        )
      );
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${base64Str}`;
      
      const shareData = {
        title: 'AuraSync Cosmic Reports',
        text: 'Discover your energetic blueprint with AuraSync!',
        url: shareUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (e) {
      console.error('Error sharing:', e);
      alert('Could not share report. Please try again.');
    }
  };

  if (!allReports.humanDesignCharts.length) {
    return (
      <div className="w-full text-center text-red-400 text-xl animate-fade-in glass-card p-8 rounded-lg">
        <p>Could not load the primary Human Design chart. Please try again.</p>
        <button onClick={onReset} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg">New Chart</button>
      </div>
    );
  }

  const handleSynastryFilterChange = (filters: string[]) => {
    const newFilteredReports = (allReports.synastryReports || []).filter(report => {
      if (filters.length === 0) return true;
      return filters.every(filterId => report.person1.id === filterId || report.person2.id === filterId);
    });
    setFilteredSynastryReports(newFilteredReports);
  };
  
  interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }
  const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-semibold text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 ${
        isActive
          ? 'bg-brand-primary text-white shadow-lg'
          : 'text-gray-800 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-black/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-7xl mx-auto animate-slide-in-up">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">
          Cosmic Reports
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="px-4 py-2 bg-white/20 dark:bg-black/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-white/40 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50 transition-colors flex items-center"
          >
            <Share2 size={18} className="mr-2" /> Share
          </button>
          <button onClick={onReset} className="px-4 py-2 bg-white/20 dark:bg-black/20 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-white/40 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50 transition-colors">
            New Reports
          </button>
        </div>
      </div>
      
      <nav className="sticky top-[68px] glass-card z-40 p-2 rounded-xl shadow-lg mb-8 flex justify-center items-center space-x-2">
        {availableTabs.map(tab => (
          <TabButton key={tab} label={tab} isActive={activeTab === tab} onClick={() => setActiveTab(tab)} />
        ))}
      </nav>

      <div className="mt-8">
        {activeTab === 'Human Design' && (
          <div className="space-y-12">
            {allReports.humanDesignCharts.sort((a,b) => {
              const roleA = individuals.find(i=>i.id===a.personId)?.role;
              const roleB = individuals.find(i=>i.id===b.personId)?.role;
              if (roleA === 'primary') return -1;
              if (roleB === 'primary') return 1;
              return 0;
            }).map(chart => (
              <HumanDesignSection key={chart.personId} chart={chart} isPrimary={chart.personId === primaryIndividual.id} speak={speak} currentSpeakingId={currentSpeakingId} />
            ))}
          </div>
        )}

        {activeTab === 'Numerology' && (
          <div className="space-y-12 animate-fade-in">
            {allReports.numerologyReports.map(chart => (
              <div key={chart.personId}>
                <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-6">{chart.name}'s Numerology</h3>
                <NumerologyCard numerology={chart} speak={speak} currentSpeakingId={currentSpeakingId} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Astrology' && (
          <div className="space-y-12 animate-fade-in">
            {allReports.astrologyCharts.map(chart => (
               <div key={chart.personId}>
                <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-6">{chart.name}'s Astrology}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                         <NatalChart chart={chart} speak={speak} currentSpeakingId={currentSpeakingId} />
                    </div>
                    <div className="lg:col-span-2">
                        <AstrologyCard chart={chart} speak={speak} currentSpeakingId={currentSpeakingId} />
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Synastry' && (
          <div className="animate-fade-in">
            <SynastryFilter individuals={individuals} onFilterChange={handleSynastryFilterChange} />
            <div className="space-y-8">
              {filteredSynastryReports.length > 0 ? (
                  filteredSynastryReports.map(report => (
                      <SynastryReportCard key={report.id} report={report} speak={speak} currentSpeakingId={currentSpeakingId} />
                  ))
              ) : (
                <div className="text-center py-8 glass-card rounded-lg">
                  <p className="text-gray-300 dark:text-gray-400">No synastry reports match the current filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Daily Guidance' && primaryDailyGuidance && (
          <div className="space-y-12 animate-fade-in">
            <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-6 text-center">{primaryIndividual.name}'s Daily Guidance}</h3>
            <DailyGuidance report={primaryDailyGuidance} speak={speak} currentSpeakingId={currentSpeakingId} />
          </div>
        )}

        {/* NEW: Life OS Tab Content */}
        {activeTab === 'Lyfe OS' && (
          <div className="animate-fade-in">
            <LifeOSSection
              individuals={individuals}
              allReports={allReports}
              speak={speak} // Pass speak function
              currentSpeakingId={currentSpeakingId} // Pass speaking status ID
              stopSpeaking={stopSpeaking} // Pass stop function
            />
          </div>
        )}
      </div>
    </div>
  );
};
