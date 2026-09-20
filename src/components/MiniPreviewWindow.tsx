import React, { useState } from 'react';
import { FoxState, Particle } from '../types';
import { FoxRenderer } from './FoxRenderer';
import { Maximize2, Heart, Volume2, VolumeX, Sparkles, Move } from 'lucide-react';
import { soundEngine, SoundEvent } from '../utils/audio';

interface MiniPreviewWindowProps {
  state: FoxState;
  particles: Particle[];
  currentSound?: SoundEvent | null;
  onRestore: () => void;
  onPet: (x: number, y: number) => void;
  onPetStart?: () => void;
  onPetEnd?: () => void;
  onGoToBed?: () => void;
  onWakeUp?: () => void;
  onJump?: () => void;
}

export const MiniPreviewWindow: React.FC<MiniPreviewWindowProps> = ({
  state,
  particles,
  currentSound,
  onRestore,
  onPet,
  onPetStart,
  onPetEnd,
  onGoToBed,
  onWakeUp,
  onJump,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.isMuted);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.isMuted = !soundEngine.isMuted;
    setIsMuted(soundEngine.isMuted);
  };

  // Dragging support for floating mini-window
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 260, e.clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 260, e.clientY - dragOffset.y)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  // Human readable at-a-glance action description
  const getActionGlance = () => {
    if (state.isPetting) return { label: 'Being Petted & Purring', icon: '💖', color: 'bg-rose-500/15 text-rose-700 border-rose-200' };
    if (state.isGoingToBed) return { label: 'Heading to Bed', icon: '🛏️', color: 'bg-red-500/15 text-red-700 border-red-200' };
    if (state.behavior === 'sleeping') {
      return {
        label: `In Bed: ${Math.round(state.energy)}% full`,
        icon: '💤',
        color: 'bg-red-500/15 text-red-700 border-red-200',
      };
    }
    switch (state.behavior) {
      case 'idle_standing':
        return { label: 'Alert & Watching', icon: '🦊', color: 'bg-amber-500/15 text-amber-800 border-amber-200' };
      case 'idle_sitting':
        return { label: 'Sitting Calmly', icon: '🐾', color: 'bg-orange-500/15 text-orange-800 border-orange-200' };
      case 'idle_curled':
        return { label: 'Resting Loaf', icon: '🍞', color: 'bg-yellow-500/15 text-yellow-800 border-yellow-200' };
      case 'stretching':
        return { label: 'Stretching Paws', icon: '🧘', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-200' };
      case 'yawning':
        return { label: 'Sleepy Yawn', icon: '🥱', color: 'bg-indigo-500/15 text-indigo-800 border-indigo-200' };
      case 'walking':
        return { label: 'Trotting Around', icon: '🚶', color: 'bg-sky-500/15 text-sky-800 border-sky-200' };
      case 'playing':
        return { label: 'Playing Excitedly', icon: '🎾', color: 'bg-pink-500/15 text-pink-800 border-pink-200' };
      case 'rolling':
        return { label: 'Belly Roll Wiggle', icon: '🤸', color: 'bg-purple-500/15 text-purple-800 border-purple-200' };
      case 'jumping':
        return { label: 'Airborne Leap', icon: '🦘', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Idling', icon: '🦊', color: 'bg-amber-500/15 text-amber-800 border-amber-200' };
    }
  };

  const action = getActionGlance();

  return (
    <div
      id="fox-mini-window"
      style={{
        position: 'fixed',
        right: `${pos.x}px`,
        bottom: `${pos.y}px`,
        zIndex: 50,
      }}
      className="w-64 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-amber-100 overflow-hidden select-none transition-shadow hover:shadow-orange-500/20 duration-200"
    >
      {/* Title Bar with Draggable Handle and Controls */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 opacity-75" />
          <span className="text-xs font-semibold tracking-wide">Fox Pet Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="mini-mute-btn"
            onClick={toggleMute}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            id="mini-restore-btn"
            onClick={onRestore}
            className="p-1 rounded hover:bg-white/20 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Restore full window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Fox Live Canvas View */}
      <div className="relative bg-gradient-to-b from-amber-50/60 to-orange-100/60 h-36 flex items-center justify-center overflow-hidden border-b border-amber-100">
        <FoxRenderer
          state={state}
          particles={particles}
          width={240}
          height={150}
          isMini={true}
          onPet={onPet}
          onPetStart={onPetStart}
          onPetEnd={onPetEnd}
        />

        {/* Floating Quick Action Overlay badge */}
        <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-xs ${action.color}`}>
            <span>{action.icon}</span>
            <span className="truncate max-w-[120px]">{action.label}</span>
          </span>

          {currentSound && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900/90 text-amber-200 border border-amber-400/40 shadow-xs animate-bounce">
              <Volume2 className="w-2.5 h-2.5 text-amber-400" />
              <span className="truncate max-w-[130px]">{currentSound.soundName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Glanceable Status Details */}
      <div className="p-3 bg-white space-y-2">
        {/* Affection / Heart Bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-rose-600 font-medium">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Affection
          </span>
          <span className="font-semibold text-neutral-700">{Math.round(state.affection)}%</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${state.affection}%` }}
          />
        </div>

        {/* Energy Bar (highlights recharge in red cube bed) */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-xs bg-red-600 inline-block" />
            Energy
          </span>
          <span className="font-semibold text-neutral-700">{Math.round(state.energy)}% {state.behavior === 'sleeping' ? '⚡' : ''}</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              state.behavior === 'sleeping' ? 'bg-gradient-to-r from-red-500 to-orange-400 animate-pulse' : 'bg-amber-500'
            }`}
            style={{ width: `${state.energy}%` }}
          />
        </div>

        {/* Action Controls */}
        <div className="pt-1 flex gap-1.5">
          <button
            id="mini-quick-pet-btn"
            onClick={() => onPet(120, 75)}
            className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all text-xs font-medium flex items-center justify-center gap-1 border border-rose-200/60 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-rose-500" />
            Pet
          </button>
          {onJump && (
            <button
              id="mini-jump-btn"
              onClick={onJump}
              className="py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all text-xs font-medium border border-emerald-200 shadow-2xs"
              title="Prompt fox to jump"
            >
              Jump
            </button>
          )}
          {state.behavior === 'sleeping' ? (
            <button
              id="mini-wake-btn"
              onClick={onWakeUp}
              className="py-1.5 px-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 active:scale-95 transition-all text-xs font-medium border border-red-200 shadow-2xs"
              title="Wake up early"
            >
              Wake
            </button>
          ) : (
            <button
              id="mini-bed-btn"
              onClick={onGoToBed}
              className="py-1.5 px-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 active:scale-95 transition-all text-xs font-medium border border-red-200 shadow-2xs"
              title="Send to bed"
            >
              Bed
            </button>
          )}
          <button
            id="mini-expand-full-btn"
            onClick={onRestore}
            className="py-1.5 px-2.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 transition-all text-xs font-medium shadow-2xs"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};
