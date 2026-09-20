import { FoxState } from '../types';

const STORAGE_KEY = 'fox_pet_unity_save_data_v1';

export const DEFAULT_FOX_STATE: FoxState = {
  behavior: 'idle_standing',
  mood: 'content',
  x: 400,
  y: 340,
  facing: 'right',
  hunger: 85,
  energy: 90,
  happiness: 80,
  affection: 45,
  totalPets: 0,
  lastInteractionTime: Date.now(),
  lastSavedTime: Date.now(),
  isPetting: false,
  pettingIntensity: 0,
  toyPosition: null,
  poseTimer: 6,
  currentIdleIndex: 0,
  isSleepingInBed: false,
  isGoingToBed: false,
};

export interface SessionRestoreResult {
  state: FoxState;
  elapsedSeconds: number;
  welcomeMessage: string;
}

export function saveFoxStateToDisk(state: FoxState): boolean {
  try {
    const saveData = {
      ...state,
      lastSavedTime: Date.now(),
      isPetting: false,
      pettingIntensity: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    return true;
  } catch (err) {
    console.error('Failed to save fox state to disk:', err);
    return false;
  }
}

export function loadFoxStateFromDisk(): SessionRestoreResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        state: { ...DEFAULT_FOX_STATE, lastInteractionTime: Date.now(), lastSavedTime: Date.now() },
        elapsedSeconds: 0,
        welcomeMessage: 'Welcome! Your autonomous fox companion has just arrived.',
      };
    }

    const parsed = JSON.parse(raw);
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - (parsed.lastSavedTime || now)) / 1000));

    // Restore state intelligently based on elapsed offline time
    let restoredBehavior = parsed.behavior || 'idle_standing';
    let energy = parsed.energy ?? 80;
    let hunger = parsed.hunger ?? 80;
    let happiness = parsed.happiness ?? 80;

    let welcomeMessage = 'Welcome back! Your fox is happy to see you again.';

    if (elapsedSeconds > 300) {
      // If away for more than 5 minutes, fox likely fell asleep or took a restful nap
      restoredBehavior = 'sleeping';
      energy = Math.min(100, energy + 25);
      hunger = Math.max(20, hunger - 15);
      welcomeMessage = `Welcome back! You were away for ${Math.round(elapsedSeconds / 60)} minutes. The fox took a cozy nap and replenished energy.`;
    } else if (elapsedSeconds > 30) {
      welcomeMessage = `Welcome back! The fox was roaming quietly around while you stepped out.`;
    }

    const state: FoxState = {
      ...DEFAULT_FOX_STATE,
      ...parsed,
      behavior: restoredBehavior,
      energy,
      hunger,
      happiness,
      isPetting: false,
      pettingIntensity: 0,
      lastSavedTime: now,
      poseTimer: 4,
    };

    return {
      state,
      elapsedSeconds,
      welcomeMessage,
    };
  } catch (err) {
    console.warn('Error reading saved fox state, falling back to default:', err);
    return {
      state: { ...DEFAULT_FOX_STATE },
      elapsedSeconds: 0,
      welcomeMessage: 'New session started with default settings.',
    };
  }
}

export function clearFoxStateDisk(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
