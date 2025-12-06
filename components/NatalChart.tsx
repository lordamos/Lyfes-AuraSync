
import React, { useState, useMemo, useCallback } from 'react';
import { AstrologyChart, PlanetaryPlacement, AntiscionPlacement, HousePlacement } from '../types';
import { Volume2, VolumeX } from 'lucide-react'; // Import lucide icons

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
const RADIUS_ANTISCION = 105; // Slightly different radius for visual separation of antiscions

interface CalculatedAntiscionPlacement extends AntiscionPlacement {
  x: number;
  y: number;
  natalPlanetName: string; // To link back to its natal planet
  isAscendantAntiscion?: boolean; // To identify Ascendant's antiscion
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

  // Helper: Parse degree string (e.g. "15° 30'") to float
  const parseDegree = (degreeStr: string) => {
    const match = degreeStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 15; // default to middle if parsing fails
  };

  // Helper function to get house number containing a zodiac sign (by sign index)
  // This assumes chart.houses is ordered by house number 1-12
  const getContainingHouseNumber = useCallback((clickedSignName: string) => {
      const clickedSignIndex = getSignIndex(clickedSignName);
      if (clickedSignIndex === -1) return null;

      let containingHouseNum: number | null = null;
      // Iterate through the houses based on their natural order 1-12
      for (let i = 0; i < chart.houses.length; i++) {
          const currentHouseCusp = chart.houses[i];
          // The next house's cusp defines the end of the current house's domain
          const nextHouseCusp = chart.houses[(i + 1) % chart.houses.length]; // Wrap around for house 12

          const currentCuspSignIndex = getSignIndex(currentHouseCusp.sign);
          const nextCuspSignIndex = getSignIndex(nextHouseCusp.sign);

          // Case 1: Standard progression (e.g., Aries cusp -> Taurus cusp)
          if (currentCuspSignIndex <= nextCuspSignIndex) {
              if (clickedSignIndex >= currentCuspSignIndex && clickedSignIndex < nextCuspSignIndex) {
                  containingHouseNum = currentHouseCusp.house;
                  break;
              }
          } else { // Case 2: Wrap-around (e.g., Sagittarius cusp -> Pisces cusp, crossing Capricorn/Aquarius)
              // House spans from currentCuspSignIndex to 11 (end of zodiac), AND from 0 to nextCuspSignIndex
              if (clickedSignIndex >= currentCuspSignIndex || clickedSignIndex < nextCuspSignIndex) {
                  containingHouseNum = currentHouseCusp.house;
                  break;
              }
          }
      }
      return containingHouseNum;
  }, [chart.houses]);

  // 1. Determine Ascendant Offset to rotate chart (Ascendant at 9 o'clock / 180deg)
  const ascendantIndex = getSignIndex(chart.ascendant.sign);
  const ascendantSignStartDegree = ascendantIndex * 30;
  // Rotation offset to place Ascendant at 9 o'clock (180 degrees in SVG coordinate system)
  const rotationOffset = 180 - ascendantSignStartDegree;

  // Helper: Polar to Cartesian (takes un-rotated zodiac degree and applies chart rotation)
  const polarToCartesian = useCallback((centerX: number, centerY: number, radius: number, zodiacDegree: number) => {
    const angleInRadians = ((zodiacDegree + rotationOffset) * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }, [rotationOffset]);

  // 2. Calculate Planet Positions
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

  // NEW: Identify planets that should be highlighted when a house segment is active
  const highlightedPlanetsInActiveHouse = useMemo(() => {
    if (!activeSign) return [];
    const houseNumber = getContainingHouseNumber(activeSign);
    if (houseNumber !== null) {
        return chart.planetaryPlacements
                    .filter(p => p.house === houseNumber)
                    .map(p => p.planet); // Return an array of planet names
    } else {
        return [];
    }
  }, [activeSign, chart.planetaryPlacements, getContainingHouseNumber]);


  // 3. Calculate and Position Antiscions
  const allCalculatedAntiscions = useMemo(() => {
    const calculatedAntiscions: CalculatedAntiscionPlacement[] = [];

    // Antiscions for Planets
    planets.forEach(p => {
        if (p.antiscion) { 
            const signIdx = getSignIndex(p.antiscion.sign);
            const degreeWithinSign = parseDegree(p.antiscion.degree);
            const absoluteDegree = (signIdx * 30) + degreeWithinSign;
            
            const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS_ANTISCION, absoluteDegree);

            calculatedAntiscions.push({
                ...p.antiscion,
                x,
                y,
                natalPlanetName: p.planet,
            });
        }
    });

    // Antiscion for Ascendant
    if (chart.ascendant.antiscion) {
        const signIdx = getSignIndex(chart.ascendant.antiscion.sign);
        const degreeWithinSign = parseDegree(chart.ascendant.antiscion.degree);
        const absoluteDegree = (signIdx * 30) + degreeWithinSign;
        
        const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS_ANTISCION, absoluteDegree);

        calculatedAntiscions.push({
            ...chart.ascendant.antiscion,
            x,
            y,
            natalPlanetName: 'Ascendant',
            isAscendantAntiscion: true,
        });
    }
    return calculatedAntiscions;
  }, [chart.planetaryPlacements, chart.ascendant, polarToCartesian, planets]);


  // 4. Aspect Lines
  const aspects = useMemo(() => {
    return chart.majorAspects.map(aspect => {
      const p1 = planets.find(p => p.planet === aspect.planet1);
      const p2 = planets.find(p => p.planet === aspect.planet2);
      if (!p1 || !p2) return null;
      
      const type = aspect.type.toLowerCase();
      let color = 'stroke-purple-400/30 dark:stroke-purple-300/30'; // Default/Conjunction
      
      // Challenging: Squares (90°) and Oppositions (180°) - typically Red
      if (type.includes('square') || type.includes('opposition')) {
          color = 'stroke-red-500/50 dark:stroke-red-400/50';
      } 
      // Harmonious: Trines (120°) and Sextiles (60°) - typically Blue
      else if (type.includes('trine') || type.includes('sextile')) {
          color = 'stroke-blue-500/50 dark:stroke-blue-400/50';
      }
      
      return { ...aspect, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color };
    }).filter(Boolean);
  }, [chart, planets]);

  // 5. Active House Data
  const activeHouseData = useMemo(() => {
    if (!activeSign) return null;

    const houseNumber = getContainingHouseNumber(activeSign);
    
    if (houseNumber !== null) { // Found a containing house
        const house = chart.houses.find(h => h.house === houseNumber);
        const signInfo = ZODIAC_SIGNS.find(z => z.name === activeSign);
        if (house) {
            const planetsInHouse = chart.planetaryPlacements.filter(p => p.house === house.house);
            return { type: 'house', data: house, planets: planetsInHouse, signInfo };
        }
    }
    // Fallback if no containing house found or house object not found (shouldn't happen for valid houseNumber)
    const planetsInSign = chart.planetaryPlacements.filter(p => p.sign === activeSign);
    const signInfo = ZODIAC_SIGNS.find(z => z.name === activeSign);
    return { type: 'sign', data: { name: activeSign, description: `Energy of ${activeSign}` }, planets: planetsInSign, signInfo };
  }, [activeSign, chart.houses, chart.planetaryPlacements, getContainingHouseNumber]);


  const handleSignClick = (signName: string) => {
    if (activeSign === signName) {
        setActiveSign(null);
    } else {
        setActiveSign(signName);
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto animate-fade-in select-none">
      {chart.overallSummary && (
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

      {/* NEW: Ascendant Description */}
      {chart.ascendant && (
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
        <desc>Displays planetary placements, house cusps, and aspects for {chart.name}'s birth chart. Click on zodiac segments for house descriptions.</desc>
        
        {/* Background Circle */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS_OUTER} className="fill-white/10 dark:fill-black/20 backdrop-blur-sm" />
        
        {/* Zodiac Ring Segments */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startAngle = i * 30;
          const endAngle = (i + 1) * 30;
          
          // Segment Path
          const p1 = polarToCartesian(CENTER, CENTER, RADIUS_OUTER, endAngle);
          const p2 = polarToCartesian(CENTER, CENTER, RADIUS_OUTER, startAngle);
          const p3 = polarToCartesian(CENTER, CENTER, RADIUS_INNER, startAngle);
          const p4 = polarToCartesian(CENTER, CENTER, RADIUS_INNER, endAngle);
          
          const pathData = `
            M ${p1.x} ${p1.y}
            A ${RADIUS_OUTER} ${RADIUS_OUTER} 0 0 0 ${p2.x} ${p2.y}
            L ${p3.x} ${p3.y}
            A ${RADIUS_INNER} ${RADIUS_INNER} 0 0 1 ${p4.x} ${p4.y}
            Z
          `;

          const midAngle = startAngle + 15;
          const symbolPos = polarToCartesian(CENTER, CENTER, (RADIUS_OUTER + RADIUS_INNER) / 2, midAngle);
          
          const isActive = activeSign === sign.name;

          return (
            <g 
                key={sign.name} 
                className="group cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleSignClick(sign.name); }}
                onMouseEnter={() => setHoveredSign(sign.name)}
                onMouseLeave={() => setHoveredSign(null)}
            >
              <path 
                d={pathData} 
                fill={sign.color} 
                className={`transition-all duration-300 stroke-white/10 stroke-[0.5] ${isActive ? 'opacity-90' : 'opacity-20 group-hover:opacity-40'}`}
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

        {/* House Lines (Inner) */}
        {[...Array(12)].map((_, i) => {
           const angle = i * 30;
           const start = polarToCartesian(CENTER, CENTER, RADIUS_INNER, angle);
           const end = polarToCartesian(CENTER, CENTER, RADIUS_ASPECTS - 40, angle); 
           return <line key={`house-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="stroke-white/20 stroke-1" />;
        })}

        {/* Aspect Lines (Fade out when Active) */}
        <g className={`transition-opacity duration-500 ${activeSign ? 'opacity-5' : 'opacity-100'}`}>
            {aspects.map((aspect, i) => (
                aspect && <line 
                    key={`aspect-${i}`} 
                    x1={aspect.x1} y1={aspect.y1} 
                    x2={aspect.x2} y2={aspect.y2} 
                    className={`${aspect.color} stroke-1`} 
                />
            ))}
        </g>

        {/* Ascendant Marker */}
        <line 
            x1={CENTER} y1={CENTER} 
            x2={CENTER - RADIUS_OUTER - 10} y2={CENTER} 
            className="stroke-brand-primary dark:stroke-indigo-400 stroke-2" 
            markerEnd="url(#arrow)"
        />
        <text x={CENTER - RADIUS_OUTER - 15} y={CENTER} dy="0.3em" textAnchor="end" className="fill-brand-primary dark:fill-indigo-400 font-bold text-xs">AC</text>

        {/* Planets */}
        <g>
            {planets.map((planet, i) => {
                const isHighlightedInActiveHouse = highlightedPlanetsInActiveHouse.includes(planet.planet);
                // A planet is dimmed if a sign is active AND this planet is NOT highlighted in the active house
                const isDimmedByActiveSign = activeSign !== null && !isHighlightedInActiveHouse;

                return (
                    <g 
                        key={i} 
                        className={`cursor-pointer transition-transform origin-center duration-300 
                                    ${isDimmedByActiveSign ? 'opacity-20 blur-[1px]' : 'opacity-100'}
                                    ${isHighlightedInActiveHouse ? 'scale-[1.05]' : ''}
                                    `}
                        style={{
                            filter: isHighlightedInActiveHouse 
                                ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6)) drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))' /* Amber/Accent, Indigo/Primary subtle glow */
                                : 'none'
                        }}
                        onMouseEnter={() => setHoveredPlanet(planet)} // Pass full planet object
                        onMouseLeave={() => setHoveredPlanet(null)}
                    >
                        <circle 
                            cx={planet.x} cy={planet.y} r="10" 
                            className={`fill-white dark:fill-gray-900 stroke-brand-primary dark:stroke-indigo-400 stroke-2 
                                ${isHighlightedInActiveHouse ? 'fill-opacity-80' : 'drop-shadow-md'}`} 
                        />
                        <text x={planet.x} y={planet.y} dy="0.35em" textAnchor="middle" className="text-xs fill-brand-dark dark:fill-white font-bold pointer-events-none select-none">
                            {planet.symbol}
                        </text>
                    </g>
                );
            })}
        </g>

        {/* Antiscion Points and Lines */}
        <g id="antiscions-group">
          {allCalculatedAntiscions.map((antiscion, i) => {
            // Find the natal planet for this antiscion (if it's not the Ascendant)
            const natalPlanet = planets.find(p => p.planet === antiscion.natalPlanetName);
            const ascendantNatalPoint = polarToCartesian(CENTER, CENTER, RADIUS_PLANET, 0 - rotationOffset + 180); // Corrected ASC point

            const startX = antiscion.isAscendantAntiscion ? ascendantNatalPoint.x : (natalPlanet?.x || 0);
            const startY = antiscion.isAscendantAntiscion ? ascendantNatalPoint.y : (natalPlanet?.y || 0);

            return (
              <React.Fragment key={`antiscion-${i}`}>
                {/* Antiscion Line */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={antiscion.x}
                  y2={antiscion.y}
                  className="stroke-gray-500 dark:stroke-gray-400 stroke-[0.5]"
                  strokeDasharray="2 2"
                />
                {/* Antiscion Point */}
                <g
                  className="cursor-pointer transition-transform hover:scale-110 origin-center duration-300"
                  onMouseEnter={() => setHoveredAntiscion(antiscion)}
                  onMouseLeave={() => setHoveredAntiscion(null)}
                >
                  <circle cx={antiscion.x} cy={antiscion.y} r="8" className="fill-transparent stroke-gray-500 dark:stroke-gray-400 stroke-1.5" strokeDasharray="2 2" />
                  <text
                    x={antiscion.x}
                    y={antiscion.y}
                    dy="0.35em"
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-300 font-bold pointer-events-none select-none"
                  >
                    {antiscion.isAscendantAntiscion ? 'AcA' : `(${PLANET_SYMBOLS[antiscion.natalPlanetName || ''] || antiscion.natalPlanetName?.substring(0,1)})`}
                  </text>
                </g>
              </React.Fragment>
            );
          })}
        </g>


        {/* Center Decor / Info Overlay */}
        <circle 
            cx={CENTER} cy={CENTER} r={RADIUS_INNER - 4} 
            className={`fill-transparent transition-all duration-300 ${activeSign ? 'stroke-brand-primary/20 stroke-2' : ''}`} 
        />
        
        {/* Detail View in Center - Activated when a zodiac segment is clicked */}
        <foreignObject 
            x={CENTER - 100} 
            y={CENTER - 100} 
            width={200} 
            height={200}
            className={`transition-all duration-500 ease-out ${activeSign ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
        >
            <div className="w-full h-full flex flex-col p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full shadow-2xl border-2 border-brand-primary/20 text-center overflow-hidden">
                {activeHouseData && (
                    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-1 items-center">
                        <div className="shrink-0 mb-2 flex flex-col items-center w-full">
                            
                            {/* Displays the zodiac sign symbol */}
                             <div className="text-5xl mb-2 drop-shadow-sm transition-transform hover:scale-110" style={{ color: activeHouseData.signInfo?.color }}>
                                {activeHouseData.signInfo?.symbol}
                            </div>
                            
                            {/* Displays the zodiac sign element */}
                             <div className="flex items-center justify-center gap-2 mb-2">
                                <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold text-white shadow-sm tracking-wider"
                                    style={{ backgroundColor: activeHouseData.signInfo?.color }}
                                >
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
                        
                        {/* Displays the house description when a house segment is clicked */}
                        <div className="text-[11px] text-gray-700 dark:text-gray-300 mb-4 leading-relaxed font-medium text-center relative pr-8">
                            <button
                                onClick={() => speak(`House ${activeHouseData.data.house} in ${activeHouseData.data.sign}. ${activeHouseData.data.description}`, `${pId}-active-house`)}
                                className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-active-house` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                                aria-label={currentSpeakingId === `${pId}-active-house` ? "Stop" : `Listen to House ${activeHouseData.data.house}`}
                            >
                                {currentSpeakingId === `${pId}-active-house` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            {activeHouseData.data.description}
                        </div>

                        {activeHouseData.planets.length > 0 ? (
                            <div className="w-full mt-auto border-t border-gray-200 dark:border-gray-700 pt-3 text-left">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mb-2 uppercase tracking-wide text-center">Planets Here</span>
                                <div className="space-y-2">
                                    {activeHouseData.planets.map(p => (
                                        <div key={p.planet} className="bg-brand-primary/5 dark:bg-indigo-900/30 p-2 rounded-lg border border-brand-primary/10 relative">
                                            <button
                                                onClick={() => speak(`${p.planet} in this house: ${p.description}`, `${pId}-active-house-p-${p.planet}`)}
                                                className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-active-house-p-${p.planet}` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                                                aria-label={currentSpeakingId === `${pId}-active-house-p-${p.planet}` ? "Stop" : `Listen to ${p.planet}`}
                                            >
                                                {currentSpeakingId === `${pId}-active-house-p-${p.planet}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                            </button>
                                            <div className="flex items-center justify-between mb-1 pr-8">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs">{PLANET_SYMBOLS[p.planet]}</span>
                                                    <span className="font-bold text-brand-primary dark:text-indigo-400 text-[10px]">{p.planet}</span>
                                                </div>
                                                <span className="text-[9px] text-gray-500">{p.degree}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-600 dark:text-gray-300 leading-normal pr-8">
                                                {p.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                             <div className="mt-auto pt-2 text-center pb-2">
                                <span className="text-[10px] text-gray-400 italic">Empty House</span>
                             </div>
                        )}
                        
                        <div className="sticky bottom-0 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent pt-2 mt-auto w-full">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveSign(null); }}
                                className="w-full text-[10px] font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider py-1"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </foreignObject>

      </svg>
      
      {/* Tooltip for Planets (Only show if no house or antiscion active) */}
      {hoveredPlanet && !activeSign && !hoveredAntiscion && (
         <div 
            className="absolute bg-gray-900/95 text-white text-xs px-4 py-3 rounded-xl pointer-events-none z-10 backdrop-blur-md border border-white/10 shadow-2xl"
            style={{
              left: hoveredPlanet.x + 20, // Adjust position relative to planet
              top: hoveredPlanet.y - 10,  // Adjust position relative to planet
              transform: 'translateY(-100%)' // Move tooltip above the cursor
            }}
         >
            <div className="text-center min-w-[150px] relative">
                <button
                    onClick={() => speak(`${hoveredPlanet.planet} in ${hoveredPlanet.sign} at ${hoveredPlanet.degree} in House ${hoveredPlanet.house}. ${hoveredPlanet.description}`, `${pId}-planet-tooltip-${hoveredPlanet.planet}`)}
                    className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-planet-tooltip-${hoveredPlanet.planet}` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                    aria-label={currentSpeakingId === `${pId}-planet-tooltip-${hoveredPlanet.planet}` ? "Stop" : `Listen to ${hoveredPlanet.planet} details`}
                >
                    {currentSpeakingId === `${pId}-planet-tooltip-${hoveredPlanet.planet}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <div className="flex items-center justify-center gap-2 mb-1 pr-8">
                    <span className="text-xl text-brand-primary dark:text-indigo-400">{PLANET_SYMBOLS[hoveredPlanet.planet]}</span>
                    <span className="font-bold text-lg text-white">{hoveredPlanet.planet}</span>
                </div>
                <div className="text-sm font-medium text-gray-200">{hoveredPlanet.sign} {hoveredPlanet.degree}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">House {hoveredPlanet.house}</div>
                {/* Displays personalized planet description from the API response */}
                {hoveredPlanet.description && (
                    <p className="text-[10px] text-gray-400 mt-2 leading-tight italic pr-8">
                        {hoveredPlanet.description}
                    </p>
                )}
                {/* Displays Antiscion details, including its description, within the planet's tooltip */}
                {hoveredPlanet.antiscion && (
                  <div className="mt-3 pt-2 border-t border-gray-700/50 relative">
                     <button
                        onClick={() => speak(`Antiscion of ${hoveredPlanet.planet} in ${hoveredPlanet.antiscion?.sign} at ${hoveredPlanet.antiscion?.degree} in House ${hoveredPlanet.antiscion?.house}. ${hoveredPlanet.antiscion?.description}`, `${pId}-planet-anti-${hoveredPlanet.planet}`)}
                        className={`absolute top-2 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-planet-anti-${hoveredPlanet.planet}` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                        aria-label={currentSpeakingId === `${pId}-planet-anti-${hoveredPlanet.planet}` ? "Stop" : `Listen to Antiscion`}
                    >
                        {currentSpeakingId === `${pId}-planet-anti-${hoveredPlanet.planet}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <div className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-1 pr-8">Antiscion ({PLANET_SYMBOLS[hoveredPlanet.planet]})</div>
                    <div className="text-sm font-medium text-gray-200">{hoveredPlanet.antiscion.sign} {hoveredPlanet.antiscion.degree}</div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">House {hoveredPlanet.antiscion.house}</div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-tight italic pr-8">{hoveredPlanet.antiscion.description}</p>
                  </div>
                )}
            </div>
         </div>
      )}

      {/* NEW: Tooltip for Antiscions (Only show if no house active and no natal planet hovered) */}
      {hoveredAntiscion && !activeSign && !hoveredPlanet && (
        <div
            className="absolute bg-gray-900/95 text-white text-xs px-4 py-3 rounded-xl pointer-events-none z-10 backdrop-blur-md border border-white/10 shadow-2xl"
            style={{
              left: hoveredAntiscion.x + 20,
              top: hoveredAntiscion.y - 10,
              transform: 'translateY(-100%)'
            }}
        >
            <div className="text-center min-w-[150px] relative">
                <button
                    onClick={() => speak(`Antiscion of ${hoveredAntiscion.natalPlanetName} in ${hoveredAntiscion.antiscion.sign} at ${hoveredAntiscion.antiscion.degree} in House ${hoveredAntiscion.antiscion.house}. ${hoveredAntiscion.antiscion.description}`, `${pId}-anti-only-${hoveredAntiscion.natalPlanetName}`)}
                    className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `${pId}-anti-only-${hoveredAntiscion.natalPlanetName}` ? 'text-brand-accent animate-pulse' : 'text-gray-500 hover:text-brand-primary dark:hover:text-indigo-400'}`}
                    aria-label={currentSpeakingId === `${pId}-anti-only-${hoveredAntiscion.natalPlanetName}` ? "Stop" : `Listen to Antiscion`}
                >
                    {currentSpeakingId === `${pId}-anti-only-${hoveredAntiscion.natalPlanetName}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <div className="flex items-center justify-center gap-2 mb-1 pr-8">
                    <span className="text-xl text-gray-400">
                        {hoveredAntiscion.isAscendantAntiscion ? 'AcA' : PLANET_SYMBOLS[hoveredAntiscion.natalPlanetName || '']}
                    </span>
                    <span className="font-bold text-lg text-gray-300">Antiscion of {hoveredAntiscion.natalPlanetName}</span>
                </div>
                <div className="text-sm font-medium text-gray-200">{hoveredAntiscion.antiscion.sign} {hoveredAntiscion.antiscion.degree}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">House {hoveredAntiscion.antiscion.house}</div>
                {/* Displays personalized Antiscion description from the API response */}
                <p className="text-[10px] text-gray-400 mt-2 leading-tight italic pr-8">
                    {hoveredAntiscion.antiscion.description}
                </p>
            </div>
        </div>
      )}

      {/* Tooltip for House Segments (Only show if no house active and no planet/antiscion hovered) */}
      {hoveredSign && !activeSign && !hoveredPlanet && !hoveredAntiscion && (
        (() => {
            const signData = ZODIAC_SIGNS.find(s => s.name === hoveredSign);
            const houseNumberForHover = getContainingHouseNumber(hoveredSign); // Use the new helper for hover
            let planetsInSegment: PlanetaryPlacement[] = [];
            let title = signData?.name || hoveredSign;
            let subtitle = "";

            if (houseNumberForHover !== null) {
                const house = chart.houses.find(h => h.house === houseNumberForHover);
                if (house) {
                    planetsInSegment = chart.planetaryPlacements.filter(p => p.house === house.house);
                    subtitle = `${house.house}. House`;
                }
            } else {
                 planetsInSegment = chart.planetaryPlacements.filter(p => p.sign === hoveredSign);
            }

            return (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 text-white text-xs px-4 py-3 rounded-xl pointer-events-none z-20 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col items-center">
                    <div className="text-2xl mb-1" style={{ color: signData?.color }}>{signData?.symbol}</div>
                    <div className="font-bold text-lg">{title}</div>
                    {subtitle && <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{subtitle}</div>}
                    
                    <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                        {planetsInSegment.length > 0 ? (
                            planetsInSegment.map(p => (
                                <span key={p.planet} className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                    <span>{PLANET_SYMBOLS[p.planet]}</span>
                                    <span>{p.planet}</span>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 italic text-[10px]">No planets</span>
                        )}
                    </div>
                </div>
            )
        })()
      )}

      {!activeSign && <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 animate-pulse">Tap a Zodiac segment to reveal house insights</div>}
    </div>
  );
};
