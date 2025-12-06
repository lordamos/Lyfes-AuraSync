
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
// @ts-ignore
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, deleteDoc } from "firebase/firestore";
import { 
  Cpu, 
  Battery, 
  ShieldAlert, 
  Shield, 
  Flame, 
  User, 
  ChevronRight, 
  Save, 
  Copy, 
  Terminal, 
  Activity, 
  BrainCircuit, 
  Trash2, 
  Lightbulb,
  Zap,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  Volume2, 
  VolumeX, 
  Mic,     
  MicOff   
} from 'lucide-react';
import type { 
  AllReports, 
  IndividualBirthData, 
  LifeOSProfile, 
  LifeOSProfileArch, 
  PersonalizedQuestion,
  HumanDesignChart,
  NumerologyChart,
  AstrologyChart
} from '../types';
import { generatePersonalizedQuestions, generateSinglePersonalizedQuestion } from '../services/geminiService';
import { NatalChart } from './NatalChart';

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }

  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;
    abort(): void;
    start(): void;
    stop(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    addFromURI(src: string, weight?: number): void;
    addFromString(string: string, weight?: number): void;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }
}

// --- FIREBASE CONFIGURATION ---
let app: any;
let auth: any;
let db: any;
const appId = (window as any).__app_id || 'default-app-id';
const initialAuthToken = (window as any).__initial_auth_token;

try {
  const configStr = (window as any).__firebase_config;
  if (configStr) {
    const firebaseConfig = JSON.parse(configStr);
    if (Object.keys(firebaseConfig).length > 0) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  }
} catch (e) {
  console.warn("Firebase initialization failed. Life OS features may be limited.", e);
}

// --- CONSTANTS ---
const DEFAULT_QUESTIONS: PersonalizedQuestion[] = [
  { id: 'peak', label: "Peak State", text: "Describe a moment in the last year when you felt 'on fire'. What were you working on?" },
  { id: 'drain', label: "The Drain", text: "What task drains your energy instantly, even if it's easy?" },
  { id: 'friction', label: "Recurring Friction", text: "What problem keeps showing up no matter how often you solve it?" },
  { id: 'shadow', label: "Shadow Value", text: "What is a rule you live by that you rarely admit to others?" },
  { id: 'decision', label: "Decision Pattern", text: "When you fail, is it impulse or over-analysis?" },
  { id: 'fuel', label: "Motivational Fuel", text: "Do you run faster towards a reward (Ambition) or away from a threat (Fear)?" },
  { id: 'distraction', label: "Good Distraction", text: "What specific activity do you do when procrastinating?" },
  { id: 'social', label: "Social Battery", text: "After a big party, do you feel energized or drained?" },
  { id: 'arc', label: "5-Year Arc", text: "If you could guarantee success in one area (Health, Wealth, Family), which one?" },
  { id: 'anti', label: "The Anti-Goal", text: "What lifestyle outcome are you terrified of drifting into?" }
];

const DEFAULT_PROFILE_ARCH: LifeOSProfileArch = {
  coreDrive: 'Not Analyzed',
  fuel: 'Not Analyzed',
  bugs: [],
  patches: []
};

// --- LifeOSSection Component (Main Entry) ---

interface LifeOSSectionProps {
  individuals: IndividualBirthData[];
  allReports: AllReports;
  speak: (text: string, id: string) => Promise<void>; 
  currentSpeakingId: string | null;
  stopSpeaking: () => void;
}

export const LifeOSSection: React.FC<LifeOSSectionProps> = ({ individuals, allReports, speak, currentSpeakingId, stopSpeaking }) => {
  const [user, setUser] = useState<any>(null); // Firebase user
  const [profiles, setProfiles] = useState<LifeOSProfile[]>([]);
  const [view, setView] = useState<'dashboard' | 'quiz' | 'profile'>('dashboard');
  const [activeProfile, setActiveProfile] = useState<LifeOSProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Auth & Data Sync
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
            await signInAnonymously(auth); 
        } else {
            await signInAnonymously(auth);
        }
      } catch (e) {
          console.error("Auth failed", e);
      }
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) {
        if (!auth) setLoading(false);
        return;
    }
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'));
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as Omit<LifeOSProfile, 'id'> }));
      setProfiles(data);
      setLoading(false);
    }, (err: any) => {
      console.error("Firestore Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-Start for Primary User if no profile exists
  useEffect(() => {
    if (!loading && profiles.length === 0 && individuals.length > 0 && !hasAutoStarted) {
      const primary = individuals.find(ind => ind.role === 'primary');
      if (primary) {
        setHasAutoStarted(true);
        handleStartNew(primary.id);
      }
    }
  }, [loading, profiles, individuals, hasAutoStarted]);


  // --- ACTIONS ---

  const handleStartNew = (personIdToLink: string) => {
    const person = individuals.find(ind => ind.id === personIdToLink);
    if (!person) {
      alert("Selected individual not found.");
      return;
    }
    
    setActiveProfile({ 
      id: undefined, // Will be set on save
      personId: personIdToLink,
      name: person.name,
      role: person.role || 'Member',
      answers: {},
      arch: DEFAULT_PROFILE_ARCH,
      personalizedQuestions: [] // Will be generated in QuizWizard
    });
    setView('quiz');
  };

  const handleViewProfile = (profile: LifeOSProfile) => {
    setActiveProfile(profile);
    setView('profile');
  };

  const handleDelete = async (id?: string) => {
    if(!id || !db) return;
    if(!confirm("Delete this user profile?")) return;
    if(view === 'profile') setView('dashboard');
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', id));
    } catch (e) {
        console.error("Delete failed", e);
        alert("Failed to delete profile.");
    }
  }

  // --- RENDERERS ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
          <Cpu size={48} className="animate-spin-slow text-emerald-500 relative z-10" />
        </div>
        <span className="animate-pulse tracking-widest font-mono text-xs uppercase text-emerald-500/80">Initializing LYFE_OS Systems...</span>
      </div>
    </div>
  );
  
  if (!auth) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono">Lyfe OS Unavailable (Configuration Missing)</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-200 font-sans selection:bg-emerald-500/30 rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-50"></div>
      
      {/* Header - Minimal for embedded component */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 hidden lg:block"> 
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-400 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
               <Cpu size={18} className="group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <span className="font-bold tracking-[0.2em] font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-sm">LYFE_OS v1.0</span>
          </div>
          {view !== 'dashboard' && (
            <button 
              onClick={() => setView('dashboard')}
              className="text-[10px] font-mono text-slate-500 hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-2"
            >
              <LayoutGrid size={12} /> Dashboard
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard 
            profiles={profiles} 
            individuals={individuals}
            onNew={handleStartNew} 
            onSelect={handleViewProfile} 
          />
        )}
        
        {view === 'quiz' && activeProfile && (
          <QuizWizard 
            initialData={activeProfile}
            allReports={allReports}
            individuals={individuals}
            onCancel={() => setView('dashboard')}
            onComplete={(data) => {
              setActiveProfile(data);
              setView('profile');
            }}
            speak={speak} // Pass speak prop
            currentSpeakingId={currentSpeakingId} // Pass speaking status ID
          />
        )}

        {view === 'profile' && activeProfile && (
          <ProfileView 
            profile={activeProfile} 
            allReports={allReports}
            individuals={individuals}
            onBack={() => setView('dashboard')}
            onDelete={() => handleDelete(activeProfile.id)}
            speak={speak} // Pass speak prop
            currentSpeakingId={currentSpeakingId} // Pass speaking status ID
          />
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

interface DashboardProps {
  profiles: LifeOSProfile[];
  individuals: IndividualBirthData[];
  onNew: (personId: string) => void;
  onSelect: (profile: LifeOSProfile) => void;
}

function Dashboard({ profiles, individuals, onNew, onSelect }: DashboardProps) {
  const [selectedIndividualId, setSelectedIndividualId] = useState<string | null>(null);

  useEffect(() => {
    if (individuals.length > 0 && !selectedIndividualId) {
      // Auto-select primary if available, otherwise first
      setSelectedIndividualId(individuals.find(ind => ind.role === 'primary')?.id || individuals[0].id);
    }
  }, [individuals, selectedIndividualId]);

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4 py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight relative z-10">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Lyfe Operating System
          </span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed relative z-10">
          Map your internal psychology. Identify your bugs. <br/>
          <span className="text-emerald-400 font-semibold shadow-emerald-500/20 drop-shadow-sm">Upgrade your human experience.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Profile Card */}
        <div className="group relative h-72 rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all duration-500 flex flex-col items-center justify-center gap-6 text-slate-500 hover:text-emerald-400 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] relative z-10">
            <BrainCircuit size={36} />
          </div>
          
          <div className="flex flex-col gap-3 w-4/5 items-center relative z-10">
            <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">Initialize New User</span>
            <div className="relative w-full group/select">
              <select
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all hover:bg-slate-900 appearance-none cursor-pointer pl-4"
                  value={selectedIndividualId || ''}
                  onChange={(e) => setSelectedIndividualId(e.target.value)}
              >
                  <option value="" disabled>Select Individual</option>
                  {individuals.map(ind => (
                  <option key={ind.id} value={ind.id}>{ind.name} {ind.role ? `(${ind.role})` : ''}</option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-emerald-400 transition-colors">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
            <button 
                onClick={() => selectedIndividualId && onNew(selectedIndividualId)}
                disabled={!selectedIndividualId}
                className="w-full mt-1 px-6 py-3 bg-white text-slate-950 font-bold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
                START SEQUENCE <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Existing Profiles */}
        {profiles.map((p, i) => {
          const person = individuals.find(ind => ind.id === p.personId);
          return (
            <div 
              key={p.id}
              onClick={() => onSelect(p)}
              className="group relative h-72 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 overflow-hidden animate-slide-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/30 shadow-inner">
                         <User size={24} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{p.role}</span>
                          {person && <span className="text-[10px] text-slate-600">• {person.name}</span>}
                        </div>
                    </div>
                </div>
                <div className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-600 group-hover:text-white">
                  <ArrowRight size={18} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
              </div>
              
              <div className="space-y-4 relative z-10 bg-slate-950/50 p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500 uppercase tracking-wider">Fuel Source</span>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                     <Battery size={12} />
                     <span className="truncate max-w-[100px] font-bold">{p.arch?.fuel !== 'Not Analyzed' ? p.arch?.fuel : '...'}</span>
                  </div>
                </div>
                
                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full ${p.arch?.fuel !== 'Not Analyzed' ? 'w-3/4 animate-shimmer' : 'w-0'} transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-mono text-amber-500/80 pt-1">
                  <ShieldAlert size={12} />
                  <span>{p.arch?.bugs?.length || 0} Vulnerabilities Detected</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface QuizWizardProps {
  initialData: LifeOSProfile;
  allReports: AllReports;
  individuals: IndividualBirthData[];
  onCancel: () => void;
  onComplete: (data: LifeOSProfile) => void;
  // New: Add speak and isSpeaking props
  speak: (text: string, id: string) => Promise<void>;
  currentSpeakingId: string | null;
}

function QuizWizard({ initialData, allReports, individuals, onCancel, onComplete, speak, currentSpeakingId }: QuizWizardProps) {
  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState<LifeOSProfile>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<PersonalizedQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  
  // New state for additional question generation
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  const [isSpeechToTextListening, setIsSpeechToTextListening] = useState(false);
  const [currentSpeechTranscript, setCurrentSpeechTranscript] = useState('');
  // Correctly type recognitionRef as SpeechRecognition or null
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for SpeechRecognition API support
  // Fix: Assign the constructor from window to a variable
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechApiSupported = !!SpeechRecognitionAPI;


  const currentIndividual = useMemo(() => 
    individuals.find(ind => ind.id === formData.personId)
  , [individuals, formData.personId]);

  const currentHDSChart = useMemo(() => 
    allReports.humanDesignCharts.find(chart => chart.personId === formData.personId)
  , [allReports.humanDesignCharts, formData.personId]);

  const currentNumChart = useMemo(() => 
    allReports.numerologyReports.find(chart => chart.personId === formData.personId)
  , [allReports.numerologyReports, formData.personId]);

  const currentAstroChart = useMemo(() => 
    allReports.astrologyCharts.find(chart => chart.personId === formData.personId)
  , [allReports.astrologyCharts, formData.personId]);

  // Initial Question Generation
  useEffect(() => {
    const fetchQuestions = async () => {
      // 1. If personalized questions are already part of the initial data (e.g., loaded from Firestore), use them directly.
      if (formData.personalizedQuestions && formData.personalizedQuestions.length > 0) {
        setQuestions(formData.personalizedQuestions);
        setIsGeneratingQuestions(false);
        return;
      }

      // 2. If all necessary individual and chart reports are available, attempt to generate personalized questions.
      if (currentIndividual && currentHDSChart && currentNumChart && currentAstroChart) {
        setIsGeneratingQuestions(true);
        setQuestionError(null);
        try {
          // generatePersonalizedQuestions dynamically crafts questions based on the specific chart data
          const generatedQuestions = await generatePersonalizedQuestions(
            currentIndividual,
            currentHDSChart,
            currentNumChart,
            currentAstroChart
          );
          setQuestions(generatedQuestions);
          setFormData(prev => ({ ...prev, personalizedQuestions: generatedQuestions }));
        } catch (error) {
          // 3a. Fallback: If generation fails, use a set of default, general but insightful questions.
          console.error("Failed to generate personalized questions:", error);
          setQuestionError("Failed to generate personalized questions. Using default questions.");
          setQuestions(DEFAULT_QUESTIONS); 
          setFormData(prev => ({ ...prev, personalizedQuestions: DEFAULT_QUESTIONS }));
        } finally {
          setIsGeneratingQuestions(false);
        }
      } else {
        // 3b. Fallback: If any essential chart data is missing, use the default questions.
        setQuestions(DEFAULT_QUESTIONS);
        setIsGeneratingQuestions(false);
      }
    };
    fetchQuestions();
  }, [currentIndividual, currentHDSChart, currentNumChart, currentAstroChart, formData.personId, formData.personalizedQuestions]);

  // Introduction Speech Logic
  useEffect(() => {
    if (step === 0 && !isGeneratingQuestions && !questionError && formData.name) {
       const introText = `Identity detected: ${formData.name}. I am the Architect. I have initialized your energetic blueprint. Before we build your system, I need to calibrate your psychological drivers. Please confirm your role to begin the sequence.`;
       speak(introText, 'architect-intro');
    }
  }, [step, isGeneratingQuestions, questionError, formData.name, speak]);

  const currentAnswer = formData.answers[questions[step - 1]?.id] || '';

  const startSpeechToText = useCallback(() => {
    if (!isSpeechApiSupported) {
      alert("Speech-to-Text is not supported in your browser.");
      return;
    }
    if (isSpeechToTextListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Fix: Use the SpeechRecognitionAPI variable
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsSpeechToTextListening(true);
      setCurrentSpeechTranscript(''); // Clear previous transcript
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setCurrentSpeechTranscript(interimTranscript); // Display interim results live
      
      if (finalTranscript) {
        // Append final results to the form data
        setFormData(prev => ({
          ...prev,
          answers: {
            ...prev.answers,
            [questions[step - 1].id]: (prev.answers[questions[step - 1].id] || '') + finalTranscript + ' '
          }
        }));
        setCurrentSpeechTranscript(''); // Clear interim after committing final
      }
    };

    recognition.onend = () => {
      setIsSpeechToTextListening(false);
      // Ensure any remaining interim text is committed as final if speech ends without a final result
      if (currentSpeechTranscript) {
        setFormData(prev => ({
          ...prev,
          answers: {
            ...prev.answers,
            [questions[step - 1].id]: (prev.answers[questions[step - 1].id] || '') + currentSpeechTranscript + ' '
          }
        }));
        setCurrentSpeechTranscript('');
      }
      console.log('Speech recognition ended');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsSpeechToTextListening(false);
      console.error('Speech recognition error', event.error);
      alert(`Speech recognition error: ${event.error}. Please ensure microphone access.`);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSpeechApiSupported, isSpeechToTextListening, currentSpeechTranscript, formData, questions, step]);

  useEffect(() => {
    // Stop speech recognition if component unmounts or step changes
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [step]); // Dependency on step to ensure it stops when navigating


  const handleNext = async () => {
    if (isSpeechToTextListening) {
      recognitionRef.current?.stop(); // Stop speech recognition before proceeding
    }

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      if (!db) {
        alert("Cannot save: Database not connected.");
        return;
      }
      setIsSaving(true);
      try {
        let docRef;
        const profileToSave: LifeOSProfile = {
          ...formData,
          personalizedQuestions: questions 
        };

        if (profileToSave.id) {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', profileToSave.id), profileToSave);
          docRef = { id: profileToSave.id };
        } else {
          const col = collection(db, 'artifacts', appId, 'public', 'data', 'profiles');
          docRef = await addDoc(col, profileToSave);
        }

        onComplete({ ...profileToSave, id: docRef.id });
      } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save profile.");
      }
      setIsSaving(false);
    }
  };

  const handlePrev = () => {
    if (isSpeechToTextListening) {
      recognitionRef.current?.stop(); // Stop speech recognition before navigating
    }
    setStep(step - 1);
  };

  const handleGenerateNewQuestion = async () => {
    if (!currentIndividual || !currentHDSChart || !currentNumChart || !currentAstroChart) return;
    
    setIsAddingQuestion(true);
    try {
      const newQuestion = await generateSinglePersonalizedQuestion(
        currentIndividual,
        currentHDSChart,
        currentNumChart,
        currentAstroChart,
        questions
      );
      
      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);
      setFormData(prev => ({
        ...prev,
        personalizedQuestions: updatedQuestions,
        answers: { ...prev.answers, [newQuestion.id]: '' } // Initialize empty answer
      }));
      setStep(updatedQuestions.length); // Jump to the new question
    } catch (e) {
      console.error("Failed to add question", e);
      alert("The Architect could not formulate a new query at this time.");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  if (step === 0) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900/50 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none -mr-12 -mt-12"></div>
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
           <div className={`p-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 ${isGeneratingQuestions ? 'animate-pulse' : ''}`}>
              <BrainCircuit size={28} className="text-emerald-400" />
           </div>
           <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">User Initialization</h2>
        </div>
        
        {isGeneratingQuestions ? (
          <div className="text-center py-12 space-y-8">
             <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-4 bg-slate-900 rounded-full border border-emerald-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <BrainCircuit size={32} className="text-emerald-400 animate-pulse" />
                </div>
             </div>
            <div className="space-y-3">
                <p className="text-xl text-white font-bold tracking-tight">Scanning Energetic Blueprint...</p>
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-slate-400 text-sm font-mono flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Human Design Analysis</p>
                  <p className="text-slate-400 text-sm font-mono flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Numerology Synthesis</p>
                  <p className="text-slate-400 text-sm font-mono flex items-center gap-2"><Activity size={12} className="text-emerald-500 animate-bounce" /> Generating Queries...</p>
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="block text-xs font-mono text-emerald-400 mb-1 tracking-[0.2em] uppercase font-bold">Target User Identity</label>
              <div className="relative">
                <input 
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all pl-12"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Dad"
                  disabled 
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-mono text-emerald-400 mb-1 tracking-[0.2em] uppercase font-bold">System Role Designation</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all appearance-none cursor-pointer pl-12"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Member">Member</option>
                  <option value="Dad">Dad</option>
                  <option value="Mom">Mom</option>
                  <option value="Child">Child</option>
                  <option value="Other">Other</option>
                </select>
                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" size={18} />
              </div>
            </div>

            {questionError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                 <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14}/> {questionError}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
              <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:text-white transition-colors text-sm font-medium">Cancel Protocol</button>
              <button 
                disabled={!formData.name || !questions.length} 
                onClick={handleNext} 
                className="px-8 py-4 bg-white text-slate-950 hover:bg-emerald-50 font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Initiate Query Sequence <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const qIndex = step - 1;
  const question = questions[qIndex];
  if (!question) return <div className="text-center text-red-400">Error: Question not found.</div>;

  const isPlaying = currentSpeakingId === `lifeos-q-${question.id}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 bg-slate-950/50 p-4 rounded-full border border-white/5">
        <span className="flex items-center gap-2"><Activity size={14} className="text-emerald-500"/> DATA_COLLECTION_MODULE</span>
        <span className="text-emerald-500 font-bold">{step} <span className="text-slate-700 mx-2">/</span> {questions.length}</span>
      </div>
      
      <div className="h-1.5 bg-slate-900/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-white transition-all duration-700 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
          style={{ width: `${(step / questions.length) * 100}%` }}
        />
      </div>

      <div 
        key={question.id} 
        className="bg-slate-900/60 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] border border-white/10 shadow-2xl min-h-[450px] flex flex-col relative overflow-hidden group animate-in slide-in-from-bottom-8 fade-in duration-500"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none" />
        
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            QUERY_{question.id.toUpperCase()}
          </div>
          
          <div className="space-y-4 relative pr-8"> {/* Added pr-8 for speaker button */}
             <button
                onClick={() => speak(`${question.label}. ${question.text}`, `lifeos-q-${question.id}`)}
                className={`absolute top-0 right-0 p-2 rounded-full transition-all duration-200 ${isPlaying ? 'text-brand-accent animate-pulse' : 'text-slate-500 hover:text-emerald-400'}`}
                aria-label={isPlaying ? "Stop" : `Listen to question: ${question.label}`}
              >
                {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
             <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">{question.label}</h3>
             <p className="text-slate-300 text-lg md:text-xl leading-relaxed font-light">{question.text}</p>
          </div>
          
          <div className="relative group/input">
            <textarea
              className={`w-full h-40 bg-black/20 border rounded-2xl p-6 text-white text-lg 
                focus:outline-none resize-none custom-scrollbar transition-all placeholder:text-slate-600 shadow-inner 
                ${isSpeechToTextListening 
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-slate-950/50' 
                  : 'border-white/10 focus:border-emerald-500/50 focus:bg-slate-950/50 focus:ring-4 focus:ring-emerald-500/10'
                }
              `}
              placeholder={isSpeechToTextListening ? "Listening..." : "Input analysis data..."}
              value={currentAnswer + (isSpeechToTextListening ? currentSpeechTranscript : '')} // Show live transcript when listening
              onChange={e => {
                // When actively listening, changes should only come from STT,
                // so we prevent direct typing from interfering with live transcript,
                // but allow it when not listening.
                if (!isSpeechToTextListening) {
                  setFormData({
                    ...formData, 
                    answers: { ...formData.answers, [question.id]: e.target.value }
                  });
                }
              }}
              autoFocus
            />
            {isSpeechApiSupported && (
              <button
                type="button"
                onClick={startSpeechToText}
                className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-300 backdrop-blur-sm
                  ${isSpeechToTextListening 
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500/50 opacity-100' 
                    : 'bg-white/5 text-slate-500 hover:text-emerald-400 hover:bg-white/10 border border-transparent opacity-0 group-hover/input:opacity-100 group-focus-within/input:opacity-100'
                  }
                `}
                aria-label={isSpeechToTextListening ? "Stop speech input" : "Start speech input"}
                title={isSpeechToTextListening ? "Stop Speech Input" : "Start Speech Input"}
              >
                {isSpeechToTextListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            {!isSpeechToTextListening && ( // Only show "Press Enter" hint when not listening
              <div className="absolute bottom-4 right-14 text-xs text-slate-600 pointer-events-none opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                Type or Record
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-12 pt-8 border-t border-white/5 relative z-10">
          <div className="flex justify-between items-center">
            <button 
              onClick={handlePrev} 
              className="text-slate-500 hover:text-white flex items-center gap-2 transition-colors px-4 py-2 hover:bg-white/5 rounded-lg" 
              disabled={step === 1}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              <ArrowRight size={16} className="rotate-180"/> Previous
            </button>
            <button 
              onClick={handleNext} 
              disabled={isSaving}
              className="px-8 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-emerald-50 hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Saving System...
                </>
              ) : (
                <>
                  {step === questions.length ? 'Generate OS' : 'Next Query'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          
          <div className="flex justify-center">
             <button
                onClick={handleGenerateNewQuestion}
                disabled={isAddingQuestion}
                className="text-xs font-mono text-emerald-400 hover:text-white border border-emerald-500/30 hover:bg-emerald-500/20 px-4 py-2 rounded-full transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isAddingQuestion ? (
                   <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                   <Sparkles size={12} />
                )}
                Generate Deep Dive Question
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProfileViewProps {
  profile: LifeOSProfile;
  allReports: AllReports;
  individuals: IndividualBirthData[];
  onBack: () => void;
  onDelete: () => void;
  // New: Add speak and isSpeaking props
  speak: (text: string, id: string) => Promise<void>;
  currentSpeakingId: string | null;
}

function ProfileView({ profile, allReports, individuals, onBack, onDelete, speak, currentSpeakingId }: ProfileViewProps) {
  const [mode, setMode] = useState<'view' | 'analyze'>('view');
  const [editedArch, setEditedArch] = useState<LifeOSProfileArch>(profile.arch || DEFAULT_PROFILE_ARCH);
  const [currentJsonInput, setCurrentJsonInput] = useState<string>(JSON.stringify(profile.arch || DEFAULT_PROFILE_ARCH, null, 2));
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('analytical-architect'); // New state for AI persona

  const AI_PERSONAS = useMemo(() => [
    {
      id: 'empathetic-guide',
      name: 'Empathetic Guide',
      instruction: 'You are a deeply empathetic guide, focusing on emotional well-being, fostering self-compassion, and gentle, supportive advice. Your analysis emphasizes personal growth and inner harmony.',
    },
    {
      id: 'analytical-architect',
      name: 'Analytical Architect',
      instruction: 'You are a logical and structured system architect. Your analysis focuses on identifying inefficiencies, optimizing processes, and designing clear, actionable solutions for maximum effectiveness and resilience.',
    },
    {
      id: 'intuitive-coach',
      name: 'Intuitive Coach',
      instruction: 'You are an intuitive life coach, providing creative insights, encouraging flow states, and connecting to deeper inner wisdom. Your analysis highlights innate talents and unconventional paths to fulfillment.',
    },
  ], []);

  const selectedPersona = useMemo(() => 
    AI_PERSONAS.find(p => p.id === selectedPersonaId) || AI_PERSONAS[1] // Default to Analytical Architect
  , [selectedPersonaId, AI_PERSONAS]);


  const associatedIndividual = useMemo(() => individuals.find(ind => ind.id === profile.personId), [individuals, profile.personId]);
  const associatedHDSChart = useMemo(() => allReports.humanDesignCharts.find(chart => chart.personId === profile.personId), [allReports.humanDesignCharts, profile.personId]);
  const associatedNumChart = useMemo(() => allReports.numerologyReports.find(chart => chart.personId === profile.personId), [allReports.numerologyReports, profile.personId]);
  const associatedAstroChart = useMemo(() => allReports.astrologyCharts.find(chart => chart.personId === profile.personId), [allReports.astrologyCharts, profile.personId]);

  const generatePrompt = useCallback(() => {
    let prompt = `${selectedPersona.instruction}\n\nAnalyze the following data for ${profile.name}. Output JSON only.`;
    prompt += JSON.stringify({
        bio: { name: profile.name, role: profile.role },
        energetic_blueprint: {
            hd: associatedHDSChart ? { type: associatedHDSChart.type.name, strategy: associatedHDSChart.strategy.name, profile: associatedHDSChart.profile.name } : null,
            astro: associatedAstroChart ? { sun: associatedAstroChart.sunSign.sign, moon: associatedAstroChart.moonSign.sign, rising: associatedAstroChart.ascendant.sign } : null,
            numerology: associatedNumChart ? { lifePath: associatedNumChart.lifePathNumber } : null
        },
        user_responses: profile.answers
    }, null, 2);
    return prompt;
  }, [profile, associatedHDSChart, associatedNumChart, associatedAstroChart, selectedPersona]);

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatePrompt());
    alert("Prompt copied to clipboard.");
  };

  const saveAnalysis = async () => {
    if (!db || jsonError) return;
    
    // Confirmation dialog added here
    const isConfirmed = window.confirm(
      "Are you sure you want to commit these changes to the Lyfe OS profile? This will update the system architecture."
    );
    if (!isConfirmed) {
      return; // Abort save if not confirmed
    }

    try {
        const dataToSave: LifeOSProfileArch = JSON.parse(currentJsonInput);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', profile.id!), { arch: dataToSave });
        setEditedArch(dataToSave);
        alert("System Updated.");
        setMode('view');
    } catch (e: any) {
        alert(`Error: ${e.message}`);
    }
  };

  const handleJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setCurrentJsonInput(newVal);
      setJsonError(null);
      try {
        const parsed = JSON.parse(newVal);
        if (!parsed.coreDrive || !parsed.fuel) throw new Error("Missing required fields");
        setEditedArch(parsed as LifeOSProfileArch);
      } catch (e: any) {
        setJsonError(e.message || "Invalid JSON");
      }
  }

  useEffect(() => {
    setCurrentJsonInput(JSON.stringify(profile.arch || DEFAULT_PROFILE_ARCH, null, 2));
    setEditedArch(profile.arch || DEFAULT_PROFILE_ARCH);
    setJsonError(null);
  }, [profile.arch]);


  const getReportSummary = (chart: HumanDesignChart | NumerologyChart | AstrologyChart | undefined, type: string) => {
    if (!chart) return <p className="text-slate-600 italic text-xs py-1">No {type} report found.</p>;
    if (type === 'Human Design') {
      const hdChart = chart as HumanDesignChart;
      return <div className="text-[10px] text-slate-400 space-y-0.5 mt-1"><p className="text-white font-semibold">{hdChart.type.name}</p><p>{hdChart.profile.name}</p></div>;
    } else if (type === 'Numerology') {
      const numChart = chart as NumerologyChart;
      return <div className="text-[10px] text-slate-400 space-y-0.5 mt-1"><p>LP: <span className="text-white font-semibold">{numChart.lifePathNumber}</span></p><p>Exp: {numChart.expressionNumber}</p></div>;
    } else if (type === 'Astrology') {
      const astroChart = chart as AstrologyChart;
      // Enhanced summary for Astrology to include concise descriptions
      const truncate = (text: string, length: number) => text.length > length ? text.substring(0, length) + '...' : text;
      return (
        <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
          <p>Sun: <span className="text-white font-semibold">{astroChart.sunSign.sign}</span><span className="text-slate-500 ml-1">({truncate(astroChart.sunSign.description, 40)})</span></p>
          <p>Moon: <span className="text-white font-semibold">{astroChart.moonSign.sign}</span><span className="text-slate-500 ml-1">({truncate(astroChart.moonSign.description, 40)})</span></p>
          <p>Asc: <span className="text-white font-semibold">{astroChart.ascendant.sign}</span><span className="text-slate-500 ml-1">({truncate(astroChart.ascendant.description, 40)})</span></p>
        </div>
      );
    }
    return null;
  };

  // Helper for Fuel Analysis
  const getFuelAttributes = (fuel: string) => {
    const text = fuel.toLowerCase();
    if (text.match(/drain|fear|stress|anxiety|burnout|deplet/)) {
      return { level: 1, color: 'bg-red-500', shadow: 'shadow-red-500/50', icon: ShieldAlert, iconColor: 'text-red-400' };
    }
    if (text.match(/duty|obligation|work|money|surviv/)) {
      return { level: 3, color: 'bg-amber-500', shadow: 'shadow-amber-500/50', icon: Battery, iconColor: 'text-amber-400' };
    }
    // Default High/Positive
    return { level: 5, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50', icon: Flame, iconColor: 'text-emerald-400' };
  };

  // Helper for Core Drive Analysis
  const getDriveAttributes = (drive: string) => {
    const text = drive.toLowerCase();
    if (text.match(/logic|mind|analy|strat|intellect/)) {
      return { type: 'logic', icon: Cpu, color: 'text-blue-400', borderColor: 'border-blue-500/20' };
    }
    if (text.match(/emotion|feel|gut|instinct|intuit/)) {
      return { type: 'organic', icon: Activity, color: 'text-rose-400', borderColor: 'border-rose-500/20' };
    }
    if (text.match(/safe|secur|control|order|stabil/)) {
        return { type: 'structure', icon: Shield, color: 'text-indigo-400', borderColor: 'border-indigo-500/20' };
    }
    return { type: 'reactor', icon: Lightbulb, color: 'text-amber-400', borderColor: 'border-amber-500/20' };
  };

  const fuelAttrs = getFuelAttributes(editedArch.fuel);
  const driveAttrs = getDriveAttributes(editedArch.coreDrive);

  const pId = profile.personId;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group px-4 py-2 hover:bg-white/5 rounded-lg">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Grid
        </button>
        <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'view' ? 'analyze' : 'view')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono uppercase transition-all shadow-lg ${mode === 'analyze' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-900/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-white'}`}>
                <Terminal size={14} /> {mode === 'view' ? 'System Console' : 'Close Console'}
            </button>
            <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Col: The Data (Answers) */}
        <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none -mr-10 -mt-10"></div>
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center border border-white/10 shadow-inner group">
                        <User size={32} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                        <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded inline-block mt-1">{profile.role} {associatedIndividual ? `• ${associatedIndividual.name}` : ''}</p>
                    </div>
                </div>
                
                <div className="space-y-3 mb-8">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2 font-bold">
                      <Sparkles size={12} className="text-indigo-400" /> Energetic Blueprint
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">HDS</span>
                      </div>
                      {getReportSummary(associatedHDSChart, 'Human Design')}
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">NUM</span>
                      </div>
                      {getReportSummary(associatedNumChart, 'Numerology')}
                    </div>
                    <div 
                      className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all relative group cursor-pointer" 
                      onClick={() => associatedAstroChart && setIsChartModalOpen(true)} // Make clickable
                      role="button" // Add role for accessibility
                      tabIndex={0} // Make focusable
                      aria-label={associatedAstroChart ? `View ${associatedAstroChart.name}'s Natal Chart` : 'No Astrology report found'} // A11y
                    >
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">ASTRO</span>
                      </div>
                      {getReportSummary(associatedAstroChart, 'Astrology')}
                      {associatedAstroChart && (
                        <div className="absolute inset-0 bg-violet-600/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm cursor-pointer">
                           <span className="text-[9px] font-bold text-white flex flex-col items-center gap-1"><Sparkles size={12}/>VIEW</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase mb-4 tracking-widest font-bold border-t border-white/5 pt-4">Diagnostic Data</h3>
                  <div className="space-y-4 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                      {(profile.personalizedQuestions || DEFAULT_QUESTIONS).map((q, i) => (
                          <div key={q.id} className="group p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5">
                              <h4 className="text-emerald-500/70 text-[10px] font-bold uppercase mb-1 flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                                  {q.label}
                              </h4>
                              <p className="text-slate-300 text-xs leading-relaxed pl-3 border-l border-slate-800 group-hover:border-emerald-500/30 transition-colors">{profile.answers[q.id] || "—"}</p>
                          </div>
                      ))}
                  </div>
                </div>
            </div>
        </div>

        {/* Right Col: The Architecture */}
        <div className="xl:col-span-8 space-y-6">
            
            {mode === 'analyze' && (
                <div className="bg-black border border-emerald-500/30 rounded-xl p-0 relative overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 mb-8">
                    <div className="bg-slate-900/80 border-b border-emerald-500/20 p-3 flex justify-between items-center">
                        <h3 className="font-mono text-emerald-400 text-xs flex items-center gap-2 font-bold tracking-wider">
                            <Terminal size={14} /> SYSTEM_ARCHITECT_CONSOLE
                        </h3>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest font-bold">>> STEP 1: SELECT_ARCHITECT_PERSONA</p>
                            <div className="relative group/select">
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all hover:bg-slate-900 appearance-none cursor-pointer pl-4"
                                    value={selectedPersonaId}
                                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                                    aria-label="Select AI Architect Persona"
                                >
                                    {AI_PERSONAS.map(persona => (
                                        <option key={persona.id} value={persona.id}>{persona.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/select:text-emerald-400 transition-colors">
                                  <ChevronRight size={14} className="rotate-90" />
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 italic mt-2 relative pr-8">
                              <button
                                onClick={() => speak(selectedPersona.instruction, `lifeos-persona-${selectedPersona.id}`)}
                                className={`absolute top-0 right-0 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `lifeos-persona-${selectedPersona.id}` ? 'text-emerald-400 animate-pulse' : 'text-slate-500 hover:text-emerald-400'}`}
                                aria-label={currentSpeakingId === `lifeos-persona-${selectedPersona.id}` ? "Stop" : `Listen to ${selectedPersona.name} instruction`}
                              >
                                {currentSpeakingId === `lifeos-persona-${selectedPersona.id}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                              </button>
                              {selectedPersona.instruction}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest font-bold">>> STEP 2: EXTRACT_DIAGNOSTICS</p>
                            <button onClick={copyPrompt} className="w-full p-4 bg-slate-900 rounded-lg border border-slate-800 group hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all text-left group">
                                <div className="flex items-center justify-between text-slate-400 group-hover:text-white mb-2 transition-colors">
                                    <span className="text-xs font-mono font-bold">COPY_DATA_TO_CLIPBOARD</span>
                                    <Copy size={14} className="group-hover:scale-110 transition-transform"/>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                                    <div className="h-full w-0 group-hover:w-full bg-emerald-500/50 transition-all duration-700"></div>
                                </div>
                            </button>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest font-bold">>> STEP 3: INJECT_KERNEL_UPDATE</p>
                            <textarea 
                                className={`w-full h-32 bg-slate-950 border rounded-lg p-3 text-[10px] font-mono focus:outline-none custom-scrollbar transition-colors leading-relaxed 
                                  ${jsonError ? 'border-red-500/50 text-red-400' : 'border-slate-800 text-emerald-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10'}
                                `}
                                placeholder='// Paste valid JSON kernel here...'
                                value={currentJsonInput}
                                onChange={handleJsonInputChange}
                                spellCheck={false}
                            />
                            {jsonError && (
                                <p className="text-[10px] text-red-500 flex items-center gap-1 animate-pulse font-mono">
                                    <AlertCircle size={10} /> {jsonError}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex justify-end">
                         <button 
                            onClick={saveAnalysis} 
                            disabled={!!jsonError}
                            className={`px-4 py-2 text-white text-xs font-bold font-mono rounded flex items-center gap-2 transition-all ${jsonError ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}
                         >
                            <Save size={14} /> COMMIT_CHANGES
                         </button>
                    </div>
                </div>
            )}

            {/* Core Architecture Display */}
            <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Core Drive Visualization */}
                  <div className={`bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:${driveAttrs.borderColor.replace('20', '30')} transition-all duration-500 animate-fade-in`}>
                    <div className={`absolute -right-8 -top-8 w-40 h-40 ${driveAttrs.color.replace('text-', 'bg-')}/10 rounded-full blur-3xl pointer-events-none group-hover:${driveAttrs.color.replace('text-', 'bg-')}/20 transition-all duration-500`}></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                           <div className={`w-10 h-10 rounded-xl ${driveAttrs.color.replace('text-', 'bg-')}/10 flex items-center justify-center border ${driveAttrs.borderColor} shadow-sm group-hover:scale-110 transition-transform`}>
                               <driveAttrs.icon size={20} className={driveAttrs.color} />
                           </div>
                           <h4 className={`text-xs font-mono ${driveAttrs.color} opacity-80 uppercase tracking-widest font-bold`}>Core Drive</h4>
                        </div>
                        <p className="text-3xl font-bold text-white mb-8 leading-tight drop-shadow-md pr-8">
                            {editedArch.coreDrive}
                            <button
                                onClick={() => speak(`Core Drive: ${editedArch.coreDrive}`, `lifeos-drive-${pId}`)}
                                className={`absolute top-0 right-0 p-2 rounded-full transition-all duration-200 ${currentSpeakingId === `lifeos-drive-${pId}` ? 'text-brand-accent animate-pulse' : `text-slate-500 hover:${driveAttrs.color}`}`}
                                aria-label={currentSpeakingId === `lifeos-drive-${pId}` ? "Stop" : `Listen to core drive`}
                              >
                                {currentSpeakingId === `lifeos-drive-${pId}` ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </p>
                      </div>
                      
                      {/* Dynamic Drive Visualizer */}
                      <div className={`h-24 w-full bg-slate-950/50 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center group-hover:${driveAttrs.borderColor} transition-colors`}>
                          {driveAttrs.type === 'logic' && (
                              // Digital Rain / Grid look
                              <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-1 p-2 opacity-50">
                                  {[...Array(18)].map((_,i) => <div key={i} className={`bg-blue-500/20 rounded-sm animate-pulse`} style={{animationDelay: `${i*100}ms`}}></div>)}
                              </div>
                          )}
                          {driveAttrs.type === 'organic' && (
                              // Pulse / Wave look
                              <>
                               <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-16 h-16 bg-rose-500/20 rounded-full animate-ping"></div>
                                  <div className="w-12 h-12 bg-rose-500/40 rounded-full animate-pulse absolute"></div>
                               </div>
                              </>
                          )}
                          {(driveAttrs.type === 'structure' || driveAttrs.type === 'reactor') && (
                               // Reactor look (default)
                               <>
                                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] animate-shimmer"></div>
                                  <div className={`w-48 h-48 rounded-full border ${driveAttrs.borderColor} absolute animate-[spin_12s_linear_infinite]`}></div>
                                  <div className={`w-32 h-32 rounded-full border ${driveAttrs.borderColor} absolute animate-[spin_8s_linear_infinite_reverse] border-dashed`}></div>
                                  <div className={`w-3 h-3 rounded-full ${driveAttrs.color.replace('text-', 'bg-')} shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse relative z-10`}></div>
                               </>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Fuel Visualization */}
                  <div className={`bg-gradient-to-br from-slate-900/60 to-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:${fuelAttrs.color.replace('bg-', 'border-').replace('500', '500/30')} transition-all duration-500 animate-fade-in`} style={{ animationDelay: '100ms' }}>
                    <div className={`absolute -right-8 -top-8 w-40 h-40 ${fuelAttrs.color.replace('bg-', 'bg-').replace('500', '500/10')} rounded-full blur-3xl pointer-events-none group-hover:${fuelAttrs.color.replace('bg-', 'bg-').replace('500', '500/20')} transition-all duration-500`}></div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                         <div className="flex items-center gap-3 mb-6">
                           <div className={`w-10 h-10 rounded-xl ${fuelAttrs.color.replace('bg-', 'bg-').replace('500', '500/10')} flex items-center justify-center border ${fuelAttrs.color.replace('bg-', 'border-').replace('500', '500/20')} shadow-sm group-hover:scale-110 transition-transform`}>
                               <fuelAttrs.icon size={20} className={fuelAttrs.iconColor} />
                           </div>
                           <h4 className={`text-xs font-mono ${fuelAttrs.iconColor} opacity-80 uppercase tracking-widest font-bold`}>Fuel Source</h4>
                        </div>
                        <p className="text-3xl font-bold text-white mb-8 leading-tight drop-shadow-md pr-8">
                            {editedArch.fuel}
                            <button
                                onClick={() => speak(`Fuel Source: ${editedArch.fuel}`, `lifeos-fuel-${pId}`)}
                                className={`absolute top-0 right-0 p-2 rounded-full transition-all duration-200 ${currentSpeakingId === `lifeos-fuel-${pId}` ? 'text-brand-accent animate-pulse' : `text-slate-500 hover:${fuelAttrs.iconColor}`}`}
                                aria-label={currentSpeakingId === `lifeos-fuel-${pId}` ? "Stop" : `Listen to fuel source`}
                              >
                                {currentSpeakingId === `lifeos-fuel-${pId}` ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </p>
                      </div>
                      
                      {/* Dynamic Battery Bar */}
                       <div className={`flex gap-2 h-24 items-end justify-center bg-slate-950/50 rounded-2xl border border-white/5 p-6 group-hover:${fuelAttrs.color.replace('bg-', 'border-').replace('500', '500/20')} transition-colors`}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                                key={i} 
                                className={`w-full rounded-sm transition-all duration-1000 ${i <= fuelAttrs.level ? `${fuelAttrs.color} ${fuelAttrs.shadow} animate-shimmer` : 'bg-slate-800/50'}`} 
                                style={{ height: `${i * 20}%` }}
                            ></div>
                          ))}
                        </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <h4 className="flex items-center gap-3 text-xs font-bold text-amber-400 mb-6 uppercase tracking-widest">
                            <ShieldAlert size={18} /> System Vulnerabilities
                        </h4>
                        <ul className="space-y-4">
                            {editedArch.bugs.length > 0 ? editedArch.bugs.map((bug, i) => (
                                <li key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5 flex items-start gap-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group relative hover:-translate-x-0.5 hover:shadow-md">
                                    <button
                                        onClick={() => speak(`Bug ${i + 1}: ${bug}`, `lifeos-bug-${i}-${pId}`)}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `lifeos-bug-${i}-${pId}` ? 'text-emerald-400 animate-pulse' : 'text-slate-500 hover:text-amber-400'}`}
                                        aria-label={currentSpeakingId === `lifeos-bug-${i}-${pId}` ? "Stop" : `Listen to bug ${i + 1}`}
                                      >
                                        {currentSpeakingId === `lifeos-bug-${i}-${pId}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-amber-500/50 group-hover:bg-amber-400 group-hover:shadow-[0_0_10px_rgba(251,191,36,0.6)] transition-all flex-shrink-0"></div>
                                    <p className="text-slate-300 text-sm leading-relaxed pr-8">{bug}</p>
                                </li>
                            )) : <li className="text-slate-500 italic text-sm py-4 text-center">No bugs identified yet.</li>}
                        </ul>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{ animationDelay: '300ms' }}>
                        <h4 className="flex items-center gap-3 text-xs font-bold text-blue-400 mb-6 uppercase tracking-widest">
                            <Zap size={18} /> Optimization Patches
                        </h4>
                        <ul className="space-y-4">
                            {editedArch.patches.length > 0 ? editedArch.patches.map((patch, i) => (
                                <li key={i} className="bg-black/20 p-5 rounded-2xl border border-white/5 flex items-start gap-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group relative hover:-translate-x-0.5 hover:shadow-md">
                                    <button
                                        onClick={() => speak(`Patch ${i + 1}: ${patch}`, `lifeos-patch-${i}-${pId}`)}
                                        className={`absolute top-2 right-2 p-1 rounded-full transition-all duration-200 ${currentSpeakingId === `lifeos-patch-${i}-${pId}` ? 'text-emerald-400 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}
                                        aria-label={currentSpeakingId === `lifeos-patch-${i}-${pId}` ? "Stop" : `Listen to patch ${i + 1}`}
                                      >
                                        {currentSpeakingId === `lifeos-patch-${i}-${pId}` ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 group-hover:shadow-[0_0_10px_rgba(96,165,250,0.6)] transition-all flex-shrink-0"></div>
                                    <p className="text-slate-300 text-sm leading-relaxed pr-8">{patch}</p>
                                </li>
                            )) : <li className="text-slate-500 italic text-sm py-4 text-center">No patches applied yet.</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Natal Chart Modal */}
      {isChartModalOpen && associatedAstroChart && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsChartModalOpen(false)}
        >
          <div 
            className="dark bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative text-gray-200 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-20">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles size={20} className="text-indigo-400" /> 
                </div>
                {associatedAstroChart.name}'s Natal Chart
              </h3>
              <button 
                onClick={() => setIsChartModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="aspect-square bg-slate-950/50 rounded-full border border-slate-800 shadow-2xl p-4 flex items-center justify-center">
                  <NatalChart chart={associatedAstroChart} speak={speak} currentSpeakingId={currentSpeakingId} />
                </div>
                <div className="space-y-8">
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    <h4 className="text-indigo-400 font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> Core Placements</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                        <span className="text-slate-400 font-mono text-sm">Sun Sign</span>
                        <span className="text-white font-bold text-lg bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{associatedAstroChart.sunSign.sign}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/50 pb-3">
                        <span className="text-slate-400 font-mono text-sm">Moon Sign</span>
                        <span className="text-white font-bold text-lg bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{associatedAstroChart.moonSign.sign}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-mono text-sm">Rising Sign</span>
                        <span className="text-white font-bold text-lg bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{associatedAstroChart.ascendant.sign}</span>
                      </div>
                    </div>
                  </div>
                   <div>
                    <h4 className="text-indigo-400 font-bold mb-3 text-xs uppercase tracking-widest">Chart Summary</h4>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-lg">
                      {associatedAstroChart.overallSummary}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
