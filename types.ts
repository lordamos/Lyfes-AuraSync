

export interface ChartProperty {
  name: string;
  description: string;
}

export interface Center {
  name: string;
  defined: boolean;
  description: string;
}

export interface Gate {
  id: number;
  name: string;
  line: number;
  center: string; // The center this gate is associated with
  summary: string; // New: A concise, one-sentence summary
  description: string;
}

export interface IndividualBirthData {
  id: string; // Unique ID for each person in the form
  name: string;
  date: string;
  time: string;
  place: string;
  role?: 'primary' | 'partner' | 'child'; // To help differentiate in UI/prompts
}

export interface HumanDesignChart {
  personId: string; // Link to IndividualBirthData.id
  profileName: string;
  type: ChartProperty;
  strategy: ChartProperty;
  authority: ChartProperty;
  profile: ChartProperty;
  definition: ChartProperty;
  incarnationCross: ChartProperty;
  centers: Center[];
  activatedGates: Gate[]; // New property for activated gates
}

export interface NumerologyChart {
  personId: string; // Link to IndividualBirthData.id
  name: string; // Person's name for clarity
  lifePathNumber: number;
  lifePathDescription: string;
  expressionNumber: number;
  expressionDescription: string;
  soulUrgeNumber: number;
  soulUrgeDescription: string;
  // Add more numerology aspects as Gemini output provides them
}

export interface AntiscionPlacement {
  sign: string;
  degree: string;
  house: number;
  description: string; // Interpretation of this antiscion placement
}

export interface PlanetaryPlacement {
  planet: string; // e.g., "Sun", "Moon", "Mercury"
  sign: string;   // e.g., "Aries", "Taurus"
  degree: string; // e.g., "15° 30'" - include symbol
  house: number;  // e.g., 1, 2, 3...12
  description: string; // Interpretation of this placement
  antiscion?: AntiscionPlacement; // Optional Antiscion data
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string; // e.g., "Conjunction", "Trine", "Square"
  orb: string;  // e.g., "2° 15'" - include symbol
  description: string; // Interpretation of this aspect
}

export interface HousePlacement {
  house: number;
  sign: string;
  description: string; // Interpretation of the sign on this house cusp
}

export interface AstrologyChart {
  personId: string;
  name: string;
  sunSign: {
    sign: string;
    description: string;
  };
  moonSign: {
    sign: string;
    description: string;
  };
  ascendant: { // Rising Sign
    sign: string;
    description: string;
    antiscion?: AntiscionPlacement; // Optional Antiscion for Ascendant
  };
  houses: HousePlacement[]; // New property for the 12 houses
  planetaryPlacements: PlanetaryPlacement[]; // Array of placements for other planets
  majorAspects: Aspect[]; // Array of major aspects
  overallSummary: string; // Holistic summary of the chart
}


export interface SynastryReport {
  id: string; // Unique ID for this report (e.g., "primary-child1")
  person1: {
    id: string;
    name: string;
    role?: 'primary' | 'partner';
  };
  person2: {
    id: string;
    name: string;
    role?: 'child';
  };
  // Insights specifically for child teaching parent
  childTeachingParent: {
    lessonsForParent: string; // What the child is here to teach the parent
    howToEmbrace: string;     // Advice for the parent
  };
  // Insights specifically for child's learning journey
  childLearningJourney: {
    lessonsForChild: string; // What the child is here to learn/master
    howToSupport: string;    // Advice for the parent to support the child
  };
  relationshipDynamics: string; // Overall dynamic between the two individuals
}

export interface DailyGuidanceReport {
  personId: string;
  name: string;
  dailyColor: {
    name: string;
    hex: string; // e.g., "#FFD700" for gold
    explanation: string; // Why this color is recommended for today
  };
  dailyCrystal: {
    name: string;
    explanation: string; // Why this crystal is recommended for today
  };
  dailyTheme: string; // A concise, empowering daily focus or affirmation
}

export interface AllReports {
  humanDesignCharts: HumanDesignChart[];
  numerologyReports: NumerologyChart[];
  astrologyCharts: AstrologyChart[]; // New property for astrology charts
  synastryReports: SynastryReport[];
  dailyGuidanceReports?: DailyGuidanceReport[]; // Optional, for primary individual
}

// --- LifeOS Types ---
export interface PersonalizedQuestion {
  id: string;
  label: string;
  text: string;
}

export interface LifeOSProfileArch {
  coreDrive: string;
  fuel: string;
  bugs: string[]; // "Name: Description"
  patches: string[]; // "Name: Rule"
}

export interface LifeOSProfile {
  id?: string; // Firebase doc ID
  personId: string; // Link to IndividualBirthData.id
  name: string;
  role: string;
  answers: { [questionId: string]: string };
  arch: LifeOSProfileArch;
  personalizedQuestions?: PersonalizedQuestion[]; // Questions generated for this profile
}