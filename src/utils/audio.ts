// Web Audio API Synthesizer for Authentic Real Fox Sounds
// Generates natural real fox vocalizations: Gekkering, Yips, Whimpers, Churrs, Snorts/Huffs, and Snores.

export type FoxSoundAction =
  | 'idle_standing'
  | 'idle_sitting'
  | 'idle_curled'
  | 'stretching'
  | 'yawning'
  | 'walking'
  | 'playing'
  | 'rolling'
  | 'sleeping'
  | 'petting'
  | 'feed'
  | 'play_ball'
  | 'call_fox';

export interface SoundEvent {
  action: FoxSoundAction;
  soundName: string;
  variation: number;
  timestamp: number;
}

class FoxSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private lastSoundEvent: SoundEvent | null = null;
  private soundListeners: Array<(event: SoundEvent) => void> = [];

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public addListener(cb: (event: SoundEvent) => void) {
    this.soundListeners.push(cb);
    return () => {
      this.soundListeners = this.soundListeners.filter((l) => l !== cb);
    };
  }

  private notify(action: FoxSoundAction, soundName: string, variation: number) {
    const event: SoundEvent = {
      action,
      soundName,
      variation,
      timestamp: Date.now(),
    };
    this.lastSoundEvent = event;
    this.soundListeners.forEach((cb) => cb(event));
  }

  public getLastSound(): SoundEvent | null {
    return this.lastSoundEvent;
  }

  // Generate white noise buffer for breaths, huffs, paw steps
  private createNoise(ctx: AudioContext, duration: number): AudioBuffer {
    const size = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- 1. PLAYING SOUNDS ---
  // Real Fox Noise 1: Gekkering Staccato Laugh (the classic fox giggle)
  playGekkering(action: FoxSoundAction = 'playing') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bursts = 5; // 5 rapid staccato syllables
      for (let i = 0; i < bursts; i++) {
        const t = now + i * 0.085;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        // Pitch ramps down per burst (characteristic fox kek-kek)
        const base = 850 + (i % 2 === 0 ? 100 : -60);
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(base * 0.65, t + 0.06);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(3.5, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.07);
      }
      this.notify(action, 'Fox Gekkering Laugh', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Playful High Yip
  playHighYip(action: FoxSoundAction = 'playing') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Fast pitch jump characteristic of fox yips
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
      this.notify(action, 'Playful High Yip', 2);
    } catch {
      // Ignore
    }
  }

  // --- 2. ROLLING SOUNDS ---
  // Real Fox Noise 1: Rolling Joy Gekker (throaty chortle)
  playRollingChortle() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(720 + i * 80, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.07);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      }
      this.notify('rolling', 'Joyful Belly Gekker', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Rolling Purr-Pant
  playRollingPurrPant() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
      this.notify('rolling', 'Rolling Purr-Pant', 2);
    } catch {
      // Ignore
    }
  }

  // --- 3. YAWNING SOUNDS ---
  // Real Fox Noise 1: Fox Squeal Yawn (high to low vocalized whine)
  playFoxSquealYawn() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.65);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
      this.notify('yawning', 'Vocal Fox Squeal-Yawn', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Deep Breath Yawn Sigh
  playFoxYawnSigh() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.75);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.linearRampToValueAtTime(260, now + 0.75);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
      this.notify('yawning', 'Deep Yawn Sigh', 2);
    } catch {
      // Ignore
    }
  }

  // --- 4. STRETCHING SOUNDS ---
  // Real Fox Noise 1: Stretch Groan Whimper
  playStretchGroanWhimper() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.linearRampToValueAtTime(540, now + 0.25);
      osc.frequency.linearRampToValueAtTime(320, now + 0.55);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
      this.notify('stretching', 'Stretch Whimper', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Spine-Arch Vocal Creak
  playStretchCreak() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.3);
      osc.frequency.linearRampToValueAtTime(120, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
      this.notify('stretching', 'Arched Spine Creak', 2);
    } catch {
      // Ignore
    }
  }

  // --- 5. SLEEPING SOUNDS ---
  // Real Fox Noise 1: Soft Rhythmic Sleep Snore / Breath Puff
  playSleepSnore() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(62, now);
      osc.frequency.linearRampToValueAtTime(74, now + 0.25);
      osc.frequency.linearRampToValueAtTime(58, now + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
      this.notify('sleeping', 'Cozy Sleep Snore', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Dream Tiny Whimper
  playSleepDreamWhimper() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
      this.notify('sleeping', 'Dreaming Whimper', 2);
    } catch {
      // Ignore
    }
  }

  // --- 6. WALKING / TROTTING SOUNDS ---
  // Real Fox Noise 1: Soft Patter Paws
  playWalkingPaws() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.12;
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoise(ctx, 0.05);
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700, t);
        filter.Q.setValueAtTime(1.5, t);

        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(t);
        noise.stop(t + 0.05);
      }
      this.notify('walking', 'Patter Paws Trot', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Inquisitive Travel Peep / Chirp
  playWalkingPeep() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
      this.notify('walking', 'Travel Chirrup', 2);
    } catch {
      // Ignore
    }
  }

  // --- 7. IDLE STANDING SOUNDS ---
  // Real Fox Noise 1: Alert Snout Sniff / Huff
  playStandingSniff() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.11;
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoise(ctx, 0.06);
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(3.2, t);

        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(t);
        noise.stop(t + 0.06);
      }
      this.notify('idle_standing', 'Curious Snout Sniff', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Short Alert Yip
  playStandingYip() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(1150, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.11);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
      this.notify('idle_standing', 'Alert Yip', 2);
    } catch {
      // Ignore
    }
  }

  // --- 8. IDLE SITTING SOUNDS ---
  // Real Fox Noise 1: Throaty Churr (friendly vibration)
  playSittingChurr() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.15);
      osc.frequency.linearRampToValueAtTime(110, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
      this.notify('idle_sitting', 'Throaty Churr', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Sitting Inquiring Whimper
  playSittingWhimper() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
      this.notify('idle_sitting', 'Inquiring Whimper', 2);
    } catch {
      // Ignore
    }
  }

  // --- 9. IDLE CURLED SOUNDS ---
  // Real Fox Noise 1: Settling Cozy Sigh
  playCurledSigh() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoise(ctx, 0.45);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.linearRampToValueAtTime(220, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.48);
      this.notify('idle_curled', 'Cozy Settling Sigh', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Curled Nose-Purr
  playCurledPurr() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(52, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      osc.frequency.linearRampToValueAtTime(48, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
      this.notify('idle_curled', 'Curled Nose-Purr', 2);
    } catch {
      // Ignore
    }
  }

  // --- 10. PETTING SOUNDS ---
  // Real Fox Noise 1: Throbbing Rhythmic Purr
  playPettingPurr() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.linearRampToValueAtTime(58, now + 0.25);
      osc.frequency.linearRampToValueAtTime(48, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
      this.notify('petting', 'Throbbing Throat Purr', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Affectionate Greeting Trill/Whimper
  playPettingTrill() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
      this.notify('petting', 'Affectionate Trill', 2);
    } catch {
      // Ignore
    }
  }

  // --- 11. FEEDING SOUNDS ---
  // Real Fox Noise 1: Berry Crunch with Contented Squeak
  playFeedCrunchSqueak() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Quick crunch pop
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(640, now + 0.06);
      gain1.gain.setValueAtTime(0.07, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Follow-up happy chirp
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(820, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1180, now + 0.16);
      osc2.frequency.exponentialRampToValueAtTime(900, now + 0.25);
      gain2.gain.setValueAtTime(0.001, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.07, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);

      this.notify('feed', 'Berry Munch & Squeak', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Eager Nibble & Whimper
  playFeedNibbleWhimper() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450 + i * 150, t);
        osc.frequency.exponentialRampToValueAtTime(250, t + 0.06);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.07);
      }
      this.notify('feed', 'Tasty Nibble & Whimper', 2);
    } catch {
      // Ignore
    }
  }

  // --- 12. TOSS BALL (PLAY TOY) SOUNDS ---
  // Real Fox Noise 1: Excited Pounce Yip
  playBallPounceYip() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(1550, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
      this.notify('play_ball', 'Excited Pounce Yip', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Toy Chase Gekkering Chortle
  playBallGekker() {
    this.playGekkering('play_ball');
  }

  // --- 13. CALL FOX SOUNDS ---
  // Real Fox Noise 1: Responsive Acknowledgment Bark
  playCallAnswerBark() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(2.8, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
      this.notify('call_fox', 'Responsive Fox Bark', 1);
    } catch {
      // Ignore
    }
  }

  // Real Fox Noise 2: Eager Answering Whimper
  playCallAnswerWhimper() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(1020, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
      this.notify('call_fox', 'Eager Answering Whimper', 2);
    } catch {
      // Ignore
    }
  }

  // --- MASTER ACTION SOUND DISPATCHER ---
  // Guaranteed: At least 2 different real fox noises for EVERY action!
  playActionSound(action: FoxSoundAction, preferredVariation?: 1 | 2) {
    if (this.isMuted) return;
    const variation = preferredVariation || (Math.random() < 0.5 ? 1 : 2);

    switch (action) {
      case 'playing':
        if (variation === 1) this.playGekkering('playing');
        else this.playHighYip('playing');
        break;

      case 'rolling':
        if (variation === 1) this.playRollingChortle();
        else this.playRollingPurrPant();
        break;

      case 'yawning':
        if (variation === 1) this.playFoxSquealYawn();
        else this.playFoxYawnSigh();
        break;

      case 'stretching':
        if (variation === 1) this.playStretchGroanWhimper();
        else this.playStretchCreak();
        break;

      case 'sleeping':
        if (variation === 1) this.playSleepSnore();
        else this.playSleepDreamWhimper();
        break;

      case 'walking':
        if (variation === 1) this.playWalkingPaws();
        else this.playWalkingPeep();
        break;

      case 'idle_standing':
        if (variation === 1) this.playStandingSniff();
        else this.playStandingYip();
        break;

      case 'idle_sitting':
        if (variation === 1) this.playSittingChurr();
        else this.playSittingWhimper();
        break;

      case 'idle_curled':
        if (variation === 1) this.playCurledSigh();
        else this.playCurledPurr();
        break;

      case 'petting':
        if (variation === 1) this.playPettingPurr();
        else this.playPettingTrill();
        break;

      case 'feed':
        if (variation === 1) this.playFeedCrunchSqueak();
        else this.playFeedNibbleWhimper();
        break;

      case 'play_ball':
        if (variation === 1) this.playBallPounceYip();
        else this.playBallGekker();
        break;

      case 'call_fox':
        if (variation === 1) this.playCallAnswerBark();
        else this.playCallAnswerWhimper();
        break;
    }
  }

  // Compatibility helpers
  playPurr() {
    this.playPettingPurr();
  }

  playHappyChirp() {
    this.playHighYip('playing');
  }

  playYawn() {
    this.playFoxSquealYawn();
  }

  playPettingChime() {
    // Subtle chime accompaniment
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + Math.random() * 100, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  playPop() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }
}

export const soundEngine = new FoxSoundEngine();
