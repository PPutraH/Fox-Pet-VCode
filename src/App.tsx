import React, { useState } from 'react';
import { useFoxAutonomousAI } from './hooks/useFoxAutonomousAI';
import { MainWindow } from './components/MainWindow';
import { MiniPreviewWindow } from './components/MiniPreviewWindow';
import { UnityCodeViewer } from './components/UnityCodeViewer';
import { WindowMode } from './types';
import { Maximize2, Code2, Sparkles } from 'lucide-react';

export default function App() {
  const [windowMode, setWindowMode] = useState<WindowMode>('main');
  const [showUnityModal, setShowUnityModal] = useState<boolean>(false);

  const {
    foxState,
    particles,
    welcomeInfo,
    activityLogs,
    currentSound,
    handlePet,
    handlePetStart,
    handlePetEnd,
    promptGoToBed,
    wakeUpFox,
    feedBerry,
    playWithBall,
    callFox,
    makeJump,
    resetState,
    forceSave,
  } = useFoxAutonomousAI();

  return (
    <div className="min-h-screen w-full bg-[#EAE2D6] text-neutral-800 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Desktop Wallpaper Texture & Warm Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#CBB9A1_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-amber-200/20 via-transparent to-orange-200/20" />

      {/* Main Interactive Window View */}
      {windowMode === 'main' && (
        <MainWindow
          state={foxState}
          particles={particles}
          activityLogs={activityLogs}
          welcomeInfo={welcomeInfo}
          currentSound={currentSound}
          onMinimize={() => setWindowMode('minimized')}
          onPet={handlePet}
          onPetStart={handlePetStart}
          onPetEnd={handlePetEnd}
          onFeed={feedBerry}
          onPlayBall={playWithBall}
          onCallFox={callFox}
          onJump={makeJump}
          onGoToBed={promptGoToBed}
          onWakeUp={wakeUpFox}
          onForceSave={forceSave}
          onResetState={resetState}
          onOpenUnityCode={() => setShowUnityModal(true)}
        />
      )}

      {/* Minimized State Simulation Wallpaper View */}
      {windowMode === 'minimized' && (
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-white/75 backdrop-blur-md rounded-2xl border border-amber-900/10 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl shadow-md mx-auto text-white">
            🦊
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-800">FoxPet Minimized</h2>
            <p className="text-xs text-neutral-600 mt-1">
              Your fox companion is still running autonomously in the floating preview window in the corner.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <button
              id="restore-main-btn"
              onClick={() => setWindowMode('main')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Restore Main Window
            </button>
            <button
              id="minimized-unity-code-btn"
              onClick={() => setShowUnityModal(true)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              Unity C# Scripts
            </button>
          </div>
        </div>
      )}

      {/* Floating Mini Preview Window Widget (Active when Minimized) */}
      {windowMode === 'minimized' && (
        <MiniPreviewWindow
          state={foxState}
          particles={particles}
          currentSound={currentSound}
          onRestore={() => setWindowMode('main')}
          onPet={handlePet}
          onPetStart={handlePetStart}
          onPetEnd={handlePetEnd}
          onGoToBed={promptGoToBed}
          onWakeUp={wakeUpFox}
          onJump={makeJump}
        />
      )}

      {/* Top Floating App Info Bar */}
      <header className="fixed top-3 left-3 sm:left-6 flex items-center gap-2 pointer-events-none select-none z-10">
        <div className="bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-amber-900/10 text-xs font-medium text-neutral-700 shadow-2xs flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Interactive Digital Fox Prototype</span>
        </div>
      </header>

      {/* Bottom Floating Bar */}
      <footer className="fixed bottom-3 left-3 sm:left-6 flex items-center gap-2 text-[11px] text-neutral-600 pointer-events-none select-none z-10">
        <div className="bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-amber-900/10 shadow-2xs">
          Autonomous state machine &bull; Non-repetitive idle cycles &bull; Disk state persistence
        </div>
      </footer>

      {/* Unity C# Code Inspector Modal */}
      {showUnityModal && <UnityCodeViewer onClose={() => setShowUnityModal(false)} />}
    </div>
  );
}
