
import { GoogleGenAI, Type } from "@google/genai";
import type { HumanDesignChart, NumerologyChart, SynastryReport, IndividualBirthData, AllReports, AstrologyChart, DailyGuidanceReport, PersonalizedQuestion, LifeOSProfileArch } from '../types';

// Safely access environment variable for API Key
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : (window as any).process?.env?.API_KEY;

if (!apiKey) {
    console.error("API_KEY not found in process.env or window.process.env");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const humanDesignResponseSchema = {
  type: Type.OBJECT,
  properties: {
    personId: { type: Type.STRING, description: "The ID of the person this chart is for." },
    profileName: { type: Type.STRING, description: "The name of the person this chart is for." },
    type: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Human Design Type (e.g., Generator, Projector)." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of this Type, including actionable life advice." }
      },
      required: ['name', 'description']
    },
    strategy: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Strategy associated with the Type (e.g., To Respond)." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of how to apply this Strategy in daily life, with specific examples." }
      },
      required: ['name', 'description']
    },
    authority: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The inner Authority (e.g., Sacral, Emotional)." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of how to use this Authority for decision making, including practical advice." }
      },
      required: ['name', 'description']
    },
    profile: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Profile (e.g., 1/3 Investigator/Martyr)." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of this Profile's role and purpose, with life advice." }
      },
      required: ['name', 'description']
    },
    definition: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Definition of the chart (e.g., Single Definition, Split Definition, Triple Split Definition, Quadruple Split Definition, or No Definition for a Reflector)." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of what this definition means for how the person processes information and interacts with others." }
      },
      required: ['name', 'description']
    },
    incarnationCross: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The name of the Incarnation Cross." },
        description: { type: Type.STRING, description: "A detailed, empowering explanation of this soul's purpose as defined by the cross, and how to live it." }
      },
      required: ['name', 'description']
    },
    centers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the energy center (e.g., Head, Ajna, Throat, G-Center, Heart, Sacral, Spleen, Solar Plexus, Root)." },
          defined: { type: Type.BOOLEAN, description: "Whether the center is defined (colored in) or undefined (white)." },
          description: { type: Type.STRING, description: "A detailed explanation of this center and what its state (defined/undefined) means for the person, including specific advice for managing its energy." }
        },
        required: ['name', 'defined', 'description']
      }
    },
    activatedGates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER, description: "The number of the activated gate (1-64)." },
          name: { type: Type.STRING, description: "The name of the activated gate (e.g., Gate of Self-Expression)." },
          line: { type: Type.NUMBER, description: "The activated line of the gate (1-6)." },
          center: { type: Type.STRING, description: "The energy center this gate is connected to (e.g., Throat, G-Center)." },
          summary: { type: Type.STRING, description: "A concise, one-sentence summary of the gate's core theme." },
          description: { type: Type.STRING, description: "A detailed, empowering explanation of this activated gate's energy, including its core theme, how it expresses itself, potential challenges, and specific life advice. This description should also weave in relevant planetary influences if applicable." }
        },
        required: ['id', 'name', 'line', 'center', 'summary', 'description']
      }
    }
  },
  required: ['personId', 'profileName', 'type', 'strategy', 'authority', 'profile', 'definition', 'incarnationCross', 'centers', 'activatedGates']
};

const numerologySchema = {
  type: Type.OBJECT,
  properties: {
    personId: { type: Type.STRING, description: "The ID of the person this numerology chart is for." },
    name: { type: Type.STRING, description: "The name of the person this numerology chart is for." },
    lifePathNumber: { type: Type.NUMBER, description: "The calculated Life Path Number." },
    lifePathDescription: { type: Type.STRING, description: "A detailed, empowering interpretation of the Life Path Number, including strengths, challenges, and life purpose." },
    expressionNumber: { type: Type.NUMBER, description: "The calculated Expression Number (Destiny Number)." },
    expressionDescription: { type: Type.STRING, description: "A detailed, empowering interpretation of the Expression Number, describing talents, abilities, and potential career paths." },
    soulUrgeNumber: { type: Type.NUMBER, description: "The calculated Soul Urge Number (Heart's Desire Number)." },
    soulUrgeDescription: { type: Type.STRING, description: "A detailed, empowering interpretation of the Soul Urge Number, revealing inner desires, motivations, and what truly brings fulfillment." },
  },
  required: ['personId', 'name', 'lifePathNumber', 'lifePathDescription', 'expressionNumber', 'expressionDescription', 'soulUrgeNumber', 'soulUrgeDescription']
};

// New AntiscionPlacement schema for reuse
const antiscionPlacementSchema = {
  type: Type.OBJECT,
  properties: {
    sign: { type: Type.STRING, description: "The zodiac sign of the Antiscion point." },
    degree: { type: Type.STRING, description: "The exact degree of the Antiscion point in its sign (e.g., '15° 30'')." },
    house: { type: Type.NUMBER, description: "The house the Antiscion point falls into (1-12)." },
    description: { type: Type.STRING, description: "A detailed, empowering interpretation of this Antiscion point's subtle, often unconscious, influence, explaining how it relates to the original point's direct manifestation and what it reveals about hidden potentials or shadow aspects, or areas of sympathetic resonance." },
  },
  required: ['sign', 'degree', 'house', 'description']
};

const astrologySchema = {
  type: Type.OBJECT,
  properties: {
    personId: { type: Type.STRING, description: "The ID of the person this astrology chart is for." },
    name: { type: Type.STRING, description: "The name of the person this astrology chart is for." },
    sunSign: {
      type: Type.OBJECT,
      properties: {
        sign: { type: Type.STRING, description: "The individual's Sun sign." },
        description: { type: Type.STRING, description: "A detailed, empowering interpretation of the Sun sign, representing the core self and ego." },
      },
      required: ['sign', 'description']
    },
    moonSign: {
      type: Type.OBJECT,
      properties: {
        sign: { type: Type.STRING, description: "The individual's Moon sign." },
        description: { type: Type.STRING, description: "A detailed, empowering interpretation of the Moon sign, representing emotions, inner world, and comfort." },
      },
      required: ['sign', 'description']
    },
    ascendant: {
      type: Type.OBJECT,
      properties: {
        sign: { type: Type.STRING, description: "The individual's Ascendant (Rising) sign." },
        description: { type: Type.STRING, description: "A detailed, empowering interpretation of the Ascendant, representing outward personality and first impressions." },
        antiscion: { ...antiscionPlacementSchema, description: "The Antiscion (co-ascendant) point for the Ascendant, with its interpretation." }, // Add antiscion
      },
      required: ['sign', 'description']
    },
    houses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          house: { type: Type.NUMBER, description: "The house number (1-12)." },
          sign: { type: Type.STRING, description: "The zodiac sign on the cusp of this house." },
          description: { type: Type.STRING, description: "A detailed, empowering interpretation of what this sign on this house cusp means for the individual's life area." },
        },
        required: ['house', 'sign', 'description']
      }
    },
    planetaryPlacements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          planet: { type: Type.STRING, description: "The planet (e.g., Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)." },
          sign: { type: Type.STRING, description: "The zodiac sign the planet is in." },
          degree: { type: Type.STRING, description: "The exact degree of the planet in its sign (e.g., '15° 30'')." },
          house: { type: Type.NUMBER, description: "The house the planet is in (1-12)." },
          description: { type: Type.STRING, description: "A detailed, empowering interpretation of this planetary placement (planet in sign in house)." },
          antiscion: { ...antiscionPlacementSchema, description: "The Antiscion point for this planet, with its interpretation." }, // Add antiscion
        },
        required: ['planet', 'sign', 'degree', 'house', 'description']
      }
    },
    majorAspects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          planet1: { type: Type.STRING, description: "The first planet involved in the aspect." },
          planet2: { type: Type.STRING, description: "The second planet involved in the aspect." },
          type: { type: Type.STRING, description: "The type of aspect (e.g., Conjunction, Opposition, Trine, Square, Sextile)." },
          orb: { type: Type.STRING, description: "The orb of the aspect (e.g., '2° 15'')." },
          description: { type: Type.STRING, description: "A detailed, empowering interpretation of this aspect." },
        },
        required: ['planet1', 'planet2', 'type', 'orb', 'description']
      }
    },
    overallSummary: { type: Type.STRING, description: "A holistic and empowering summary of the entire astrological chart, highlighting key themes and life path insights." },
  },
  required: ['personId', 'name', 'sunSign', 'moonSign', 'ascendant', 'houses', 'planetaryPlacements', 'majorAspects', 'overallSummary']
};


const synastrySchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "Unique ID for this synastry report, e.g., 'parent1-child1'." },
    person1: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        role: { type: Type.STRING },
      },
      required: ['id', 'name']
    },
    person2: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        role: { type: Type.STRING },
      },
      required: ['id', 'name']
    },
    childTeachingParent: {
      type: Type.OBJECT,
      properties: {
        lessonsForParent: { type: Type.STRING, description: "A detailed explanation of what the child is specifically here to teach the parent, based on their combined numerology and energetic dynamics." },
        howToEmbrace: { type: Type.STRING, description: "Actionable advice for the parent on how to recognize, accept, and integrate these lessons for personal growth and stronger connection." }
      },
      required: ['lessonsForParent', 'howToEmbrace']
    },
    childLearningJourney: {
      type: Type.OBJECT,
      properties: {
        lessonsForChild: { type: Type.STRING, description: "A detailed explanation of what the child is here to learn, master, or overcome in this lifetime, based on their unique energetic blueprint." },
        howToSupport: { type: Type.STRING, description: "Actionable advice for the parent on how to best support the child in their learning journey, encouraging their authentic expression and helping them navigate obstacles." }
      },
      required: ['lessonsForChild', 'howToSupport']
    },
    relationshipDynamics: { type: Type.STRING, description: "An overall, empowering summary of the unique energetic dynamics between the parent and child, highlighting areas of harmony, potential growth, and mutual understanding." },
  },
  required: ['id', 'person1', 'person2', 'childTeachingParent', 'childLearningJourney', 'relationshipDynamics']
};

const dailyGuidanceSchema = {
  type: Type.OBJECT,
  properties: {
    personId: { type: Type.STRING, description: "The ID of the person this daily guidance is for." },
    name: { type: Type.STRING, description: "The name of the person this daily guidance is for." },
    dailyColor: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The recommended color for the day (e.g., 'Emerald Green', 'Deep Indigo')." },
        hex: { type: Type.STRING, description: "The hex code for the recommended color (e.g., '#008080', '#4B0082')." },
        explanation: { type: Type.STRING, description: "A detailed, empowering explanation of why this color is beneficial today, linking to the individual's charts." },
      },
      required: ['name', 'hex', 'explanation']
    },
    dailyCrystal: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The recommended crystal for the day (e.g., 'Amethyst', 'Clear Quartz')." },
        explanation: { type: Type.STRING, description: "A detailed, empowering explanation of why this crystal is beneficial today, linking to the individual's charts." },
      },
      required: ['name', 'explanation']
    },
    dailyTheme: { type: Type.STRING, description: "A concise, empowering daily theme or affirmation that synthesizes the day's energetic focus." },
  },
  required: ['personId', 'name', 'dailyColor', 'dailyCrystal', 'dailyTheme']
};

// Fixed personalizedQuestionsSchema to correctly use Type.OBJECT and 'properties'
const personalizedQuestionsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique, short identifier for the question (e.g., 'core_challenge')." },
      label: { type: Type.STRING, description: "A concise label for the question (e.g., 'Core Challenge')." },
      text: { type: Type.STRING, description: "The full, personalized question to prompt self-reflection." },
    },
    required: ['id', 'label', 'text']
  }
};


export const generateHumanDesignChart = async (birthData: IndividualBirthData): Promise<HumanDesignChart> => {
  const prompt = `
    Based on the following birth data, generate a highly personalized, nuanced, and actionable Human Design chart interpretation for ${birthData.name}.
    The 'personId' should be "${birthData.id}".

    Birth Data:
    - Name: ${birthData.name}
    - Date: ${birthData.date}
    - Time: ${birthData.time}
    - Place: ${birthData.place}

    Adopt the persona of a world-class, deeply empathetic Human Design expert. Your tone must be inspiring, clear, and focused on self-discovery and empowerment, consistent with the "AuraSync" brand. Your goal is to provide a practical guide that ${birthData.name} can use to improve their life.

    **Core Instructions:**

    1.  **Accurate Chart Generation:** You MUST generate a complete and valid Human Design chart based on the provided birth data. Ensure all calculations are realistic and internally consistent (e.g., a Generator MUST have a defined Sacral center; Emotional Authority requires a defined Solar Plexus, etc.).

    2.  **Determine the Definition:** Based on the connections between the defined centers, determine the chart's Definition (e.g., Single Definition, Split Definition, Triple Split Definition, Quadruple Split Definition, or No Definition for a Reflector). Provide the name of the definition and a detailed description explaining how this influences the person's way of processing energy and information. For split definitions, describe the nature of the split and what bridges it.

    3.  **Synthesize, Don't Isolate:** This is crucial. Go beyond describing each component (Type, Profile, Authority) in isolation. Weave them together to create a holistic narrative. For example, how does a 5/1 Profile's 'heretic investigator' nature specifically color their experience as a Manifesting Generator? How does their Emotional Authority guide their decision-making process within that context? The interpretation should feel like a cohesive story about one individual, not a collection of separate facts.

    4.  **Provide Actionable Life Advice:** For every single component of the chart (Type, Strategy, Authority, Profile, Definition, Incarnation Cross, and each of the 9 Centers), provide concrete, practical, and actionable life advice. 
        - Give specific examples related to career, relationships, and personal well-being.
        - Frame advice clearly, perhaps using "Try this:" or "Watch out for:" sections.
        - Instead of just saying "To Respond," explain *what* to respond to (gut feelings, opportunities, direct questions) and what that feels like physically or emotionally. For an "Emotional Authority," describe the process of riding the emotional wave before making a decision.

    5.  **Activated Gates & Lines:** Identify the most significant activated gates and their lines (Personality and Design) from the birth data. For each activated gate:
        - Provide a concise, one-sentence **summary** of its core energy.
        - Provide a detailed, empowering **description** of its practical implications, weaving in any relevant planetary influences (e.g., "The Sun in Gate 1" or "Earth in Gate 13") within the gate's description, explaining what that planetary influence signifies for the gate's expression.

    6.  **Rich, Empowering Language:** Do not use generic or placeholder text. For each description, explain what it feels like to embody that energy, what the potential challenges are (the 'not-self' theme), and how to embrace its strengths. 

    **Output Format:**
    Your response MUST be a single JSON object that strictly adheres to the provided schema. Ensure every field is populated with a rich, detailed, and unique interpretation that follows all the instructions above.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: humanDesignResponseSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    // Basic validation to ensure we have what we need
    if (!parsedData || !parsedData.type || !parsedData.centers || !parsedData.activatedGates) {
        throw new Error("Invalid Human Design data structure received from AI.");
    }
    
    return parsedData as HumanDesignChart;

  } catch (error) {
    console.error("Error calling Gemini API for Human Design:", error);
    throw new Error("Failed to get Human Design interpretation from AI.");
  }
};

export const generateNumerologyChart = async (birthData: IndividualBirthData): Promise<NumerologyChart> => {
  const prompt = `
    Based on the following birth data, calculate and provide a detailed numerology report for ${birthData.name}.
    The 'personId' should be "${birthData.id}".

    Birth Data:
    - Name: ${birthData.name}
    - Date: ${birthData.date}
    - Time: ${birthData.time} (Note: Time is typically not used in standard numerology calculations, but include for context)
    - Place: ${birthData.place} (Note: Place is typically not used in standard numerology calculations, but include for context)

    Adopt the persona of a wise, encouraging numerologist. Your tone should be insightful, clear, and focused on revealing the individual's inherent strengths, challenges, and life lessons, consistent with the "AuraSync" brand.

    **Core Instructions:**

    1.  **Accurate Calculations:** You MUST accurately calculate the Life Path Number, Expression Number (Destiny Number), and Soul Urge Number (Heart's Desire Number) based on the full birth name and date. For each calculation, explain the meaning of any master numbers (11, 22, 33) if present.
    2.  **Detailed Interpretation:** For each number, provide a comprehensive, empowering description.
        -   **Life Path Number:** Explain the primary lesson you are here to learn and master, your natural talents, and the path that leads to the most fulfillment.
        -   **Expression Number:** Describe your natural abilities, talents, and potential career paths. How do you express yourself in the world?
        -   **Soul Urge Number:** Reveal your deepest desires, motivations, and what truly brings fulfillment.
    3.  **Actionable Insights:** Offer practical advice on how to align with these numerological energies in daily life, addressing potential challenges and maximizing inherent strengths.

    **Output Format:**
    Your response MUST be a single JSON object that strictly adheres to the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: numerologySchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!parsedData || !parsedData.lifePathNumber) {
        throw new Error("Invalid Numerology data structure received from AI.");
    }

    return parsedData as NumerologyChart;

  } catch (error) {
    console.error("Error calling Gemini API for Numerology:", error);
    throw new Error("Failed to get Numerology interpretation from AI.");
  }
};

export const generateAstrologyChart = async (birthData: IndividualBirthData): Promise<AstrologyChart> => {
  const prompt = `
    Based on the following birth data, generate a highly personalized and deeply insightful Western Astrology Natal Chart interpretation for ${birthData.name}.
    The 'personId' should be "${birthData.id}".

    Birth Data:
    - Name: ${birthData.name}
    - Date: ${birthData.date}
    - Time: ${birthData.time}
    - Place: ${birthData.place}

    Adopt the persona of a seasoned, empathetic astrologer. Your tone must be inspiring, clear, and focused on self-discovery, empowerment, and practical application of cosmic wisdom, consistent with the "AuraSync" brand. Your goal is to provide a profound guide that ${birthData.name} can use to understand their inherent gifts, challenges, and life path.

    **Core Instructions:**

    1.  **Accurate Chart Generation:** You MUST calculate and include the Sun sign, Moon sign, Ascendant (Rising sign) based on the provided birth data. For all major planets (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto), accurately determine their zodiac sign, exact degree (e.g., '15° 30''), and house placement (1-12). You must also determine the zodiac sign on the cusp of each of the 12 houses.

    2.  **Detailed Interpretations:**
        -   **Sun Sign, Moon Sign, Ascendant:** Provide a comprehensive, empowering interpretation for each, explaining its core meaning for ${birthData.name}'s personality, emotional world, and outward expression.
        -   **Antiscions (Direct):** For each major planet (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) and the Ascendant, calculate its Antiscion point (the reflection across the 0° Cancer / 0° Capricorn axis, which corresponds to the same declination). Provide the Antiscion's zodiac sign, exact degree, and the house it falls into. Then, give a detailed, empowering interpretation of this Antiscion point's subtle, often unconscious, influence. Explain how it relates to the original planet's/Ascendant's direct manifestation and what it reveals about hidden potentials or shadow aspects, or areas of sympathetic resonance.
        -   **The 12 Houses:** For each of the 12 houses, provide a detailed interpretation of the sign on its cusp, explaining how that sign's energy influences the specific life area of the house.
        -   **Planetary Placements:** For *each* major planet, provide a detailed interpretation of its placement in its specific sign and house. Explain what this combination means for ${birthData.name}'s character, drives, talents, and life experiences.
        -   **Major Aspects:** Identify and interpret the most significant major aspects (Conjunction, Opposition, Trine, Square, Sextile) between planets in ${birthData.name}'s chart. For each aspect, explain the planets involved, the aspect type, the orb (e.g., '2° 15''), and its psychological and life implications. Focus on how these aspects influence inner dynamics and outward behaviors.

    3.  **Holistic Summary:** Conclude with an overall, empowering summary of ${birthData.name}'s entire astrological chart. Weave together the key themes, highlighting core strengths, potential areas for growth, and overarching life purpose insights.
    4.  **Actionable Wisdom:** Throughout the report, integrate practical advice and empowering perspectives on how ${birthData.name} can best embody their chart's energies, overcome challenges, and align with their highest potential.

    **Output Format:**
    Your response MUST be a single JSON object that strictly adheres to the provided schema. Ensure every field is populated with rich, detailed, and unique interpretations that follows all the instructions above.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash for potentially faster responses, pro could also be used for deeper insights
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: astrologySchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!parsedData || !parsedData.sunSign || !parsedData.moonSign || !parsedData.houses) {
        throw new Error("Invalid Astrology data structure received from AI.");
    }

    return parsedData as AstrologyChart;

  } catch (error) {
    console.error("Error calling Gemini API for Astrology:", error);
    throw new Error("Failed to get Astrology interpretation from AI.");
  }
};


export const generateSynastryReport = async (parent: IndividualBirthData, child: IndividualBirthData): Promise<SynastryReport> => {
  const prompt = `
    Based on the birth data for ${parent.name} (Parent, ID: ${parent.id}) and ${child.name} (Child, ID: ${child.id}),
    generate a comprehensive synastry report focusing on their unique energetic dynamic, particularly around lessons taught and learned.
    The 'id' for this report should be "${parent.id}-${child.id}".

    Parent Birth Data:
    - Name: ${parent.name}
    - Date: ${parent.date}
    - Time: ${parent.time}
    - Place: ${parent.place}

    Child Birth Data:
    - Name: ${child.name}
    - Date: ${child.date}
    - Time: ${child.time}
    - Place: ${child.place}

    Adopt the persona of an empathetic and insightful relationship coach/spiritual guide. Your tone should be nurturing, empowering, and focused on fostering understanding and growth within the family unit, consistent with the "AuraSync" brand.

    **Core Instructions:**

    1.  **Child Teaching Parent:**
        -   Identify and articulate what the child (${child.name}) is energetically here to teach the parent (${parent.name}). This should go beyond surface-level observations and delve into deep energetic lessons related to their combined numerology, Human Design aspects (if you can infer them from birth data), and birth dates.
        -   Provide specific, actionable advice for the parent on how to recognize, embrace, and integrate these lessons into their life for personal evolution and a stronger, more conscious relationship with their child.

    2.  **Child's Learning Journey:**
        -   Identify what the child (${child.name}) is here to learn, master, or overcome in this lifetime. This should focus on their individual soul's journey and inherent challenges/gifts.
        -   Provide specific, actionable advice for the parent (${parent.name}) on how to best support the child in their unique learning journey, encouraging their authentic expression and helping them navigate obstacles.

    3.  **Overall Relationship Dynamics:**
        -   Provide an empowering summary of the overarching energetic dynamics between ${parent.name} and ${child.name}. Highlight areas of natural harmony, complementary energies, and potential growth opportunities.
        -   Offer insights into how they can best communicate, understand each other's needs, and create a supportive family environment.

    **Output Format:**
    Your response MUST be a single JSON object that strictly adheres to the provided schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synastrySchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!parsedData || !parsedData.childTeachingParent) {
        throw new Error("Invalid Synastry data structure received from AI.");
    }

    return parsedData as SynastryReport;
  } catch (error) {
    console.error("Error calling Gemini API for Synastry:", error);
    throw new Error("Failed to get Synastry interpretation from AI.");
  }
};

export const generateDailyGuidance = async (
  birthData: IndividualBirthData,
  hdChart: HumanDesignChart,
  numChart: NumerologyChart,
  astroChart: AstrologyChart
): Promise<DailyGuidanceReport> => {
  const prompt = `
    Based on the comprehensive energetic blueprint of ${birthData.name}, synthesize insights from their Human Design, Numerology, and Astrology charts to provide daily guidance.
    The 'personId' should be "${birthData.id}".

    Birth Data:
    - Name: ${birthData.name}
    - Date: ${birthData.date}
    - Time: ${birthData.time}
    - Place: ${birthData.place}

    Human Design Chart Summary for ${birthData.name}:
    - Type: ${hdChart.type.name} - ${hdChart.type.description}
    - Strategy: ${hdChart.strategy.name} - ${hdChart.strategy.description}
    - Authority: ${hdChart.authority.name} - ${hdChart.authority.description}
    - Profile: ${hdChart.profile.name} - ${hdChart.profile.description}
    - Defined Centers: ${hdChart.centers.filter(c => c.defined).map(c => c.name).join(', ')}.
    - Key Activated Gates: ${hdChart.activatedGates.map(g => `Gate ${g.id} (${g.name} - ${g.summary})`).join('; ')}.

    Numerology Report Summary for ${birthData.name}:
    - Life Path Number: ${numChart.lifePathNumber} - ${numChart.lifePathDescription}
    - Expression Number: ${numChart.expressionNumber} - ${numChart.expressionDescription}
    - Soul Urge Number: ${numChart.soulUrgeNumber} - ${numChart.soulUrgeDescription}

    Astrology Chart Summary for ${birthData.name}:
    - Sun Sign: ${astroChart.sunSign.sign} - ${astroChart.sunSign.description}
    - Moon Sign: ${astroChart.moonSign.sign} - ${astroChart.moonSign.description}
    - Ascendant: ${astroChart.ascendant.sign} - ${astroChart.ascendant.description}
    - Overall Chart Summary: ${astroChart.overallSummary}
    - Key Planetary Placements: ${astroChart.planetaryPlacements.map(p => `${p.planet} in ${p.sign} ${p.degree} in House ${p.house}`).join('; ')}.
    - Key Aspects: ${astroChart.majorAspects.map(a => `${a.planet1} ${a.type} ${a.planet2}`).join('; ')}.

    Adopt the persona of a nurturing and intuitive guide, offering gentle but powerful wisdom. Your tone should be encouraging, empowering, and focused on providing practical support for daily energetic alignment, consistent with the "AuraSync" brand.

    **Core Instructions:**

    1.  **Holistic Synthesis:** Synthesize ALL provided information from the Human Design, Numerology, and Astrology charts. Do not simply list facts; interweave them to create a cohesive understanding of ${birthData.name}'s core energetic needs for *today*. Assume "today's energies" are those that inherently resonate with their natal blueprint, seeking to support their unique constitution.
    2.  **Daily Color Recommendation:** Based on this synthesis, recommend a specific color that would be most beneficial for ${birthData.name} to incorporate into their day.
        -   Provide the **name** of the color (e.g., "Sky Blue," "Golden Yellow").
        -   Provide its **hex code** (e.g., "#87CEEB", "#FFD700").
        -   Give a detailed, empowering **explanation** of *why* this color is recommended, linking it directly to elements from their Human Design (e.g., activating an open center), Numerology (e.g., balancing a Life Path challenge), or Astrology (e.g., enhancing a strong planetary placement). Explain how it can support their emotional state, focus, or energy levels.
    3.  **Daily Crystal Recommendation:** Recommend a specific crystal that would be most supportive for ${birthData.name} for their day.
        -   Provide the **name** of the crystal (e.g., "Amethyst", "Citrine").
        -   Give a detailed, empowering **explanation** of *why* this crystal is recommended, linking it directly to elements from their charts, similar to the color explanation. Explain its energetic properties and how it can assist them.
    4.  **Daily Theme/Affirmation:** Provide a concise, empowering daily theme or affirmation that encapsulates the core energetic focus for ${birthData.name}, guiding them to leverage their strengths or navigate potential challenges.

    **Output Format:**
    Your response MUST be a single JSON object that strictly adheres to the provided schema. Ensure every field is populated with rich, detailed, and unique interpretations that follow all the instructions above.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dailyGuidanceSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!parsedData || !parsedData.dailyColor || !parsedData.dailyCrystal || !parsedData.dailyTheme) {
        throw new Error("Invalid Daily Guidance data structure received from AI.");
    }

    return parsedData as DailyGuidanceReport;

  } catch (error) {
    console.error("Error calling Gemini API for Daily Guidance:", error);
    throw new Error("Failed to get Daily Guidance interpretation from AI.");
  }
};

export const generatePersonalizedQuestions = async (
  individual: IndividualBirthData,
  hdChart: HumanDesignChart,
  numChart: NumerologyChart,
  astroChart: AstrologyChart
): Promise<PersonalizedQuestion[]> => {
  const prompt = `
    You are an AI life coach specializing in Human Design, Numerology, and Astrology. Your goal is to generate deeply personalized self-reflection questions for ${individual.name}.

    Here is ${individual.name}'s comprehensive energetic blueprint:

    Human Design Chart Summary:
    - Type: ${hdChart.type.name} - ${hdChart.type.description}
    - Strategy: ${hdChart.strategy.name} - ${hdChart.strategy.description}
    - Authority: ${hdChart.authority.name} - ${hdChart.authority.description}
    - Profile: ${hdChart.profile.name} - ${hdChart.profile.description}
    - Defined Centers: ${hdChart.centers.filter(c => c.defined).map(c => c.name).join(', ')}.
    - Undefined Centers: ${hdChart.centers.filter(c => !c.defined).map(c => c.name).join(', ')}.
    - Key Activated Gates: ${hdChart.activatedGates.map(g => `Gate ${g.id} (${g.name} - ${g.summary})`).join('; ')}.

    Numerology Report Summary:
    - Life Path Number: ${numChart.lifePathNumber} - ${numChart.lifePathDescription}
    - Expression Number: ${numChart.expressionNumber} - ${numChart.expressionDescription}
    - Soul Urge Number: ${numChart.soulUrgeNumber} - ${numChart.soulUrgeDescription}

    Astrology Chart Summary:
    - Sun Sign: ${astroChart.sunSign.sign} - ${astroChart.sunSign.description}
    - Moon Sign: ${astroChart.moonSign.sign} - ${astroChart.moonSign.description}
    - Ascendant: ${astroChart.ascendant.sign} - ${astroChart.ascendant.description}
    - Overall Chart Summary: ${astroChart.overallSummary}
    - Key Planetary Placements: ${astroChart.planetaryPlacements.map(p => `${p.planet} in ${p.sign} ${p.degree} in House ${p.house}`).join('; ')}.
    - Key Aspects: ${astroChart.majorAspects.map(a => `${a.planet1} ${a.type} ${a.planet2}`).join('; ')}.
    - Ascendant Antiscion: ${astroChart.ascendant.antiscion?.sign} ${astroChart.ascendant.antiscion?.degree} (House ${astroChart.ascendant.antiscion?.house}) - ${astroChart.ascendant.antiscion?.description}.

    Generate exactly 10 insightful questions that provoke self-discovery, growth, and alignment, specifically tailored to ${individual.name}'s unique energetic blueprint. Focus on areas of potential challenge, untapped strength, or nuanced aspects revealed by their charts. Questions should be open-ended, not yes/no, and encourage deep introspection. Avoid generic questions. Relate questions explicitly to their chart components.

    Examples of personalized questions:
    - "Given your Projector type and Emotional Authority, how do you recognize when you're truly invited and when your emotional wave has cleared for a decision?"
    - "With your Life Path 3 and Sun in Leo, how do you find outlets for creative self-expression that also serve your community, avoiding the trap of seeking external validation?"
    - "Considering your undefined G-Center, what practices help you feel a strong sense of direction and identity when you're absorbing energies from others?"

    **Output Format:**
    Your response MUST be a JSON array of objects, strictly adhering to the \`PersonalizedQuestion[]\` schema. Each object must have an \`id\` (short, unique string), \`label\` (concise title), and \`text\` (the full question).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: personalizedQuestionsSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    if (!Array.isArray(parsedData) || !parsedData.every((q: any) => typeof q === 'object' && q !== null && q.id && q.label && q.text)) {
        throw new Error("Invalid Personalized Questions data structure received from AI.");
    }

    return parsedData as PersonalizedQuestion[];

  } catch (error) {
    console.error("Error calling Gemini API for Personalized Questions:", error);
    throw new Error("Failed to get personalized questions from AI.");
  }
};


export const generateAllReports = async (individuals: IndividualBirthData[]): Promise<AllReports> => {
  const humanDesignCharts: HumanDesignChart[] = [];
  const numerologyReports: NumerologyChart[] = [];
  const astrologyCharts: AstrologyChart[] = []; // New array for astrology charts
  const synastryReports: SynastryReport[] = [];
  const dailyGuidanceReports: DailyGuidanceReport[] = []; // New array for daily guidance

  // Generate Human Design, Numerology, and Astrology for each individual
  for (const individual of individuals) {
    let hdChart: HumanDesignChart | undefined;
    let numChart: NumerologyChart | undefined;
    let astroChart: AstrologyChart | undefined;

    try {
      hdChart = await generateHumanDesignChart(individual);
      humanDesignCharts.push(hdChart);
    } catch (e) {
      console.error(`Failed to generate Human Design for ${individual.name}:`, e);
      // Optionally handle errors, e.g., push a placeholder or skip
    }

    try {
      numChart = await generateNumerologyChart(individual);
      numerologyReports.push(numChart);
    } catch (e) {
      console.error(`Failed to generate Numerology for ${individual.name}:`, e);
      // Optionally handle errors
    }

    try {
      astroChart = await generateAstrologyChart(individual); // Generate astrology chart
      astrologyCharts.push(astroChart);
    } catch (e) {
      console.error(`Failed to generate Astrology for ${individual.name}:`, e);
      // Optionally handle errors
    }

    // Generate Daily Guidance ONLY for the primary individual if all their charts are available
    if (individual.role === 'primary' && hdChart && numChart && astroChart) {
      try {
        const dailyGuidance = await generateDailyGuidance(individual, hdChart, numChart, astroChart);
        dailyGuidanceReports.push(dailyGuidance);
      } catch (e) {
        console.error(`Failed to generate Daily Guidance for ${individual.name}:`, e);
      }
    }
  }

  // Generate Synastry reports
  const parents = individuals.filter(ind => ind.role === 'primary' || ind.role === 'partner');
  const children = individuals.filter(ind => ind.role === 'child');

  for (const parent of parents) {
    for (const child of children) {
      try {
        const synastry = await generateSynastryReport(parent, child);
        synastryReports.push(synastry);
      } catch (e) {
        console.error(`Failed to generate Synastry for ${parent.name} and ${child.name}:`, e);
        // Optionally handle errors
      }
    }
  }

  return { humanDesignCharts, numerologyReports, astrologyCharts, synastryReports, dailyGuidanceReports };
};
