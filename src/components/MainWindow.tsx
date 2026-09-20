import React, { useState } from 'react';
import { FoxState, Particle, ActivityLog } from '../types';
import { FoxRenderer } from './FoxRenderer';
import {
  Minus,
  Square,
  X,
  Volume2,
  VolumeX,
  Heart,
  Sparkles,
  Cookie,
  CircleDot,
  Radio,
  ArrowUpCircle,
  Save,
  RotateCcw,
  Code,
  Clock,
  BatteryCharging,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { soundEngine, SoundEvent, FoxSoundAction } from '../utils/audio';

interface MainWindowProps {
  state: FoxState;
  particles: Particle[];
  activityLogs: ActivityLog[];
  welcomeInfo: string;
  currentSound?: SoundEvent | null;
  onMinimize: () => void;
  onPet: (x: number, y: number) => void;
  onPetStart?: () => void;
  onPetEnd?: () => void;
  onFeed: () => void;
  onPlayBall: () => void;
  onCallFox: () => void;
  onJump: () => void;
  onGoToBed: () => void;
  onWakeUp: () => void;
  onForceSave: () => boolean;
  onResetState: () => void;
  onOpenUnityCode: () => void;
}

const FOX_ACTION_SOUNDS: {
  action: FoxSoundAction;
  name: string;
  icon: string;
  var1: string;
  var2: string;
}[] = [
  { action: 'playing', name: 'Playing', icon: '🎾', var1: 'Gekkering Laugh', var2: 'Playful High Yip' },
  { action: 'rolling', name: 'Rolling', icon: '🤸', var1: 'Joyful Belly Gekker', var2: 'Rolling Purr-Pant' },
  { action: 'yawning', name: 'Yawning', icon: '🥱', var1: 'Fox Squeal-Yawn', var2: 'Deep Yawn Sigh' },
  { action: 'stretching', name: 'Stretching', icon: '🧘', var1: 'Stretch Whimper', var2: 'Arched Spine Creak' },
  { action: 'sleeping', name: 'Sleeping in Bed', icon: '💤', var1: 'Cozy Sleep Snore', var2: 'Dreaming Whimper' },
  { action: 'walking', name: 'Walking', icon: '🚶', var1: 'Patter Paws Trot', var2: 'Travel Chirrup' },
  { action: 'idle_standing', name: 'Idle Standing', icon: '🦊', var1: 'Curious Snout Sniff', var2: 'Alert Yip' },
  { action: 'idle_sitting', name: 'Idle Sitting', icon: '🐾', var1: 'Throaty Churr', var2: 'Inquiring Whimper' },
  { action: 'idle_curled', name: 'Idle Curled', icon: '🍞', var1: 'Cozy Settling Sigh', var2: 'Curled Nose-Purr' },
  { action: 'petting', name: 'Petting', icon: '💖', var1: 'Throbbing Purr', var2: 'Affectionate Trill' },
  { action: 'feed', name: 'Feeding Berry', icon: '🫐', var1: 'Berry Munch & Squeak', var2: 'Tasty Nibble Whimper' },
  { action: 'play_ball', name: 'Toss Toy', icon: '⚾', var1: 'Excited Pounce Yip', var2: 'Toy Chase Gekkering' },
  { action: 'call_fox', name: 'Call Fox', icon: '📢', var1: 'Responsive Fox Bark', var2: 'Answering Whimper' },
];

export const MainWindow: React.FC<MainWindowProps> = ({
  state,
  particles,
  activityLogs,
  welcomeInfo,
  currentSound,
  onMinimize,
  onPet,
  onPetStart,
  onPetEnd,
  onFeed,
  onPlayBall,
  onCallFox,
  onJump,
  onGoToBed,
  onWakeUp,
  onForceSave,
  onResetState,
  onOpenUnityCode,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);

  const toggleMute = () => {
    soundEngine.isMuted = !soundEngine.isMuted;
    setIsMuted(soundEngine.isMuted);
  };

  const handleSaveClick = () => {
    const ok = onForceSave();
    if (ok) {
      setSaveToast('State saved to persistent storage!');
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  const formatBehaviorLabel = (behavior: string) => {
    if (state.isGoingToBed) {
      return { name: 'Heading to Bed', icon: '🛏️', desc: 'Trotting over to the red cube bed' };
    }
    switch (behavior) {
      case 'idle_standing':
        return { name: 'Idle Standing', icon: '🦊', desc: 'Alert, looking around' };
      case 'idle_sitting':
        return { name: 'Idle Sitting', icon: '🐾', desc: 'Sitting upright peacefully' };
      case 'idle_curled':
        return { name: 'Idle Curled', icon: '🍞', desc: 'Cozy loaf pose' };
      case 'stretching':
        return { name: 'Stretching', icon: '🧘', desc: 'Arched spine and extended paws' };
      case 'yawning':
        return { name: 'Yawning', icon: '🥱', desc: 'Cute sleepy yawn' };
      case 'walking':
        return { name: 'Walking', icon: '🚶', desc: 'Exploring the floor' };
      case 'playing':
        return { name: 'Playing', icon: '🎾', desc: 'Bouncing and chasing' };
      case 'rolling':
        return { name: 'Rolling', icon: '🤸', desc: 'Belly-up happy wiggle' };
      case 'sleeping':
        return {
          name: 'Sleeping in Red Bed',
          icon: '💤',
          desc: `Recharging energy until full (${Math.round(state.energy)}% / 100%)`,
        };
      case 'jumping':
        return {
          name: 'Jumping',
          icon: '🦘',
          desc: 'Airborne leap with visible physics arc',
        };
      default:
        return { name: behavior, icon: '🦊', desc: 'Resting' };
    }
  };

  const currentBehaviorInfo = formatBehaviorLabel(state.behavior);

  return (
    <div
      id="fox-desktop-main-window"
      className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-amber-900/15 overflow-hidden flex flex-col transition-all duration-300 select-none"
    >
      {/* Title Bar with Desktop Window Controls */}
      <div className="h-10 bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white px-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🦊</span>
          <span className="text-xs font-semibold tracking-wide">FoxPet - Autonomous Digital Companion</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono text-amber-50">
            Unity / C# Architecture
          </span>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            id="window-mute-btn"
            onClick={toggleMute}
            className="p-1 rounded-md hover:bg-white/20 text-white/90 hover:text-white transition-colors mr-2"
            title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            id="window-minimize-btn"
            onClick={onMinimize}
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white transition-colors"
            title="Minimize to floating preview window"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            id="window-maximize-btn"
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white/70 transition-colors cursor-default"
            title="Window at standard interactive size"
          >
            <Square className="w-3 h-3" />
          </button>

          <button
            id="window-close-btn"
            onClick={() => {
              handleSaveClick();
            }}
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-red-500 text-white transition-colors"
            title="Save and close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Room & Fox Stage */}
      <div className="relative bg-gradient-to-b from-amber-50/70 via-orange-50/40 to-[#F4ECE1] min-h-[380px] h-[400px] flex items-center justify-center overflow-hidden border-b border-amber-200/60">
        {/* Cozy Room Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {/* Subtle wooden floor lines */}
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-b from-transparent via-[#E8DCCB]/60 to-[#DECDB8] border-t border-amber-900/10">
            <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(90deg,#9C6644_0,#9C6644_2px,transparent_0,transparent_90px)]" />
          </div>

          {/* Cozy Room Window Frame & Soft Sunlight */}
          <div className="absolute top-6 left-12 w-28 h-40 rounded-t-full border-4 border-amber-800/20 bg-gradient-to-b from-sky-200/40 to-amber-100/30 flex items-center justify-center">
            <div className="w-full h-0.5 bg-amber-800/20" />
            <div className="absolute h-full w-0.5 bg-amber-800/20" />
          </div>

          {/* Floor cushion/mat for resting */}
          <div className="absolute bottom-8 right-16 w-36 h-12 rounded-[50%] bg-[#E5D2BA] border border-amber-900/10 shadow-xs" />
        </div>

        {/* Top Floating HUD: State Machine & Glance */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          {/* Behavior State Badge */}
          <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-amber-200 shadow-xs">
            <span className="text-sm">{currentBehaviorInfo.icon}</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-800 leading-tight">
                {state.isPetting ? 'Being Petted & Loved' : currentBehaviorInfo.name}
              </span>
              <span className="text-[10px] text-neutral-500 leading-tight">
                {state.isPetting ? 'Purring with affection' : currentBehaviorInfo.desc}
              </span>
            </div>
          </div>

          {/* Live Real Fox Noise Indicator */}
          {currentSound && (
            <div
              key={currentSound.timestamp}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 text-amber-200 border border-amber-400/40 text-xs shadow-lg backdrop-blur-xs transition-all animate-bounce"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white font-medium">{currentSound.soundName}</span>
              <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-600/40">
                Noise #{currentSound.variation}
              </span>
            </div>
          )}

          {/* Mood & Affection Pill */}
          <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-rose-200 shadow-xs">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-rose-700 capitalize">{state.mood}</span>
              <span className="text-neutral-400">•</span>
              <span className="font-semibold text-neutral-700">{Math.round(state.affection)}% Affection</span>
            </div>
          </div>
        </div>

        {/* Fox Interactive Canvas */}
        <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
          <FoxRenderer
            state={state}
            particles={particles}
            width={800}
            height={400}
            onPet={onPet}
            onPetStart={onPetStart}
            onPetEnd={onPetEnd}
            onBedClick={onGoToBed}
          />
        </div>

        {/* Petting & Bed prompt overlay hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-neutral-900/60 backdrop-blur-xs text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Click fox to pet • Click red cube bed to sleep until 100% full energy</span>
        </div>

        {/* Floating Save Confirmation Toast */}
        {saveToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce">
            <span>✓</span> {saveToast}
          </div>
        )}
      </div>

      {/* Interactive Controls & Stats Toolbar */}
      <div className="p-4 bg-white space-y-4">
        {/* Quick Interaction Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <button
              id="pet-fox-btn"
              onClick={() => onPet(state.x, state.y - 10)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold hover:from-rose-600 hover:to-pink-600 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              Pet Fox
            </button>

            <button
              id="feed-berry-btn"
              onClick={onFeed}
              className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-medium hover:bg-amber-100 active:scale-95 transition-all flex items-center gap-1.5"
              title="Offer a wild berry"
            >
              <Cookie className="w-3.5 h-3.5 text-amber-600" />
              Give Berry
            </button>

            <button
              id="toss-ball-btn"
              onClick={onPlayBall}
              className="px-3 py-2 rounded-xl bg-orange-50 text-orange-800 border border-orange-200/80 text-xs font-medium hover:bg-orange-100 active:scale-95 transition-all flex items-center gap-1.5"
              title="Toss toy yarn ball"
            >
              <CircleDot className="w-3.5 h-3.5 text-orange-600" />
              Toss Toy
            </button>

            <button
              id="jump-btn"
              onClick={onJump}
              className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-medium hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
              title="Prompt the fox to jump into the air (simple, visible leap)"
            >
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Jump
            </button>

            <button
              id="call-fox-btn"
              onClick={onCallFox}
              className="px-3 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 text-xs font-medium hover:bg-sky-100 active:scale-95 transition-all flex items-center gap-1.5"
              title="Call fox over"
            >
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              Call Fox
            </button>

            {state.behavior === 'sleeping' ? (
              <button
                id="wake-up-btn"
                onClick={onWakeUp}
                className="px-3 py-2 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
                title="Gently wake up the fox early"
              >
                <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block shadow-2xs" />
                Wake Up ({Math.round(state.energy)}%)
              </button>
            ) : (
              <button
                id="send-to-bed-btn"
                onClick={onGoToBed}
                className={`px-3 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 ${
                  state.isGoingToBed
                    ? 'bg-red-100 text-red-900 border border-red-300 animate-pulse'
                    : 'bg-red-50 text-red-800 border border-red-200/80 hover:bg-red-100 shadow-2xs'
                }`}
                title="Send fox to sleep in the red cube bed until 100% full energy"
              >
                <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block shadow-2xs" />
                {state.isGoingToBed ? 'Going to Bed...' : 'Sleep in Bed'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-soundboard-btn"
              onClick={() => setShowSoundboard((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 ${
                showSoundboard
                  ? 'bg-amber-600 text-white shadow-amber-600/30'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80'
              }`}
              title="Preview real fox noises (at least 2 variations for every action)"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
              Fox Noises
            </button>

            <button
              id="minimize-toolbar-btn"
              onClick={onMinimize}
              className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Minimize to companion preview widget"
            >
              <Minus className="w-3.5 h-3.5" />
              Minimize Window
            </button>

            <button
              id="view-unity-code-btn"
              onClick={onOpenUnityCode}
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              Unity C# Scripts
            </button>
          </div>
        </div>

        {/* Fox Noises Preview Soundboard (Direct & Simple Testing for Every Action) */}
        {showSoundboard && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🦊🔊</span>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">Real Fox Noises (2+ Variations Per Action)</h4>
                  <p className="text-[11px] text-neutral-600">
                    Click any variation button to hear the authentic fox vocalization generated for that action.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSoundboard(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {FOX_ACTION_SOUNDS.map((item) => (
                <div
                  key={item.action}
                  className="bg-white/95 border border-amber-200/70 rounded-lg p-2 flex flex-col justify-between gap-1.5 shadow-2xs hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-mono bg-amber-100/70 px-1.5 py-0.2 rounded-full">
                      2 Noises
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      id={`sound-${item.action}-var1-btn`}
                      onClick={() => soundEngine.playActionSound(item.action, 1)}
                      className="flex-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-200/80 active:scale-95 text-amber-900 text-[10px] font-medium border border-amber-200/90 flex items-center justify-center gap-1 transition-all"
                      title={`Play Variation #1: ${item.var1}`}
                    >
                      <Volume2 className="w-2.5 h-2.5 text-amber-700" />
                      <span className="truncate">1. {item.var1}</span>
                    </button>
                    <button
                      id={`sound-${item.action}-var2-btn`}
                      onClick={() => soundEngine.playActionSound(item.action, 2)}
                      className="flex-1 px-2 py-1 rounded bg-orange-50 hover:bg-orange-200/80 active:scale-95 text-orange-900 text-[10px] font-medium border border-orange-200/90 flex items-center justify-center gap-1 transition-all"
                      title={`Play Variation #2: ${item.var2}`}
                    >
                      <Volume2 className="w-2.5 h-2.5 text-orange-700" />
                      <span className="truncate">2. {item.var2}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companion Vitals & Persistence Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Energy */}
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-amber-600" /> Energy
              </span>
              <span className="font-semibold text-neutral-700">{Math.round(state.energy)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${state.energy}%` }}
              />
            </div>
          </div>

          {/* Fullness / Hunger */}
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="flex items-center gap-1">
                <Cookie className="w-3.5 h-3.5 text-orange-600" /> Fullness
              </span>
              <span className="font-semibold text-neutral-700">{Math.round(state.hunger)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${state.hunger}%` }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Happiness
              </span>
              <span className="font-semibold text-neutral-700">{Math.round(state.happiness)}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${state.happiness}%` }}
              />
            </div>
          </div>

          {/* Total Pets */}
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
            <span className="text-neutral-500 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Pet Count
            </span>
            <span className="font-bold text-base text-neutral-800">{state.totalPets} times</span>
          </div>
        </div>

        {/* Persistence & System Operations */}
        <div className="flex flex-wrap items-center justify-between pt-2 text-xs border-t border-neutral-100 gap-2">
          <div className="flex items-center gap-3 text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Auto-saving state to disk
            </span>
            <span>•</span>
            <span>Position: ({Math.round(state.x)}, {Math.round(state.y)})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="force-save-btn"
              onClick={handleSaveClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors font-medium"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              Save Now
            </button>

            <button
              id="reset-state-btn"
              onClick={() => {
                if (confirm('Reset fox pet data to prototype defaults?')) {
                  onResetState();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-colors"
              title="Reset state to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              Reset
            </button>

            <button
              id="toggle-activity-log-btn"
              onClick={() => setShowActivityLog((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-neutral-500" />
              Activity Log
              {showActivityLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Activity & State Machine Log */}
        {showActivityLog && (
          <div className="mt-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px] text-neutral-600 select-text">
            <div className="font-sans font-semibold text-neutral-700 text-xs mb-1">
              Autonomous Behavior Transitions Log
            </div>
            {welcomeInfo && <div className="text-amber-700">★ {welcomeInfo}</div>}
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-neutral-400 shrink-0">[{log.time}]</span>
                <span className="font-semibold text-neutral-700 shrink-0">{log.behavior}:</span>
                <span className="flex-1">{log.description}</span>
                {log.sound && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.5 rounded font-medium">
                    🔊 {log.sound}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
