export type FoxBehavior =
  | 'idle_standing'
  | 'idle_sitting'
  | 'idle_curled'
  | 'stretching'
  | 'yawning'
  | 'walking'
  | 'playing'
  | 'rolling'
  | 'sleeping'
  | 'jumping';

export type FoxMood = 'blissful' | 'happy' | 'content' | 'curious' | 'sleepy' | 'playful';

export const RED_BED_POSITION = { x: 570, y: 340 };

export interface FoxState {
  behavior: FoxBehavior;
  mood: FoxMood;
  x: number; // 0 to 800
  y: number;
  facing: 'left' | 'right';
  hunger: number; // 0 (starving) to 100 (full)
  energy: number; // 0 to 100
  happiness: number; // 0 to 100
  affection: number; // 0 to 100
  totalPets: number;
  lastInteractionTime: number; // timestamp
  lastSavedTime: number; // timestamp
  isPetting: boolean;
  pettingIntensity: number; // 0 to 1
  toyPosition: { x: number; y: number } | null;
  poseTimer: number; // seconds remaining in current behavior
  currentIdleIndex: number;
  isSleepingInBed: boolean;
  isGoingToBed: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'heart' | 'sparkle' | 'sleep' | 'leaf';
  size: number;
  opacity: number;
  color?: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  behavior: FoxBehavior;
  description: string;
  sound?: string;
}

export type WindowMode = 'main' | 'minimized';
