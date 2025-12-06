
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// Safely access environment variable for API Key
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : (window as any).process?.env?.API_KEY;

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Initialize GoogleGenAI client (ensure API_KEY is available)
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
} else {
  console.warn("API_KEY for GoogleGenAI is not set. Text-to-speech will be unavailable.");
}

export const useTextToSpeech = () => {
  const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);

  // Initialize AudioContext on first interaction or component mount
  useEffect(() => {
    if (!audioContextRef.current) {
      // Lazily create AudioContext to avoid browser autoplay policy issues
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    return () => {
      // Clean up AudioContext on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current.disconnect();
      currentSourceRef.current = null;
    }
    setCurrentSpeakingId(null);
    nextStartTimeRef.current = 0; // Reset for next playback
  }, []);

  const speak = useCallback(async (text: string, id: string, onDone?: () => void) => {
    if (!ai || !audioContextRef.current) {
      console.error("Gemini API or AudioContext not initialized.");
      return;
    }

    // If clicking the same button that is currently playing, stop it.
    if (currentSpeakingId === id) {
        stopSpeaking();
        return;
    }

    stopSpeaking(); // Stop any other currently playing audio

    setCurrentSpeakingId(id);
    const audioContext = audioContextRef.current;
    
    try {
      // Ensure audio context is resumed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Using 'Kore' voice
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
      }

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000, // Sample rate as defined in API (24000 Hz)
        1,     // Number of channels (mono)
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.onended = () => {
        if (currentSourceRef.current === source) {
          setCurrentSpeakingId(null);
          nextStartTimeRef.current = 0;
          currentSourceRef.current = null;
          onDone?.();
        }
      };

      // Schedule playback
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(nextStartTimeRef.current, currentTime);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      currentSourceRef.current = source;

    } catch (error) {
      console.error("Error synthesizing or playing speech:", error);
      setCurrentSpeakingId(null);
      nextStartTimeRef.current = 0;
      currentSourceRef.current = null;
      onDone?.();
    }
  }, [currentSpeakingId, stopSpeaking]);

  return { speak, currentSpeakingId, stopSpeaking };
};
