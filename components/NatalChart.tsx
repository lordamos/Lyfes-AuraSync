
import React, { useState, useMemo, useCallback } from 'react';
import { AstrologyChart, PlanetaryPlacement, AntiscionPlacement, HousePlacement } from '../types';
import { Volume2, VolumeX } from 'lucide-react';

interface NatalChartProps {
  chart: AstrologyChart;
  speak: (text: string, id: string) => Promise<void>; 
  currentSpeakingId: string | null;
}

interface CalculatedPlanet extends PlanetaryPlacement {
  x: number;
  y: number;
  symbol: string;
  absoluteDegree: number;
}

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', element: 'fire', color: '#EF4444' },       // Red
  { name: 'Taurus', symbol: '♉', element: 'earth', color: '#10B981' },     // Green
  { name: 'Gemini', symbol: '♊', element: 'air', color: '#F59E0B' },       // Amber
  { name: 'Cancer', symbol: '♋', element: 'water', color: '#3B82F6' },     // Blue
  { name: 'Leo', symbol: '♌', element: 'fire', color: '#EF4444' },         // Red
  { name: 'Virgo', symbol: '♍', element: 'earth', color: '#10B981' },      // Green
  { name: 'Libra', symbol: '♎', element: 'air', color: '#F59E0B' },        // Amber
  { name: 'Scorpio', symbol: '♏', element: 'water', color: '#3B82F6' },    // Blue
  { name: 'Sagittarius', symbol: '♐', element: 'fire', color: '#EF4444' }, // Red
  { name: 'Capricorn', symbol: '♑', element: 'earth', color: '#10B981' },  // Green
  { name: 'Aquarius', symbol: '♒', element: 'air', color: '#F59E0B' },     // Amber
  { name: 'Pisces', symbol: '♓', element: 'water', color: '#3B82F6' },     // Blue
];

const PLANET_SYMBOLS: { [key: string]: string } = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Chiron: '⚷', Lilith: '⚸', Node: '☊',
};

// SVG Configuration
const VIEWBOX_SIZE = 400;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS_OUTER = 180;
const RADIUS_INNER = 140;
const RADIUS_PLANET = 115;
const RADIUS_ASPECTS = 100;
const RADIUS_ANTISCION = 105;

interface CalculatedAntiscionPlacement extends AntiscionPlacement {
  x: number;
  y: number;
  natalPlanetName: string;
  isAscendantAntiscion?: boolean;
}

export const NatalChart: React.FC<NatalChartProps> = ({ chart, speak, currentSpeakingId }) => {
  const [hoveredPlanet, setHoveredPlanet] = useState<CalculatedPlanet | null>(null);
  const [hoveredAntiscion, setHoveredAntiscion] = useState<CalculatedAntiscionPlacement | null>(null);
  const [activeSign, setActiveSign] = useState<string | null>(null);
  const [hoveredSign, setHoveredSign] = useState<string | null>(null);

  const pId = chart.personId;

  // Helper: Convert Sign Name to Index (0-11)
  const getSignIndex = (signName: string) => {
    return ZODIAC_SIGNS.findIndex(z => signName.toLowerCase().includes(z.name.toLowerCase()));
  };

  // Helper: Parse degree string to float
  const parseDegree = (degreeStr: string) => {
    const match = degreeStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 15;
  };

  // Helper function to get house number containing a zodiac sign
  const getContainingHouseNumber = useCallback((clickedSignName: string) => {
      if (!chart.houses) return null;
      const clickedSignIndex = getSignIndex(clickedSignName);
      if (clickedSignIndex === -1) return null;

      let containingHouseNum: number | null = null;
      for (let i = 0; i < chart.houses.length; i++) {
          const currentHouseCusp = chart.houses[i];
          const nextHouseCusp = chart.houses[(i + 1) % chart.houses.length];

          const currentCuspSignIndex = getSignIndex(currentHouseCusp.sign);
          const nextCuspSignIndex = getSignIndex(nextHouseCusp.sign);

          if (currentCuspSignIndex <= nextCuspSignIndex) {
              if (clickedSignIndex >= currentCuspSignIndex && clickedSignIndex < nextCuspSignIndex) {
                  containingHouseNum = currentHouseCusp.house;
                  break;
              }
          } else { 
              if (clickedSignIndex >= currentCuspSignIndex || clickedSignIndex < nextCuspSignIndex) {
                  containingHouseNum = currentHouseCusp.house;
                  break;
              }
          }
      }
      return containingHouseNum;
  }, [chart.houses]);

  // Determine Ascendant Offset
  const ascendantIndex = getSignIndex(chart.ascendant.sign);
  const ascendantSignStartDegree = ascendantIndex * 30;
  const rotationOffset = 180 - ascendantSignStartDegree;

  // Helper: Polar to Cartesian
  const polarToCartesian = useCallback((centerX: number, centerY: number, radius: number, zodiacDegree: number) => {
    const angleInRadians = ((zodiacDegree + rotationOffset) * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }, [rotationOffset]);

  // Calculate Planet Positions
  const planets = useMemo(() => {
    return chart.planetaryPlacements.map(p => {
      const signIdx = getSignIndex(p.sign);
      if (signIdx === -1) return null;
      
      const degreeWithinSign = parseDegree(p.degree);
      const absoluteDegree = (signIdx * 30) + degreeWithinSign;
      
      const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS_PLANET, absoluteDegree);
      
      return {
        ...p,
        absoluteDegree,
        x, 
        y,
        symbol: PLANET_SYMBOLS[p.planet] || p.planet[0],
      };
    }).filter(Boolean) as CalculatedPlanet[];
  }, [chart, polarToCartesian]);

  // Identify highlighted planets
  const highlightedPlanetsInActiveHouse = useMemo(() => {
    if (!activeSign) return [];
    // Prioritize showing planets in the clicked sign itself if house mapping is ambiguous
    // or if we just want to highlight planets in that visual segment.
    // However, the prompt asks for house-based logic often. Let's stick to the house logic if valid.
    const houseNumber = getContainingHouseNumber(activeSign);
    if (houseNumber !== null) {
        return chart.planetaryPlacements
                    .filter(p => p.house === houseNumber)
                    .map(p => p.planet);
    } else {
        return chart.planetaryPlacements
                    .filter(p => p.sign === activeSign)
                    .map(p => p.planet);
    }
  }, [activeSign, chart.planetaryPlacements, getContainingHouseNumber]);

  // Calculate Antiscions
  const allCalculatedAntiscions = useMemo(() => {
    const calculatedAntiscions: CalculatedAntiscionPlacement[] = [];
    planets.forEach(p => {
        if (p.antiscion) { 
            const signIdx = getSignIndex(p.antiscion.sign);
            const degreeWithinSign = parseDegree(p.antiscion.degree);
            const absoluteDegree = (signIdx * 30) + degreeWithinSign;
            const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS_ANTISCION, absoluteDegree);
            calculatedAntiscions.push({ ...p.antiscion, x, y, natalPlanetName: p.planet });
        }
    });
    if (chart.ascendant.antiscion) {
        const signIdx = getSignIndex(chart.ascendant.antiscion.sign);
        const degreeWithinSign = parseDegree(chart.ascendant.antiscion.degree);
        const absoluteDegree = (signIdx * 30) + degreeWithinSign;
        const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS_ANTISCION, absoluteDegree);
        calculatedAntiscions.push({ ...chart.ascendant.antiscion, x, y, natalPlanetName: 'Ascendant', isAscendantAntiscion: true });
    }
    return calculatedAntiscions;
  }, [chart.planetaryPlacements, chart.ascendant, polarToCartesian, planets]);

  // Aspect Lines
  const aspects = useMemo(() => {
    return chart.majorAspects.map(aspect => {
      const p1 = planets.find(p => p.planet === aspect.planet1);
      const p2 = planets.find(p => p.planet === aspect.planet2);
      if (!p1 || !p2) return null;
      
      const type = aspect.type.toLowerCase();
      let color = 'stroke-purple-400/30 dark:stroke-purple-300/30';
      if (type.includes('square') || type.includes('opposition')) {
          color = 'stroke-red-500/50 dark:stroke-red-400/50';
      } else if (type.includes('trine') || type.includes('sextile')) {
          color = 'stroke-blue-500/50 dark:stroke-blue-400/50';
      }
      return { ...aspect, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color };
    }).filter(Boolean);
  }, [chart, planets]);

  // Active House/Sign Data
  const activeHouseData = useMemo(() => {
    if (!activeSign) return null;

    let description = `The energy of ${activeSign}.`;
    // Fallback descriptions from chart if not found in house
    if (chart.sunSign.sign === activeSign) description = `Sun Sign: ${chart.sunSign.description}`;
    else if (chart.moonSign.sign === activeSign) description = `Moon Sign: ${chart.moonSign.description}`;
    else if (chart.ascendant.sign === activeSign) description = `Ascendant Sign: ${chart.ascendant.description}`;

    const houseNumber = getContainingHouseNumber(activeSign);
    const signInfo = ZODIAC_SIGNS.find(z => z.name === activeSign);

    if (houseNumber !== null) { 
        const house = chart.houses.find(h => h.house === houseNumber);
        if (house) {
            const planetsInHouse = chart.planetaryPlacements.filter(p => p.house === house.house);
            return { type: 'house', data: house, planets: planetsInHouse, signInfo };
        }
    }
    
    const planetsInSign = chart.planetaryPlacements.filter(p => p.sign === activeSign);
    return { type: 'sign', data: { name: activeSign, description }, planets: planetsInSign, signInfo };
  }, [activeSign, chart, getContainingHouseNumber]);

  const handleSignClick = (signName: string) => {
    setActiveSign(prev => prev === signName ? null : signName);
  };

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto animate-fade-in select-none">
      {chart.overallSummary && !activeSign && (
        <div className="glass-card p-4 rounded-lg mb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed shadow-lg relative">
          <button
            onClick={() => speak(`Overall Chart Summary. ${chart.overallSummary}`, `${pId}-natal-summary`)}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-natal-summary` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === `${pId}-natal-summary` ? "Stop" : "Listen to overall chart summary"}
          >
            {currentSpeakingId === `${pId}-natal-summary` ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h3 className="font-bold text-brand-primary dark:text-indigo-400 mb-2 pr-8">Overall Chart Summary</h3>
          <p className="pr-8">{chart.overallSummary}</p>
        </div>
      )}

      {chart.ascendant && !activeSign && (
        <div className="glass-card p-4 rounded-lg mb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed shadow-lg relative">
          <button
            onClick={() => speak(`Ascendant in ${chart.ascendant.sign}. ${chart.ascendant.description}`, `${pId}-natal-asc`)}
            className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-natal-asc` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
            aria-label={currentSpeakingId === `${pId}-natal-asc` ? "Stop" : `Listen to Ascendant`}
          >
            {currentSpeakingId === `${pId}-natal-asc` ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <h3 className="font-bold text-brand-primary dark:text-indigo-400 mb-2 pr-8">Ascendant ({chart.ascendant.sign})</h3>
          <p className="pr-8">{chart.ascendant.description}</p>
        </div>
      )}
      
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full h-full drop-shadow-xl">
        <title>Interactive Natal Chart for {chart.name}</title>
        
        {/* Background */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS_OUTER} className="fill-white/10 dark:fill-black/20 backdrop-blur-sm" />
        
        {/* Zodiac Ring Segments */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startAngle = i * 30;
          const endAngle = (i + 1) * 30;
          
          const p1 = polarToCartesian(CENTER, CENTER, RADIUS_OUTER, endAngle);
          const p2 = polarToCartesian(CENTER, CENTER, RADIUS_OUTER, startAngle);
          const p3 = polarToCartesian(CENTER, CENTER, RADIUS_INNER, startAngle);
          const p4 = polarToCartesian(CENTER, CENTER, RADIUS_INNER, endAngle);
          
          const pathData = `M ${p1.x} ${p1.y} A ${RADIUS_OUTER} ${RADIUS_OUTER} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${RADIUS_INNER} ${RADIUS_INNER} 0 0 1 ${p4.x} ${p4.y} Z`;
          const midAngle = startAngle + 15;
          const symbolPos = polarToCartesian(CENTER, CENTER, (RADIUS_OUTER + RADIUS_INNER) / 2, midAngle);
          const isActive = activeSign === sign.name;

          return (
            <g 
                key={sign.name} 
                className="group cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.01] origin-center"
                onClick={(e) => { e.stopPropagation(); handleSignClick(sign.name); }}
                onMouseEnter={() => setHoveredSign(sign.name)}
                onMouseLeave={() => setHoveredSign(null)}
            >
              <path 
                d={pathData} 
                fill={sign.color} 
                className={`transition-all duration-300 ${isActive ? 'opacity-100 stroke-white stroke-2' : 'opacity-20 stroke-white/10 stroke-[0.5] group-hover:opacity-40'}`}
                style={{ filter: isActive ? `drop-shadow(0 0 10px ${sign.color})` : 'none' }}
              />
              <text 
                x={symbolPos.x} 
                y={symbolPos.y} 
                dy="0.35em" 
                textAnchor="middle" 
                className={`text-lg font-bold pointer-events-none transition-colors duration-300 ${isActive ? 'fill-white' : 'fill-gray-800 dark:fill-white'}`}
                style={{ fontSize: '18px' }}
              >
                {sign.symbol}
              </text>
            </g>
          );
        })}

        {/* House Lines */}
        {[...Array(12)].map((_, i) => {
           const angle = i * 30;
           const start = polarToCartesian(CENTER, CENTER, RADIUS_INNER, angle);
           const end = polarToCartesian(CENTER, CENTER, RADIUS_ASPECTS - 40, angle); 
           return <line key={`house-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-white/20 stroke-1" />;
        })}

        {/* Aspect Lines */}
        <g className={`transition-opacity duration-500 ${activeSign ? 'opacity-10' : 'opacity-100'}`}>
            {aspects.map((aspect, i) => (
                aspect && <line key={`aspect-${i}`} x1={aspect.x1} y1={aspect.y1} x2={aspect.x2} y2={aspect.y2} className={`${aspect.color} stroke-1`} />
            ))}
        </g>

        {/* Ascendant Marker */}
        <line x1={CENTER} y1={CENTER} x2={CENTER - RADIUS_OUTER - 10} y2={CENTER} className="stroke-brand-primary dark:stroke-indigo-400 stroke-2" />
        <text x={CENTER - RADIUS_OUTER - 15} y={CENTER} dy="0.3em" textAnchor="end" className="fill-brand-primary dark:fill-indigo-400 font-bold text-xs">AC</text>

        {/* Planets */}
        <g>
            {planets.map((planet, i) => {
                const isHighlightedInActiveHouse = highlightedPlanetsInActiveHouse.includes(planet.planet);
                const isDimmedByActiveSign = activeSign !== null && !isHighlightedInActiveHouse;

                return (
                    <g 
                        key={i} 
                        className={`cursor-pointer transition-all origin-center duration-300 
                                    ${isDimmedByActiveSign ? 'opacity-20 blur-[1px]' : 'opacity-100'}
                                    ${isHighlightedInActiveHouse ? 'scale-[1.15]' : ''}
                                    `}
                        onMouseEnter={() => setHoveredPlanet(planet)}
                        onMouseLeave={() => setHoveredPlanet(null)}
                    >
                        <circle 
                            cx={planet.x} cy={planet.y} r="10" 
                            className={`fill-white dark:fill-gray-900 stroke-brand-primary dark:stroke-indigo-400 stroke-2 ${isHighlightedInActiveHouse ? 'fill-indigo-100 dark:fill-indigo-900 stroke-brand-accent' : 'drop-shadow-md'}`} 
                        />
                        <text x={planet.x} y={planet.y} dy="0.35em" textAnchor="middle" className="text-xs fill-brand-dark dark:fill-white font-bold pointer-events-none select-none">
                            {planet.symbol}
                        </text>
                    </g>
                );
            })}
        </g>

        {/* Antiscions */}
        <g id="antiscions-group" className={`${activeSign ? 'opacity-20' : 'opacity-100'} transition-opacity`}>
          {allCalculatedAntiscions.map((antiscion, i) => {
            const natalPlanet = planets.find(p => p.planet === antiscion.natalPlanetName);
            const ascendantNatalPoint = polarToCartesian(CENTER, CENTER, RADIUS_PLANET, 0 - rotationOffset + 180); 
            const startX = antiscion.isAscendantAntiscion ? ascendantNatalPoint.x : (natalPlanet?.x || 0);
            const startY = antiscion.isAscendantAntiscion ? ascendantNatalPoint.y : (natalPlanet?.y || 0);

            return (
              <React.Fragment key={`antiscion-${i}`}>
                <line x1={startX} y1={startY} x2={antiscion.x} y2={antiscion.y} className="stroke-gray-500 dark:stroke-gray-400 stroke-[0.5]" strokeDasharray="2 2" />
                <g className="cursor-pointer transition-transform hover:scale-110 origin-center duration-300" onMouseEnter={() => setHoveredAntiscion(antiscion)} onMouseLeave={() => setHoveredAntiscion(null)}>
                  <circle cx={antiscion.x} cy={antiscion.y} r="8" className="fill-transparent stroke-gray-500 dark:stroke-gray-400 stroke-1.5" strokeDasharray="2 2" />
                  <text x={antiscion.x} y={antiscion.y} dy="0.35em" textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-300 font-bold pointer-events-none select-none">
                    {antiscion.isAscendantAntiscion ? 'AcA' : `(${PLANET_SYMBOLS[antiscion.natalPlanetName || ''] || antiscion.natalPlanetName?.substring(0,1)})`}
                  </text>
                </g>
              </React.Fragment>
            );
          })}
        </g>

        {/* Center Info Overlay */}
        <foreignObject x={CENTER - 100} y={CENTER - 100} width={200} height={200} className={`transition-all duration-500 ease-out ${activeSign ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
            <div className="w-full h-full flex flex-col p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full shadow-2xl border-2 border-brand-primary/20 text-center overflow-hidden">
                {activeHouseData && (
                    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-1 items-center">
                        <div className="shrink-0 mb-2 flex flex-col items-center w-full">
                             <div className="text-5xl mb-2 drop-shadow-sm transition-transform hover:scale-110" style={{ color: activeHouseData.signInfo?.color }}>
                                {activeHouseData.signInfo?.symbol}
                            </div>
                             <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold text-white shadow-sm tracking-wider" style={{ backgroundColor: activeHouseData.signInfo?.color }}>
                                    {activeHouseData.signInfo?.element}
                                </span>
                             </div>
                            <h4 className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                                {activeHouseData.type === 'house' ? `${(activeHouseData.data as any).house}. House` : 'Zodiac Sign'}
                            </h4>
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
                                {activeHouseData.type === 'house' ? (activeHouseData.data as HousePlacement).sign : (activeHouseData.data as { name: string }).name}
                            </h3>
                        </div>
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 mb-4 leading-relaxed font-medium text-center relative pr-8">
                            <button
                                onClick={() => speak(`House ${(activeHouseData.data as any).house || activeHouseData.data.name}. ${activeHouseData.data.description}`, `${pId}-active-house`)}
                                className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-active-house` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                                aria-label="Listen"
                            >
                                {currentSpeakingId === `${pId}-active-house` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            {activeHouseData.data.description}
                        </div>
                        <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent pt-2 mt-auto w-full">
                            <button onClick={(e) => { e.stopPropagation(); setActiveSign(null); }} className="w-full text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider py-1">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </foreignObject>
      </svg>
      
      {/* Hover Tooltips */}
      {hoveredPlanet && !activeSign && !hoveredAntiscion && (
         <div className="absolute bg-gray-900/95 text-white text-xs px-4 py-3 rounded-xl pointer-events-none z-10 backdrop-blur-md border border-white/10 shadow-2xl" style={{ left: hoveredPlanet.x + 20, top: hoveredPlanet.y - 10, transform: 'translateY(-100%)' }}>
            <div className="text-center min-w-[150px] relative">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xl text-brand-primary dark:text-indigo-400">{PLANET_SYMBOLS[hoveredPlanet.planet]}</span>
                    <span className="font-bold text-lg text-white">{hoveredPlanet.planet}</span>
                </div>
                <div className="text-sm font-medium text-gray-200">{hoveredPlanet.sign} {hoveredPlanet.degree}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">House {hoveredPlanet.house}</div>
            </div>
         </div>
      )}

      {hoveredSign && !activeSign && !hoveredPlanet && !hoveredAntiscion && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 text-white text-xs px-4 py-3 rounded-xl pointer-events-none z-20 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col items-center">
            <div className="font-bold text-lg">{hoveredSign}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Tap for details</div>
        </div>
      )}

      {!activeSign && <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 animate-pulse">Tap a Zodiac segment to reveal house insights</div>}
    </div>
  );
};
