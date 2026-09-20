import { useState, useEffect, useRef, useCallback } from 'react';
import { FoxBehavior, FoxMood, FoxState, Particle, ActivityLog, RED_BED_POSITION } from '../types';
import { soundEngine, SoundEvent } from '../utils/audio';
import { saveFoxStateToDisk, loadFoxStateFromDisk } from '../utils/persistence';

const IDLE_POSES: FoxBehavior[] = ['idle_standing', 'idle_sitting', 'idle_curled'];
const ACTIVE_BEHAVIORS: FoxBehavior[] = ['stretching', 'yawning', 'walking', 'playing', 'rolling', 'jumping'];

export function useFoxAutonomousAI() {
  const [foxState, setFoxState] = useState<FoxState>(() => {
    const { state } = loadFoxStateFromDisk();
    return state;
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [welcomeInfo, setWelcomeInfo] = useState<string>('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currentSound, setCurrentSound] = useState<SoundEvent | null>(null);

  // Refs for loop management without state closure lag
  const foxStateRef = useRef<FoxState>(foxState);
  foxStateRef.current = foxState;

  const lastPetSoundTimeRef = useRef<number>(0);
  const lastSleepSoundTimeRef = useRef<number>(0);
  const recentBehaviorsRef = useRef<FoxBehavior[]>([]);
  const walkTargetRef = useRef<number | null>(null);
  const pettingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen to live sound events to display audio feedback
  useEffect(() => {
    return soundEngine.addListener((event) => {
      setCurrentSound(event);
    });
  }, []);

  // Add activity log entry
  const logActivity = useCallback((behavior: FoxBehavior, description: string, soundInfo?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time: timeStr,
        behavior,
        description,
        sound: soundInfo,
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  // Initialize on mount: load restored state and log initial status
  useEffect(() => {
    const restored = loadFoxStateFromDisk();
    setFoxState(restored.state);
    setWelcomeInfo(restored.welcomeMessage);
    logActivity(restored.state.behavior, restored.welcomeMessage);
  }, [logActivity]);

  // Periodic Auto-Save
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveFoxStateToDisk(foxStateRef.current);
    }, 10000);

    const handleBeforeUnload = () => {
      saveFoxStateToDisk(foxStateRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Autonomous state machine transition picker
  const pickNextBehavior = useCallback((): { behavior: FoxBehavior; duration: number } => {
    const current = foxStateRef.current;
    const recent = recentBehaviorsRef.current;

    // If currently sleeping, the fox sleeps until energy is 100% full
    if (current.behavior === 'sleeping') {
      if (current.energy < 100) {
        return { behavior: 'sleeping', duration: 999 };
      }
      return { behavior: 'yawning', duration: 3.5 };
    }

    // If low energy, fox autonomously goes to the red bed to sleep!
    if (current.energy < 40) {
      if (Math.abs(current.x - RED_BED_POSITION.x) > 15) {
        // Walk to bed first
        walkTargetRef.current = RED_BED_POSITION.x;
        current.isGoingToBed = true;
        return { behavior: 'walking', duration: 6 };
      } else {
        // Already at bed, start sleeping until full
        return { behavior: 'sleeping', duration: 999 };
      }
    }

    // Normal autonomous behavior selection
    const dice = Math.random();
    let next: FoxBehavior;

    if (dice < 0.45) {
      // Pick an idle pose that is NOT the recent one
      const availableIdles = IDLE_POSES.filter((b) => b !== current.behavior && (!recent.includes(b) || recent.length > 2));
      next = availableIdles.length > 0 ? availableIdles[Math.floor(Math.random() * availableIdles.length)] : 'idle_standing';
    } else if (dice < 0.85) {
      // Pick an active behavior that is not recent
      const availableActive = ACTIVE_BEHAVIORS.filter((b) => b !== current.behavior && (!recent.includes(b) || recent.length > 3));
      next = availableActive.length > 0 ? availableActive[Math.floor(Math.random() * availableActive.length)] : 'stretching';
    } else {
      // Autonomous nap in the red bed
      if (Math.abs(current.x - RED_BED_POSITION.x) > 15) {
        walkTargetRef.current = RED_BED_POSITION.x;
        current.isGoingToBed = true;
        next = 'walking';
      } else {
        next = 'sleeping';
      }
    }

    // Track recent history
    recentBehaviorsRef.current = [next, ...recent.slice(0, 3)];

    // Durations for each behavior
    let duration = 5;
    switch (next) {
      case 'stretching':
        duration = 3.5 + Math.random() * 2;
        break;
      case 'yawning':
        duration = 2.8 + Math.random() * 1.5;
        break;
      case 'walking':
        duration = 4 + Math.random() * 4;
        if (!current.isGoingToBed) {
          walkTargetRef.current = 180 + Math.random() * 320;
        }
        break;
      case 'playing':
        duration = 4.5 + Math.random() * 3.5;
        break;
      case 'rolling':
        duration = 3.5 + Math.random() * 2;
        break;
      case 'sleeping':
        duration = 999; // Will stay asleep until energy is 100% full!
        break;
      case 'idle_standing':
        duration = 4 + Math.random() * 5;
        break;
      case 'idle_sitting':
        duration = 5 + Math.random() * 6;
        break;
      case 'idle_curled':
        duration = 6 + Math.random() * 8;
        break;
      case 'jumping':
        duration = 1.0; // Clean, visible 1-second leap arc
        break;
    }

    // Play real fox noise for this behavior (guaranteed 2+ distinct variations for every action)
    // Note: Jump action doesn't need sound per user request
    if (next !== 'jumping') {
      soundEngine.playActionSound(next);
    }

    return { behavior: next, duration };
  }, []);

  // Main Simulation Loop (Runs every 100ms)
  useEffect(() => {
    const simInterval = setInterval(() => {
      setFoxState((prev) => {
        let newX = prev.x;
        let newFacing = prev.facing;
        let newEnergy = prev.energy;
        let newHappiness = prev.happiness;
        let newIsGoingToBed = prev.isGoingToBed;
        let newIsSleepingInBed = prev.isSleepingInBed;

        // Walking movement integration
        if (prev.behavior === 'walking' && walkTargetRef.current !== null) {
          const dx = walkTargetRef.current - prev.x;
          if (Math.abs(dx) > 5) {
            const step = Math.sign(dx) * 3;
            newX = Math.max(160, Math.min(RED_BED_POSITION.x, prev.x + step));
            newFacing = step > 0 ? 'right' : 'left';
          } else {
            walkTargetRef.current = null;
            // If fox was walking to the red cube bed, start sleeping now!
            if (newIsGoingToBed) {
              newIsGoingToBed = false;
              newIsSleepingInBed = true;
              soundEngine.playActionSound('sleeping');
              const lastSound = soundEngine.getLastSound();
              const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
              logActivity('sleeping', 'Fox hopped onto the red cube bed and fell asleep to restore energy.', soundDesc);
              return {
                ...prev,
                x: RED_BED_POSITION.x,
                y: RED_BED_POSITION.y,
                facing: 'left',
                behavior: 'sleeping',
                isGoingToBed: false,
                isSleepingInBed: true,
                mood: 'sleepy',
                poseTimer: 999, // held until energy is 100%
              };
            }
          }
        }

        // --- Core Requirement: Sleeping until energy is 100% full ---
        if (prev.behavior === 'sleeping') {
          // Rapid, satisfying bed recharge (~0.4% per 100ms = 4% per sec)
          newEnergy = Math.min(100, prev.energy + 0.4);

          // Periodic sleepy fox snore / dream whimper while resting on the bed
          const now = Date.now();
          if (now - lastSleepSoundTimeRef.current > 4200) {
            lastSleepSoundTimeRef.current = now;
            soundEngine.playActionSound('sleeping');
          }

          // Once energy is completely full (100%), the fox wakes up!
          if (newEnergy >= 100) {
            soundEngine.playActionSound('yawning');
            const lastSound = soundEngine.getLastSound();
            const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
            logActivity('yawning', 'Fox is fully energized (100%) and woke up from the red cube bed feeling refreshed!', soundDesc);
            return {
              ...prev,
              energy: 100,
              behavior: 'yawning',
              isSleepingInBed: false,
              isGoingToBed: false,
              mood: 'happy',
              poseTimer: 3.5,
            };
          }

          // Still recharging: hold in sleep state on the bed!
          return {
            ...prev,
            energy: newEnergy,
            behavior: 'sleeping',
            isSleepingInBed: true,
            isGoingToBed: false,
            poseTimer: 999,
          };
        }

        // Active stat consumption
        if (prev.behavior === 'playing' || prev.behavior === 'rolling') {
          newEnergy = Math.max(10, newEnergy - 0.1);
          newHappiness = Math.min(100, newHappiness + 0.05);
        } else {
          newEnergy = Math.max(10, newEnergy - 0.03);
        }

        // Timer decrement for waking behaviors
        const updatedTimer = prev.poseTimer - 0.1;

        if (updatedTimer <= 0) {
          const { behavior: nextBehavior, duration } = pickNextBehavior();

          let description = '';
          switch (nextBehavior) {
            case 'stretching':
              description = 'Fox stretches out paws and arches its back.';
              break;
            case 'yawning':
              description = 'Fox opens its mouth in a cute sleepy yawn.';
              break;
            case 'walking':
              description = prev.isGoingToBed
                ? 'Fox is heading over to the red cube bed to rest.'
                : 'Fox trots around exploring the area.';
              break;
            case 'playing':
              description = 'Fox bounces excitedly and chases its tail!';
              break;
            case 'rolling':
              description = 'Fox rolls onto its back and wiggles playfully.';
              break;
            case 'sleeping':
              description = 'Fox curls up on the red cube bed to sleep.';
              break;
            case 'idle_standing':
              description = 'Fox stands watchfully, ears perked.';
              break;
            case 'idle_sitting':
              description = 'Fox sits upright, tilting head curiously.';
              break;
            case 'idle_curled':
              description = 'Fox relaxes curled in a cozy loaf.';
              break;
            case 'jumping':
              description = 'Fox leaped into the air!';
              break;
          }

          // Note: Jump action does not need sound
          const lastSound = nextBehavior !== 'jumping' ? soundEngine.getLastSound() : null;
          const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
          logActivity(nextBehavior, description, soundDesc);

          // Update Mood
          let nextMood: FoxMood = 'content';
          if (nextBehavior === 'sleeping') nextMood = 'sleepy';
          else if (nextBehavior === 'playing' || nextBehavior === 'rolling' || nextBehavior === 'jumping') nextMood = 'playful';
          else if (prev.happiness > 85) nextMood = 'blissful';
          else if (prev.happiness > 65) nextMood = 'happy';

          return {
            ...prev,
            behavior: nextBehavior,
            mood: nextMood,
            x: newX,
            facing: newFacing,
            energy: newEnergy,
            happiness: newHappiness,
            isGoingToBed: newIsGoingToBed,
            isSleepingInBed: nextBehavior === 'sleeping' ? true : newIsSleepingInBed,
            poseTimer: duration,
          };
        }

        return {
          ...prev,
          x: newX,
          facing: newFacing,
          energy: newEnergy,
          happiness: newHappiness,
          isGoingToBed: newIsGoingToBed,
          isSleepingInBed: newIsSleepingInBed,
          poseTimer: updatedTimer,
        };
      });
    }, 100);

    return () => clearInterval(simInterval);
  }, [pickNextBehavior, logActivity]);

  // Particle Physics Animation Loop
  useEffect(() => {
    let animFrame: number;
    let lastPTime = performance.now();

    const updateParticles = (now: number) => {
      const dt = Math.min((now - lastPTime) / 1000, 0.1);
      lastPTime = now;

      setParticles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 60,
            y: p.y + p.vy * dt * 60,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0);
      });

      // Spawn sleepy Zzz if sleeping on the bed
      if (foxStateRef.current.behavior === 'sleeping' && Math.random() < 0.05) {
        const fox = foxStateRef.current;
        setParticles((prev) => [
          ...prev.slice(-25),
          {
            id: Math.random(),
            x: fox.x + (fox.facing === 'left' ? -15 : 15) + (Math.random() * 8 - 4),
            y: fox.y - 18,
            vx: (Math.random() - 0.2) * 0.7,
            vy: -1.4 - Math.random() * 0.5,
            life: 2.2,
            maxLife: 2.2,
            type: 'sleep',
            size: 14 + Math.random() * 8,
            opacity: 0.9,
          },
        ]);
      }

      animFrame = requestAnimationFrame(updateParticles);
    };

    animFrame = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Petting Interaction Handler
  const handlePet = useCallback(
    (screenX: number, screenY: number) => {
      const now = Date.now();

      // Audio vocalization throttling (every ~350ms)
      if (now - lastPetSoundTimeRef.current > 350) {
        lastPetSoundTimeRef.current = now;
        soundEngine.playActionSound('petting');
        soundEngine.playPettingChime();
      }

      // Spawn heart / sparkle particles
      const newParticles: Particle[] = [
        {
          id: Math.random(),
          x: screenX + (Math.random() * 30 - 15),
          y: screenY - 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -2 - Math.random() * 1.8,
          life: 1.2,
          maxLife: 1.2,
          type: Math.random() < 0.65 ? 'heart' : 'sparkle',
          size: 12 + Math.random() * 10,
          opacity: 1,
          color: Math.random() < 0.5 ? '#FF4D6D' : '#FF758F',
        },
      ];

      setParticles((prev) => [...prev.slice(-30), ...newParticles]);

      // Update state
      setFoxState((prev) => {
        const nextAffection = Math.min(100, prev.affection + 0.5);
        const nextHappiness = Math.min(100, prev.happiness + 0.8);

        // If sleeping, petting layers gently without interrupting the bed sleep recharge
        return {
          ...prev,
          isPetting: true,
          pettingIntensity: Math.min(1, prev.pettingIntensity + 0.2),
          affection: nextAffection,
          happiness: nextHappiness,
          mood: 'blissful',
          totalPets: prev.totalPets + 1,
          lastInteractionTime: now,
        };
      });

      // Reset isPetting flag after a short gap
      if (pettingTimeoutRef.current) {
        clearTimeout(pettingTimeoutRef.current);
      }
      pettingTimeoutRef.current = setTimeout(() => {
        setFoxState((prev) => ({
          ...prev,
          isPetting: false,
          pettingIntensity: 0,
        }));
      }, 700);
    },
    []
  );

  const handlePetStart = useCallback(() => {
    soundEngine.playPettingChime();
  }, []);

  const handlePetEnd = useCallback(() => {
    if (pettingTimeoutRef.current) {
      clearTimeout(pettingTimeoutRef.current);
    }
    pettingTimeoutRef.current = setTimeout(() => {
      setFoxState((prev) => ({
        ...prev,
        isPetting: false,
        pettingIntensity: 0,
      }));
    }, 500);
  }, []);

  // Prompt the Fox to go to the Red Cube Bed and Sleep until Energy is 100%
  const promptGoToBed = useCallback(() => {
    const current = foxStateRef.current;
    if (current.behavior === 'sleeping') {
      // Already sleeping in bed
      logActivity('sleeping', 'Fox is already asleep in the red cube bed recharging energy.');
      return;
    }

    soundEngine.playActionSound('walking');
    const lastSound = soundEngine.getLastSound();
    const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
    walkTargetRef.current = RED_BED_POSITION.x;

    setFoxState((prev) => ({
      ...prev,
      behavior: 'walking',
      isGoingToBed: true,
      facing: prev.x < RED_BED_POSITION.x ? 'right' : 'left',
      poseTimer: 8,
      mood: 'sleepy',
    }));

    logActivity('walking', 'You prompted the fox to sleep! Heading to the red cube bed...', soundDesc);
  }, [logActivity]);

  // Wake Up Fox Gently
  const wakeUpFox = useCallback(() => {
    const current = foxStateRef.current;
    if (current.behavior !== 'sleeping') return;

    soundEngine.playActionSound('yawning');
    const lastSound = soundEngine.getLastSound();
    const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
    setFoxState((prev) => ({
      ...prev,
      behavior: 'yawning',
      isSleepingInBed: false,
      isGoingToBed: false,
      mood: 'happy',
      poseTimer: 3.5,
    }));

    logActivity('yawning', 'You woke up the fox. It stretched and yawned.', soundDesc);
  }, [logActivity]);

  // Quick Action: Feed a Berry / Treat
  const feedBerry = useCallback(() => {
    soundEngine.playActionSound('feed');
    const lastSound = soundEngine.getLastSound();
    const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;

    const fox = foxStateRef.current;
    setParticles((prev) => [
      ...prev,
      {
        id: Math.random(),
        x: fox.x,
        y: fox.y - 30,
        vx: 0,
        vy: -1.5,
        life: 1.5,
        maxLife: 1.5,
        type: 'sparkle',
        size: 16,
        opacity: 1,
        color: '#FFB703',
      },
    ]);

    setFoxState((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 25),
      happiness: Math.min(100, prev.happiness + 15),
      energy: Math.min(100, prev.energy + 10),
      mood: 'blissful',
    }));

    logActivity('playing', 'You offered a sweet wild berry! The fox munched it happily.', soundDesc);
  }, [logActivity]);

  // Quick Action: Toss Ball / Play
  const playWithBall = useCallback(() => {
    soundEngine.playActionSound('play_ball');
    const lastSound = soundEngine.getLastSound();
    const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;

    const fox = foxStateRef.current;
    const targetX = fox.x > 360 ? 200 : 480;
    walkTargetRef.current = targetX;

    setFoxState((prev) => ({
      ...prev,
      behavior: 'playing',
      poseTimer: 5.5,
      mood: 'playful',
      isGoingToBed: false,
      happiness: Math.min(100, prev.happiness + 20),
    }));

    logActivity('playing', 'You tossed a bouncy yarn ball! The fox sprang after it.', soundDesc);
  }, [logActivity]);

  // Quick Action: Call Fox
  const callFox = useCallback(() => {
    soundEngine.playActionSound('call_fox');
    const lastSound = soundEngine.getLastSound();
    const soundDesc = lastSound ? `${lastSound.soundName} (Var #${lastSound.variation})` : undefined;
    walkTargetRef.current = 360;

    setFoxState((prev) => ({
      ...prev,
      behavior: 'walking',
      poseTimer: 4.5,
      mood: 'curious',
      isGoingToBed: false,
      facing: prev.x > 360 ? 'left' : 'right',
    }));

    logActivity('walking', 'You called your fox over. It trotted to the center curiously.', soundDesc);
  }, [logActivity]);

  // Quick Action: Jump (Simple, visible vertical leap, no sound needed)
  const makeJump = useCallback(() => {
    // If currently sleeping in bed, wake up first
    if (foxStateRef.current.behavior === 'sleeping') {
      wakeUpFox();
    }

    setFoxState((prev) => ({
      ...prev,
      behavior: 'jumping',
      poseTimer: 1.0, // 1-second full jump arc
      mood: 'playful',
      isGoingToBed: false,
      isSleepingInBed: false,
      happiness: Math.min(100, prev.happiness + 6),
    }));

    // Spawn slight ground dust / sparkle burst on leap
    const spawnX = foxStateRef.current.x;
    const spawnY = foxStateRef.current.y + 40;
    const jumpParticles: Particle[] = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: spawnX + (Math.random() - 0.5) * 36,
      y: spawnY + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 45,
      vy: -Math.random() * 30 - 15,
      life: 0.7,
      maxLife: 0.7,
      type: 'sparkle',
      size: 6 + Math.random() * 4,
      opacity: 0.85,
      color: '#E86A33',
    }));
    setParticles((prev) => [...prev.slice(-25), ...jumpParticles]);

    // Note: User constraint: "This action doesnt need sound." - no sound is triggered
    logActivity('jumping', 'The fox sprang high into the air with a playful leap!');
  }, [logActivity, wakeUpFox]);

  // Reset State to Defaults
  const resetState = useCallback(() => {
    localStorage.removeItem('fox_pet_unity_save_data_v1');
    const restored = loadFoxStateFromDisk();
    setFoxState(restored.state);
    logActivity('idle_standing', 'Reset pet companion data back to prototype defaults.');
  }, [logActivity]);

  // Force Save to Disk
  const forceSave = useCallback(() => {
    const success = saveFoxStateToDisk(foxStateRef.current);
    if (success) {
      logActivity(foxStateRef.current.behavior, 'Saved fox state to persistent disk storage.');
    }
    return success;
  }, [logActivity]);

  return {
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
  };
}
