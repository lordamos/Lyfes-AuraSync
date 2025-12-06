
import React, { useState, useRef, useMemo } from 'react';
import { Gate } from '../types';

interface DisplayOptions {
  showCenters: boolean;
  showChannels: boolean;
  showGates: boolean;
}

interface BodyGraphProps {
  definedCenters: string[];
  onCenterClick: (centerName: string) => void;
  activatedGates: Gate[];
  highlightedGateId: number | null;
  setHighlightedGateId: (id: number | null) => void;
  displayOptions: DisplayOptions;
}

const centerColors: { [key: string]: string } = {
  head: 'fill-yellow-400',
  ajna: 'fill-green-500',
  throat: 'fill-blue-500',
  'g': 'fill-yellow-500',
  heart: 'fill-red-500',
  spleen: 'fill-orange-500',
  sacral: 'fill-red-600',
  'solar-plexus': 'fill-brown-500',
  root: 'fill-brown-600',
};

const centerDisplayNames: { [key: string]: string } = {
  head: 'Head Center',
  ajna: 'Ajna Center',
  throat: 'Throat Center',
  g: 'G Center',
  heart: 'Heart/Ego Center',
  spleen: 'Spleen Center',
  sacral: 'Sacral Center',
  'solar-plexus': 'Solar Plexus Center',
  root: 'Root Center',
};

const centerCoords = { head: { x: 100, y: 27.5 }, ajna: { x: 100, y: 70 }, throat: { x: 100, y: 110 }, g: { x: 100, y: 145 }, spleen: { x: 67, y: 137 }, heart: { x: 137, y: 137 }, 'solar-plexus': { x: 137, y: 175 }, sacral: { x: 100, y: 200 }, root: { x: 100, y: 240 } };
interface ChannelInfo { name: string; startCenter: keyof typeof centerCoords; endCenter: keyof typeof centerCoords; }
const channelsData: ChannelInfo[] = [ { name: '64-47', startCenter: 'head', endCenter: 'ajna' }, { name: '61-24', startCenter: 'head', endCenter: 'ajna' }, { name: '63-4', startCenter: 'head', endCenter: 'ajna' }, { name: '43-23', startCenter: 'ajna', endCenter: 'throat' }, { name: '17-62', startCenter: 'ajna', endCenter: 'throat' }, { name: '11-56', startCenter: 'ajna', endCenter: 'throat' }, { name: '12-22', startCenter: 'throat', endCenter: 'solar-plexus' }, { name: '45-21', startCenter: 'throat', endCenter: 'heart' }, { name: '35-36', startCenter: 'throat', endCenter: 'solar-plexus' }, { name: '16-48', startCenter: 'throat', endCenter: 'spleen' }, { name: '20-57', startCenter: 'throat', endCenter: 'spleen' }, { name: '34-20', startCenter: 'throat', endCenter: 'sacral' }, { name: '10-20', startCenter: 'throat', endCenter: 'g' }, { name: '31-7', startCenter: 'throat', endCenter: 'g' }, { name: '8-1', startCenter: 'throat', endCenter: 'g' }, { name: '33-13', startCenter: 'throat', endCenter: 'g' }, { name: '34-10', startCenter: 'g', endCenter: 'sacral' }, { name: '14-2', startCenter: 'g', endCenter: 'sacral' }, { name: '25-51', startCenter: 'g', endCenter: 'heart' }, { name: '57-10', startCenter: 'g', endCenter: 'spleen' }, { name: '46-29', startCenter: 'g', endCenter: 'sacral' }, { name: '15-5', startCenter: 'g', endCenter: 'sacral' }, { name: '50-27', startCenter: 'spleen', endCenter: 'sacral' }, { name: '44-26', startCenter: 'spleen', endCenter: 'heart' }, { name: '32-54', startCenter: 'spleen', endCenter: 'root' }, { name: '28-38', startCenter: 'spleen', endCenter: 'root' }, { name: '18-58', startCenter: 'spleen', endCenter: 'root' }, { name: '49-19', startCenter: 'solar-plexus', endCenter: 'root' }, { name: '37-40', startCenter: 'solar-plexus', endCenter: 'heart' }, { name: '55-39', startCenter: 'solar-plexus', endCenter: 'root' }, { name: '59-6', startCenter: 'solar-plexus', endCenter: 'sacral' }, { name: '30-41', startCenter: 'solar-plexus', endCenter: 'root' }, { name: '53-42', startCenter: 'sacral', endCenter: 'root' }, { name: '60-3', startCenter: 'sacral', endCenter: 'root' }, { name: '52-9', startCenter: 'sacral', endCenter: 'root' } ];

const gateVisualPositions: { [key: number]: { x: number; y: number; center: string } } = { 64:{x:85,y:35,center:'head'},61:{x:100,y:38,center:'head'},63:{x:115,y:35,center:'head'},47:{x:85,y:55,center:'ajna'},24:{x:100,y:52,center:'ajna'},4:{x:115,y:55,center:'ajna'},17:{x:85,y:85,center:'ajna'},43:{x:100,y:88,center:'ajna'},11:{x:115,y:85,center:'ajna'},62:{x:85,y:100,center:'throat'},23:{x:100,y:97,center:'throat'},56:{x:115,y:100,center:'throat'},31:{x:85,y:120,center:'throat'},8:{x:92,y:123,center:'throat'},33:{x:108,y:123,center:'throat'},16:{x:73,y:110,center:'throat'},20:{x:78,y:115,center:'throat'},35:{x:122,y:115,center:'throat'},45:{x:127,y:110,center:'throat'},12:{x:115,y:120,center:'throat'},13:{x:85,y:135,center:'g'},1:{x:92,y:132,center:'g'},7:{x:108,y:132,center:'g'},2:{x:115,y:135,center:'g'},15:{x:85,y:155,center:'g'},10:{x:92,y:158,center:'g'},46:{x:108,y:158,center:'g'},25:{x:115,y:155,center:'g'},57:{x:55,y:120,center:'spleen'},48:{x:50,y:137,center:'spleen'},18:{x:55,y:155,center:'spleen'},44:{x:80,y:125,center:'spleen'},50:{x:85,y:137,center:'spleen'},32:{x:80,y:150,center:'spleen'},28:{x:60,y:168,center:'spleen'},26:{x:120,y:125,center:'heart'},21:{x:120,y:137,center:'heart'},51:{x:120,y:150,center:'heart'},40:{x:150,y:137,center:'heart'},22:{x:115,y:160,center:'solar-plexus'},36:{x:122,y:165,center:'solar-plexus'},6:{x:115,y:185,center:'solar-plexus'},49:{x:122,y:190,center:'solar-plexus'},55:{x:145,y:160,center:'solar-plexus'},30:{x:150,y:175,center:'solar-plexus'},37:{x:145,y:195,center:'solar-plexus'},59:{x:85,y:185,center:'sacral'},9:{x:92,y:182,center:'sacral'},3:{x:108,y:182,center:'sacral'},14:{x:115,y:185,center:'sacral'},29:{x:85,y:210,center:'sacral'},5:{x:92,y:213,center:'sacral'},42:{x:108,y:213,center:'sacral'},27:{x:115,y:210,center:'sacral'},34:{x:100,y:180,center:'sacral'},54:{x:80,y:220,center:'root'},38:{x:85,y:225,center:'root'},58:{x:74,y:250,center:'root'},53:{x:85,y:255,center:'root'},60:{x:100,y:258,center:'root'},52:{x:115,y:255,center:'root'},19:{x:122,y:250,center:'root'},39:{x:115,y:225,center:'root'},41:{x:100,y:222,center:'root'}, };

export const BodyGraph: React.FC<BodyGraphProps> = ({ definedCenters, onCenterClick, activatedGates, highlightedGateId, setHighlightedGateId, displayOptions }) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<{ type: string; name: string; id?: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hoveredGateId, setHoveredGateId] = useState<number | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
  const [activeCenterId, setActiveCenterId] = useState<string | null>(null);

  const channels = useMemo(() => channelsData.map(channel => ({ ...channel, gates: channel.name.split('-').map(Number) as [number, number] })), []);

  const activeElements = useMemo(() => {
    const activeId = hoveredGateId || selectedGateId;
    if (!activeId) return { center: null, channels: [] };
    const gateCenter = gateVisualPositions[activeId]?.center;
    if (!gateCenter) return { center: null, channels: [] };
    const connectedChannelNames = channels.filter(c => c.gates.includes(activeId)).map(c => c.name);
    return { center: gateCenter, channels: connectedChannelNames };
  }, [hoveredGateId, selectedGateId, channels]);

  const handleMouseMove3D = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = svgContainerRef.current;
    if (!container) return;
    const { left, top, width, height } = container.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    const rotateY = x * 10;
    const rotateX = -y * 10;
    container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    if (hoveredElement) {
        setTooltipPosition({ x: e.clientX + 15, y: e.clientY + 15 });
    }
  };

  const handleMouseLeave3D = () => {
    const container = svgContainerRef.current;
    if (container) container.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    setHoveredElement(null);
    setHoveredGateId(null);
  };
  
  const handleMouseEnterElement = (type: string, name: string, event: React.MouseEvent, id?: number) => {
    setHoveredElement({ type, name, id });
    setTooltipPosition({ x: event.clientX + 15, y: event.clientY + 15 });
  };

  const handleMouseLeaveElement = () => setHoveredElement(null);

  const handleInternalCenterClick = (centerId: string) => {
    setActiveCenterId(centerId);
    onCenterClick(centerId);
    setTimeout(() => {
      setActiveCenterId(null);
    }, 1500);
  };

  const getCenterProps = (centerId: keyof typeof centerCoords): React.SVGProps<any> => {
    const isDefined = definedCenters.includes(centerId);
    const isHighlighted = activeElements.center === centerId;
    const isActive = activeCenterId === centerId;
    
    // Logic for center styling
    // If active (clicked), we want a strong primary color border and pulse
    // If defined, it has color. If undefined, transparent.
    
    let strokeClass = 'stroke-gray-400 dark:stroke-gray-600';
    if (isActive) strokeClass = '!stroke-brand-primary dark:!stroke-indigo-400';
    else if (isHighlighted) strokeClass = '!stroke-brand-primary dark:!stroke-indigo-400';
    else if (isDefined) strokeClass = 'stroke-gray-800 dark:stroke-gray-200';

    let animationClass = isDefined ? 'motion-safe:animate-pulse-glow' : 'motion-safe:animate-breathing';
    if (isActive) animationClass = 'animate-highlight-pulse';

    const filterStyle = isActive ? { filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' } : {};

    return {
      strokeWidth: isActive ? 3 : (isHighlighted ? 2.5 : 1.5),
      onClick: (e) => { e.stopPropagation(); handleInternalCenterClick(centerId); },
      onMouseEnter: (e: React.MouseEvent) => handleMouseEnterElement('center', centerId, e),
      onMouseLeave: handleMouseLeaveElement,
      className: `origin-center transition-all duration-300 cursor-pointer transform hover:scale-110 
        ${isDefined ? `${centerColors[centerId]}` : 'fill-transparent'} 
        ${strokeClass}
        ${animationClass}
      `,
      style: filterStyle
    };
  };

  const getChannelLineProps = (channel: (typeof channels)[0]): React.SVGProps<SVGLineElement> => {
    const isChannelDefined = definedCenters.includes(channel.startCenter) && definedCenters.includes(channel.endCenter);
    const isHighlighted = activeElements.channels.includes(channel.name);
    const start = centerCoords[channel.startCenter];
    const end = centerCoords[channel.endCenter];
    if (!start || !end) return {};
    
    let classNames = 'transition-all duration-300 hover:stroke-amber-500';
    if (isHighlighted) classNames += ' stroke-brand-primary dark:stroke-indigo-400';
    else if (isChannelDefined) classNames += ' stroke-brand-accent defined-channel-flow motion-safe:animate-channel-glow';
    else classNames += ' stroke-gray-300 dark:stroke-gray-700';
    
    return {
      x1: start.x, y1: start.y, x2: end.x, y2: end.y,
      className: classNames,
      strokeWidth: isHighlighted ? 3 : isChannelDefined ? 2.5 : 1,
      strokeDasharray: isChannelDefined || isHighlighted ? undefined : "2 2",
      onMouseEnter: (e: React.MouseEvent) => handleMouseEnterElement('channel', channel.name, e),
      onMouseLeave: handleMouseLeaveElement,
    };
  };

  const handleGateClick = (gateId: number) => {
    document.getElementById(`gate-card-${gateId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedGateId(gateId);
    setTimeout(() => setHighlightedGateId(null), 1500);
    setSelectedGateId(prevId => prevId === gateId ? null : gateId);
  };
  
  const tooltipId = 'bodygraph-tooltip';
  
  return (
    <div
      ref={svgContainerRef}
      className="relative w-full transition-transform duration-200 ease-out"
      style={{ paddingBottom: '125%', transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove3D}
      onMouseLeave={handleMouseLeave3D}
    >
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 200 270"
        xmlns="http://www.w3.org/2000/svg"
        aria-describedby={hoveredElement ? tooltipId : undefined}
      >
        <title>Interactive Human Design BodyGraph</title>
        
        {displayOptions.showChannels && <g id="channels">{channels.map((ch, i) => <line key={i} {...getChannelLineProps(ch)} />)}</g>}
        
        {displayOptions.showCenters && <g id="centers">
          <polygon points="90,20 110,20 100,35" {...getCenterProps('head')} />
          <polygon points="90,60 110,60 100,80" {...getCenterProps('ajna')} />
          <rect x="90" y="100" width="20" height="20" {...getCenterProps('throat')} />
          <path d="M92,145 L100,160 L108,145 L100,130 Z" {...getCenterProps('g')} />
          <polygon points="50,115 75,155 60,160" {...getCenterProps('spleen')} />
          <polygon points="125,155 150,115 140,160" {...getCenterProps('heart')} />
          <polygon points="125,155 150,195 140,190" {...getCenterProps('solar-plexus')} />
          <rect x="90" y="190" width="20" height="20" {...getCenterProps('sacral')} />
          <rect x="90" y="230" width="20" height="20" {...getCenterProps('root')} />
        </g>}
        
        {displayOptions.showGates && <g id="gates">{activatedGates.map(gate => {
            const pos = gateVisualPositions[gate.id];
            if (!pos) return null;
            
            const isCenterActive = gateVisualPositions[gate.id]?.center === activeCenterId;
            const isHoveredOrSelected = gate.id === (hoveredGateId || selectedGateId);
            const isHighlighted = isHoveredOrSelected || isCenterActive;

            // When center is active, gates should pop with the same theme (brand-primary/indigo)
            // When hovered individually, they can keep their accent behavior or match.
            // Requirement: "Ensure the relevant activated gates are also highlighted when a center is clicked."

            let gateClass = 'font-bold text-[8px] cursor-pointer select-none transition-all duration-200 ';
            if (isHighlighted) {
               gateClass += 'scale-150 ';
               if (isCenterActive) {
                   // Match the center highlight color
                   gateClass += '!fill-brand-primary dark:!fill-indigo-400 drop-shadow-md';
               } else {
                   // Standard hover highlight
                   gateClass += '!fill-brand-accent dark:!fill-amber-400';
               }
            } else {
               gateClass += 'fill-brand-primary dark:fill-indigo-400 hover:fill-brand-accent dark:hover:fill-amber-400';
            }
            
            return (
              <text key={`gate-${gate.id}`} x={pos.x} y={pos.y} textAnchor="middle" alignmentBaseline="middle"
                className={gateClass}
                onClick={(e) => { e.stopPropagation(); handleGateClick(gate.id); }}
                onMouseEnter={(e) => { setHoveredGateId(gate.id); handleMouseEnterElement('gate', `Gate ${gate.id}`, e, gate.id); }}
                onMouseLeave={() => { setHoveredGateId(null); handleMouseLeaveElement(); }}>
                {gate.id}
              </text>
            );
          })}
        </g>}
      </svg>
      {hoveredElement && (
        <div id={tooltipId} role="tooltip" className="fixed bg-gray-900/90 text-white text-xs px-2 py-1 rounded-md shadow-lg z-50 pointer-events-none" style={{ left: tooltipPosition.x, top: tooltipPosition.y }}>
          <strong>{hoveredElement.type === 'gate' ? `${hoveredElement.name}` : centerDisplayNames[hoveredElement.name as keyof typeof centerDisplayNames] || hoveredElement.name}</strong>
        </div>
      )}
    </div>
  );
};
