import { useState, useCallback, useEffect } from 'react';

export interface TTSService {
  speak: (text: string, lang?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  supported: boolean;
  currentRate: number;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private _voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<(state: { isPlaying: boolean; isPaused: boolean }) => void> = new Set();
  private _currentRate = 1;
  private _currentPitch = 1;
  private _currentVolume = 1;
  private _currentVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synthesis) {
      this._voices = this.synthesis.getVoices();
    }
  }

  get supported(): boolean {
    return this.synthesis !== null;
  }

  get voices(): SpeechSynthesisVoice[] {
    return this._voices;
  }

  get currentVoice(): SpeechSynthesisVoice | null {
    return this._currentVoice;
  }

  setVoice(voice: SpeechSynthesisVoice) {
    this._currentVoice = voice;
  }

  get currentRate(): number {
    return this._currentRate;
  }

  speak(text: string, lang: string = 'en-US'): void {
    if (!this.synthesis) {
      console.warn('Text-to-Speech not supported in this browser');
      return;
    }

    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = lang;
    this.utterance.rate = this._currentRate;
    this.utterance.pitch = this._currentPitch;
    this.utterance.volume = this._currentVolume;

    if (this._currentVoice) {
      this.utterance.voice = this._currentVoice;
    } else if (lang) {
      const voice = this._voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (voice) this.utterance.voice = voice;
    }

    this.utterance.onstart = () => this.notifyListeners({ isPlaying: true, isPaused: false });
    this.utterance.onpause = () => this.notifyListeners({ isPlaying: true, isPaused: true });
    this.utterance.onresume = () => this.notifyListeners({ isPlaying: true, isPaused: false });
    this.utterance.onend = () => this.notifyListeners({ isPlaying: false, isPaused: false });
    this.utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.notifyListeners({ isPlaying: false, isPaused: false });
    };

    this.synthesis.speak(this.utterance);
  }

  pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
      this.notifyListeners({ isPlaying: true, isPaused: true });
    }
  }

  resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
      this.notifyListeners({ isPlaying: true, isPaused: false });
    }
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.notifyListeners({ isPlaying: false, isPaused: false });
    }
  }

  setRate(rate: number): void {
    this._currentRate = Math.max(0.1, Math.min(2, rate));
    if (this.utterance) {
      this.utterance.rate = this._currentRate;
    }
  }

  setPitch(pitch: number): void {
    this._currentPitch = Math.max(0, Math.min(2, pitch));
    if (this.utterance) {
      this.utterance.pitch = this._currentPitch;
    }
  }

  setVolume(volume: number): void {
    this._currentVolume = Math.max(0, Math.min(1, volume));
    if (this.utterance) {
      this.utterance.volume = this._currentVolume;
    }
  }

  subscribe(listener: (state: { isPlaying: boolean; isPaused: boolean }) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(state: { isPlaying: boolean; isPaused: boolean }) {
    this.listeners.forEach(listener => listener(state));
  }
}

const ttsService = new TextToSpeechService();

export const useTTS = (): TTSService => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
    });
    return unsubscribe;
  }, []);

  const speak = useCallback((text: string, lang?: string) => {
    ttsService.speak(text, lang);
  }, []);

  const pause = useCallback(() => {
    ttsService.pause();
  }, []);

  const resume = useCallback(() => {
    ttsService.resume();
  }, []);

  const stop = useCallback(() => {
    ttsService.stop();
  }, []);

  const setRate = useCallback((rate: number) => {
    ttsService.setRate(rate);
  }, []);

  const setPitch = useCallback((pitch: number) => {
    ttsService.setPitch(pitch);
  }, []);

  const setVolume = useCallback((volume: number) => {
    ttsService.setVolume(volume);
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    ttsService.setVoice(voice);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    setRate,
    setPitch,
    setVolume,
    isPlaying,
    isPaused,
    supported: ttsService.supported,
    currentRate: ttsService.currentRate,
    voices: ttsService.voices,
    currentVoice: ttsService.currentVoice,
    setVoice,
  };
};

export const formatTextForTTS = (invoice: {
  invoiceNumber?: string;
  clientName?: string;
  total?: number | string;
  status?: string;
  items?: Array<{ name: string; quantity: number; price: number | string }>;
  dueDate?: string;
}): string => {
  const itemsText = invoice.items
    ?.map(item => {
      const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
      return `${item.name}, quantity ${item.quantity}, at ${price.toFixed(3)} TND each`;
    })
    .join('. ');

  const total = typeof invoice.total === 'number' ? invoice.total : Number(invoice.total) || 0;

  return `Invoice ${invoice.invoiceNumber || 'N/A'} for ${invoice.clientName || 'Unknown Client'}. 
    Status: ${invoice.status || 'Unknown'}. 
    ${itemsText ? `Items: ${itemsText}.` : ''}
    Total amount: ${total.toFixed(3)} TND.
    Due date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified'}.`;
};

export default ttsService;
