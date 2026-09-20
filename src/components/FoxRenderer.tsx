import React, { useEffect, useRef } from 'react';
import { FoxBehavior, FoxState, Particle, RED_BED_POSITION } from '../types';

interface FoxRendererProps {
  state: FoxState;
  onPet?: (x: number, y: number) => void;
  onPetStart?: () => void;
  onPetEnd?: () => void;
  onBedClick?: () => void;
  width?: number;
  height?: number;
  isMini?: boolean;
  className?: string;
  particles?: Particle[];
}

export const FoxRenderer: React.FC<FoxRendererProps> = ({
  state,
  onPet,
  onPetStart,
  onPetEnd,
  onBedClick,
  width = 720,
  height = 420,
  isMini = false,
  className = '',
  particles = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isInteractingRef = useRef<boolean>(false);
  const animTimeRef = useRef<number>(0);
  const earTwitchTimeRef = useRef<number>(0);
  const nextEarTwitchRef = useRef<number>(3);
  const blinkTimerRef = useRef<number>(0);
  const isBlinkingRef = useRef<boolean>(false);

  // Interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isInteractingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    // Check if clicked directly on the red cube bed
    if (!isMini && onBedClick) {
      const distToBed = Math.hypot(x - RED_BED_POSITION.x, y - RED_BED_POSITION.y);
      if (distToBed < 65) {
        onBedClick();
        return;
      }
    }

    onPetStart?.();
    onPet?.(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    // Check hit test against fox center
    const foxScreenX = isMini ? width / 2 : state.x;
    const foxScreenY = isMini ? height / 2 + 15 : state.y;
    const dist = Math.hypot(x - foxScreenX, y - foxScreenY);

    if (dist < (isMini ? 80 : 120)) {
      if (isInteractingRef.current || e.buttons > 0) {
        onPet?.(x, y);
      }
    }
  };

  const handlePointerUp = () => {
    isInteractingRef.current = false;
    onPetEnd?.();
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      animTimeRef.current += dt;
      const t = animTimeRef.current;

      // Ear twitch random timing
      if (t > nextEarTwitchRef.current) {
        earTwitchTimeRef.current = t;
        nextEarTwitchRef.current = t + 2.5 + Math.random() * 4;
      }
      const isEarTwitching = t - earTwitchTimeRef.current < 0.25;

      // Eye blink timing
      blinkTimerRef.current += dt;
      if (blinkTimerRef.current > 3.8) {
        isBlinkingRef.current = true;
        if (blinkTimerRef.current > 4.05) {
          isBlinkingRef.current = false;
          blinkTimerRef.current = Math.random() * 1.5;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Draw 2D Minimal Red Cube Bed
      if (!isMini) {
        drawRedCubeBed(ctx, RED_BED_POSITION.x, RED_BED_POSITION.y + 10, 1.0, state.behavior === 'sleeping');
      } else if (state.behavior === 'sleeping' || state.isSleepingInBed) {
        drawRedCubeBed(ctx, width / 2, height / 2 + 28, 0.7, true);
      }

      // Fox position
      const isSleeping = state.behavior === 'sleeping';
      const foxX = isMini ? width / 2 : (isSleeping ? RED_BED_POSITION.x : state.x);
      const foxY = isMini ? (isSleeping ? height / 2 + 8 : height / 2 + 15) : (isSleeping ? RED_BED_POSITION.y - 12 : state.y);
      const scale = isMini ? 0.65 : 1.15;
      const isFacingLeft = state.facing === 'left';

      // Breathing oscillation
      const breathSpeed = state.behavior === 'sleeping' ? 1.8 : state.behavior === 'playing' ? 6.0 : 3.2;
      const breath = Math.sin(t * breathSpeed) * 3;

      // Tail oscillation
      const tailWagSpeed = state.isPetting ? 12 : state.behavior === 'playing' ? 10 : 3.5;
      const tailAngle = Math.sin(t * tailWagSpeed) * (state.isPetting ? 0.45 : 0.22);

      // Walk cycle phase
      const walkCycle = state.behavior === 'walking' ? (t * 8) % (Math.PI * 2) : 0;
      const walkBob = state.behavior === 'walking' ? Math.abs(Math.sin(walkCycle)) * 6 : 0;

      // Jump vertical calculation (simple, visible physics arc)
      const isJumping = state.behavior === 'jumping';
      // Jump duration is 1.0s, state.poseTimer counts down from 1.0 to 0
      const jumpProgress = isJumping ? Math.max(0, Math.min(1, 1 - (state.poseTimer / 1.0))) : 0;
      // High, visible leap arc: sin(progress * PI) reaches 80px peak
      const jumpHeight = isJumping ? Math.sin(jumpProgress * Math.PI) * 80 : 0;
      const jumpY = foxY - jumpHeight;

      ctx.save();
      ctx.translate(foxX, jumpY);
      ctx.scale(isFacingLeft ? -scale : scale, scale);

      // Shadow underneath stays on the ground at (foxY + 48)
      // When jumping, shadow shrinks and softens slightly with altitude
      const shadowScale = isJumping ? Math.max(0.45, 1 - (jumpHeight / 115)) : 1;
      const shadowAlpha = isJumping ? Math.max(0.06, 0.18 - (jumpHeight / 500)) : 0.18;
      const shadowW = (isSleeping ? 48 : state.behavior === 'idle_curled' ? 70 : 85) * shadowScale;
      const shadowH = (isSleeping ? 12 : 18) * shadowScale;

      ctx.save();
      // Relative ground position since context is translated to jumpY
      ctx.translate(0, 48 + jumpHeight);
      ctx.beginPath();
      ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(40, 25, 20, ${shadowAlpha})`;
      ctx.fill();
      ctx.restore();

      // Draw Fox according to behavior pose
      drawFoxBody(ctx, state, {
        t,
        breath,
        tailAngle,
        walkCycle,
        walkBob,
        isBlinking: isBlinkingRef.current,
        isEarTwitching,
      });

      ctx.restore();

      // Render Particles (hearts, sparkles, zzz)
      if (particles && particles.length > 0) {
        for (const p of particles) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.translate(p.x, p.y);

          if (p.type === 'heart') {
            drawHeart(ctx, p.size, p.color || '#FF4D6D');
          } else if (p.type === 'sparkle') {
            drawSparkle(ctx, p.size, p.color || '#FFD166');
          } else if (p.type === 'sleep') {
            drawZzz(ctx, p.size);
          } else if (p.type === 'leaf') {
            drawLeaf(ctx, p.size);
          }
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, width, height, isMini, particles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`touch-none cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ width: '100%', height: '100%' }}
      title="Click and stroke over the fox to pet!"
    />
  );
};

// Procedural Fox Anatomical Drawing Engine
interface RenderParams {
  t: number;
  breath: number;
  tailAngle: number;
  walkCycle: number;
  walkBob: number;
  isBlinking: boolean;
  isEarTwitching: boolean;
}

function drawFoxBody(ctx: CanvasRenderingContext2D, state: FoxState, params: RenderParams) {
  const { behavior, isPetting } = state;
  const { t, breath, tailAngle, walkCycle, walkBob, isBlinking, isEarTwitching } = params;

  // Colors
  const furOrange = '#E86A33';
  const furDark = '#C84B18';
  const furWhite = '#FFFBF5';
  const furPaw = '#2C221E';
  const noseColor = '#1F1614';
  const blushColor = 'rgba(255, 110, 130, 0.45)';

  // Special Poses
  if (behavior === 'jumping') {
    // Clean, visible jumping pose with dynamic leap geometry
    const jumpProgress = Math.max(0, Math.min(1, 1 - (state.poseTimer / 1.0)));
    const isAscending = jumpProgress < 0.45;
    const isDescent = jumpProgress > 0.55;

    ctx.save();
    // Dynamic body tilt during leap arc
    const bodyTilt = isAscending ? -0.24 : isDescent ? 0.22 : -0.02;
    ctx.rotate(bodyTilt);

    // Bushy tail trailing behind
    ctx.save();
    ctx.translate(-44, 12);
    ctx.rotate(-0.55 + (isAscending ? 0.35 : -0.2) + Math.sin(t * 8) * 0.12);
    drawBushyTail(ctx, furOrange, furDark, furWhite, 1.15);
    ctx.restore();

    // Hind legs trailing backward in flight
    drawLeg(ctx, -38, 14, -48, 38, furOrange, furPaw);
    drawLeg(ctx, -24, 18, -32, 40, furOrange, furPaw);

    // Streamlined leaping torso
    ctx.beginPath();
    ctx.ellipse(-6, 16, 44, 25, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // White belly
    ctx.beginPath();
    ctx.ellipse(0, 24, 28, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Chest fur ruff
    ctx.beginPath();
    ctx.ellipse(20, 12, 22, 20, 0.25, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(24, 15, 16, 16, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Front paws outstretched forward / downward
    if (isAscending) {
      // Reaching forward during launch
      drawLeg(ctx, 16, 18, 34, 30, furOrange, furPaw);
      drawLeg(ctx, 28, 20, 46, 32, furOrange, furPaw);
    } else {
      // Preparing for landing
      drawLeg(ctx, 16, 20, 26, 44, furOrange, furPaw);
      drawLeg(ctx, 28, 22, 38, 46, furOrange, furPaw);
    }

    // Head held high and alert with joyful expression
    ctx.save();
    ctx.translate(38, 4);
    ctx.rotate(isAscending ? -0.15 : 0.08);
    drawHead(ctx, furOrange, furDark, furWhite, furPaw, noseColor, blushColor, {
      isBlinking: false,
      isPetting: false,
      isEarTwitching,
      expression: 'playful',
    });
    ctx.restore();

    ctx.restore();
    return;
  }

  if (behavior === 'idle_curled' || behavior === 'sleeping') {
    // Curled up sleeping loaf pose
    ctx.save();
    ctx.translate(0, breath * 0.7);

    // Tail wrapping around front
    ctx.save();
    ctx.translate(-15, 20);
    ctx.rotate(-0.2 + Math.sin(t * 1.5) * 0.05);
    drawBushyTail(ctx, furOrange, furDark, furWhite, 1.05);
    ctx.restore();

    // Body ball
    ctx.beginPath();
    ctx.ellipse(0, 18, 52, 38, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // White belly fold
    ctx.beginPath();
    ctx.ellipse(6, 26, 32, 22, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Head nestled against body
    ctx.save();
    ctx.translate(28, 14);

    // Head base
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 20, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // White cheeks
    ctx.beginPath();
    ctx.ellipse(8, 6, 15, 12, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Ears folded back
    drawEar(ctx, -8, -16, -0.4, isEarTwitching, furOrange, furWhite, furPaw);
    drawEar(ctx, 10, -18, 0.2, false, furOrange, furWhite, furPaw);

    // Sleeping eye
    drawClosedEye(ctx, 10, 0, 8, isPetting);

    // Cute Nose
    ctx.beginPath();
    ctx.ellipse(19, 4, 3.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = noseColor;
    ctx.fill();

    // Gentle blush
    if (isPetting) {
      ctx.beginPath();
      ctx.arc(6, 8, 8, 0, Math.PI * 2);
      ctx.fillStyle = blushColor;
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
    return;
  }

  if (behavior === 'stretching') {
    // Classic playful downward stretch: front low, rear high
    ctx.save();
    const stretchT = (t * 2) % (Math.PI * 2);
    const stretchArch = Math.sin(stretchT) * 4;

    // Tail arched high
    ctx.save();
    ctx.translate(-45, -10 + stretchArch);
    ctx.rotate(-0.8 + tailAngle * 0.5);
    drawBushyTail(ctx, furOrange, furDark, furWhite, 1.1);
    ctx.restore();

    // Hind legs high
    drawLeg(ctx, -38, 0 + stretchArch, -36, 46, furOrange, furPaw);
    drawLeg(ctx, -24, 4 + stretchArch, -22, 46, furOrange, furPaw);

    // Arched torso
    ctx.beginPath();
    ctx.moveTo(-45, 10 + stretchArch);
    ctx.quadraticCurveTo(-10, -5 + stretchArch, 25, 28);
    ctx.quadraticCurveTo(10, 42, -35, 38 + stretchArch);
    ctx.closePath();
    ctx.fillStyle = furOrange;
    ctx.fill();

    // Chest white bib
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(20, 22, 28, 30);
    ctx.quadraticCurveTo(15, 38, -5, 32);
    ctx.closePath();
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Front paws extended far forward
    drawLeg(ctx, 16, 26, 42, 46, furOrange, furPaw);
    drawLeg(ctx, 28, 28, 52, 46, furOrange, furPaw);

    // Head low & forward
    ctx.save();
    ctx.translate(36, 22);
    ctx.rotate(0.18);
    drawHead(ctx, furOrange, furDark, furWhite, furPaw, noseColor, blushColor, {
      isBlinking,
      isPetting,
      isEarTwitching,
      expression: 'happy',
    });
    ctx.restore();

    ctx.restore();
    return;
  }

  if (behavior === 'rolling') {
    // Playful belly-up roll
    ctx.save();
    const rollWiggle = Math.sin(t * 7) * 0.12;
    ctx.translate(0, 20);
    ctx.rotate(Math.PI * 0.85 + rollWiggle);

    // Wagging tail
    ctx.save();
    ctx.translate(-40, 0);
    ctx.rotate(-tailAngle * 1.5);
    drawBushyTail(ctx, furOrange, furDark, furWhite, 1);
    ctx.restore();

    // Torso upside down
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // Big fluffy white belly exposed!
    ctx.beginPath();
    ctx.ellipse(4, -2, 32, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();

    // Four happy paws waving in the air
    const pawKick = Math.sin(t * 8) * 8;
    drawLeg(ctx, -20, -10, -28 + pawKick, -36, furOrange, furPaw);
    drawLeg(ctx, -10, -12, -15 - pawKick, -38, furOrange, furPaw);
    drawLeg(ctx, 15, -12, 18 + pawKick, -38, furOrange, furPaw);
    drawLeg(ctx, 25, -10, 32 - pawKick, -36, furOrange, furPaw);

    // Head upside down with big smile
    ctx.save();
    ctx.translate(35, 5);
    ctx.rotate(0.3);
    drawHead(ctx, furOrange, furDark, furWhite, furPaw, noseColor, blushColor, {
      isBlinking: false,
      isPetting: true,
      isEarTwitching: true,
      expression: 'playful',
    });
    ctx.restore();

    ctx.restore();
    return;
  }

  // --- General Poses (Standing, Sitting, Walking, Playing, Yawning) ---
  const isSitting = behavior === 'idle_sitting';
  const isPlaying = behavior === 'playing';
  const isYawning = behavior === 'yawning';

  ctx.save();

  // Vertical bob from breathing & walking
  const currentBob = -walkBob + (isSitting ? breath * 0.5 : breath);
  ctx.translate(0, currentBob);

  // Playful hop
  if (isPlaying) {
    const hop = Math.max(0, Math.sin(t * 7) * 16);
    ctx.translate(0, -hop);
  }

  // 1. Tail (Behind body)
  ctx.save();
  const tailAnchorX = isSitting ? -32 : -36;
  const tailAnchorY = isSitting ? 22 : 6;
  ctx.translate(tailAnchorX, tailAnchorY);
  ctx.rotate(isSitting ? -0.4 + tailAngle * 0.6 : tailAngle);
  drawBushyTail(ctx, furOrange, furDark, furWhite, 1.05);
  ctx.restore();

  // 2. Back legs (Behind body)
  if (isSitting) {
    // Folded hind leg
    ctx.beginPath();
    ctx.ellipse(-18, 32, 22, 16, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = furDark;
    ctx.fill();
    // Hind paw
    ctx.beginPath();
    ctx.ellipse(-8, 44, 10, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = furPaw;
    ctx.fill();
  } else {
    // Standing or walking back legs
    const backLegSwing1 = Math.sin(walkCycle) * 16;
    const backLegSwing2 = Math.sin(walkCycle + Math.PI) * 16;
    drawLeg(ctx, -30, 12, -30 + backLegSwing1, 46, furDark, furPaw);
    drawLeg(ctx, -18, 14, -18 + backLegSwing2, 46, furOrange, furPaw);
  }

  // 3. Torso
  ctx.save();
  if (isSitting) {
    // Upright sitting torso
    ctx.beginPath();
    ctx.ellipse(-5, 14, 28, 32, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // White chest & belly
    ctx.beginPath();
    ctx.ellipse(5, 12, 18, 26, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();
  } else {
    // Horizontal body
    ctx.beginPath();
    ctx.ellipse(-5, 8, 38, 24, 0.05, 0, Math.PI * 2);
    ctx.fillStyle = furOrange;
    ctx.fill();

    // Soft white belly line
    ctx.beginPath();
    ctx.ellipse(2, 16, 28, 14, 0.08, 0, Math.PI * 2);
    ctx.fillStyle = furWhite;
    ctx.fill();
  }
  ctx.restore();

  // 4. Front Legs
  if (isSitting) {
    // Two neat straight front paws planted on floor
    drawLeg(ctx, 12, 16, 12, 46, furOrange, furPaw);
    drawLeg(ctx, 22, 16, 22, 46, furOrange, furPaw);
  } else {
    // Standing / walking front legs
    const frontLegSwing1 = Math.sin(walkCycle + Math.PI) * 16;
    const frontLegSwing2 = Math.sin(walkCycle) * 16;
    drawLeg(ctx, 12, 14, 12 + frontLegSwing1, 46, furDark, furPaw);
    drawLeg(ctx, 24, 14, 24 + frontLegSwing2, 46, furOrange, furPaw);
  }

  // 5. Head
  ctx.save();
  const headX = isSitting ? 18 : 28;
  const headY = isSitting ? -18 : -10;
  ctx.translate(headX, headY);

  // Subtle head tilt / looking around
  const headTilt = isSitting ? Math.sin(t * 1.8) * 0.12 : Math.sin(t * 1.2) * 0.06;
  ctx.rotate(headTilt);

  drawHead(ctx, furOrange, furDark, furWhite, furPaw, noseColor, blushColor, {
    isBlinking,
    isPetting,
    isEarTwitching,
    expression: isYawning ? 'yawn' : isPlaying ? 'playful' : 'normal',
  });

  ctx.restore();

  ctx.restore();
}

// Draw realistic cute fluffy Fox Head
function drawHead(
  ctx: CanvasRenderingContext2D,
  furOrange: string,
  furDark: string,
  furWhite: string,
  furPaw: string,
  noseColor: string,
  blushColor: string,
  opts: {
    isBlinking: boolean;
    isPetting: boolean;
    isEarTwitching: boolean;
    expression: 'normal' | 'yawn' | 'happy' | 'playful';
  }
) {
  const { isBlinking, isPetting, isEarTwitching, expression } = opts;

  // Ears (Back first)
  drawEar(ctx, -14, -22, -0.32, isEarTwitching, furOrange, furWhite, furPaw);
  drawEar(ctx, 6, -26, 0.12, false, furOrange, furWhite, furPaw);

  // Head base
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 22, 0.05, 0, Math.PI * 2);
  ctx.fillStyle = furOrange;
  ctx.fill();

  // White cheeks & muzzle ruff
  ctx.beginPath();
  ctx.moveTo(8, -8);
  ctx.quadraticCurveTo(28, 4, 22, 18);
  ctx.quadraticCurveTo(10, 24, -6, 20);
  ctx.quadraticCurveTo(-14, 12, -8, 2);
  ctx.closePath();
  ctx.fillStyle = furWhite;
  ctx.fill();

  // White fluffy cheek tufts extending out
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(-20, 14);
  ctx.lineTo(-12, 18);
  ctx.lineTo(-22, 24);
  ctx.lineTo(-8, 22);
  ctx.closePath();
  ctx.fillStyle = furWhite;
  ctx.fill();

  // Muzzle snout
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.quadraticCurveTo(24, 6, 26, 12);
  ctx.quadraticCurveTo(18, 16, 8, 14);
  ctx.closePath();
  ctx.fillStyle = furWhite;
  ctx.fill();

  // Button Nose
  ctx.beginPath();
  ctx.ellipse(25, 9, 3.8, 2.8, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = noseColor;
  ctx.fill();
  // Nose highlight shine
  ctx.beginPath();
  ctx.arc(24, 8, 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  // Cute mouth / yawn
  if (expression === 'yawn') {
    ctx.beginPath();
    ctx.ellipse(18, 16, 6, 8, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#6E1D24';
    ctx.fill();
    // Little pink tongue
    ctx.beginPath();
    ctx.ellipse(19, 18, 3.5, 4, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FF7A92';
    ctx.fill();
  } else {
    // Normal cute cat/fox w-smile
    ctx.beginPath();
    ctx.moveTo(22, 12);
    ctx.quadraticCurveTo(19, 16, 15, 14);
    ctx.quadraticCurveTo(12, 16, 9, 13);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#4A2A20';
    ctx.stroke();
  }

  // Eyes
  if (isPetting || expression === 'happy' || expression === 'playful') {
    // Pleased curved happy ^_^ eye
    drawPleasedEye(ctx, 8, 2, 8);
  } else if (isBlinking || expression === 'yawn') {
    // Blinking / closed line
    drawClosedEye(ctx, 8, 2, 7, false);
  } else {
    // Wide curious glossy eye
    drawOpenEye(ctx, 8, 2);
  }

  // Rosy cheeks (blush)
  if (isPetting) {
    ctx.beginPath();
    ctx.ellipse(3, 11, 7, 5, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = blushColor;
    ctx.fill();
  }
}

// Helper: Pointed triangular fox ear
function drawEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  twitch: boolean,
  outerColor: string,
  innerColor: string,
  tipColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + (twitch ? 0.2 : 0));

  // Outer ear triangle
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.lineTo(0, -18);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fillStyle = outerColor;
  ctx.fill();

  // Dark ear tip
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(0, -18);
  ctx.lineTo(5, -6);
  ctx.closePath();
  ctx.fillStyle = tipColor;
  ctx.fill();

  // Inner fluffy white ear
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(0, -12);
  ctx.lineTo(7, 6);
  ctx.closePath();
  ctx.fillStyle = innerColor;
  ctx.fill();

  ctx.restore();
}

// Helper: Large bushy fox tail
function drawBushyTail(
  ctx: CanvasRenderingContext2D,
  orange: string,
  darkOrange: string,
  whiteTip: string,
  scale: number = 1
) {
  ctx.save();
  ctx.scale(scale, scale);

  // Main bushy tail body
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-35, -5, -65, -35, -95, -15);
  ctx.bezierCurveTo(-115, 5, -80, 45, -30, 25);
  ctx.bezierCurveTo(-10, 18, -2, 5, 0, 0);
  ctx.closePath();
  ctx.fillStyle = orange;
  ctx.fill();

  // Tail texture/under-shade
  ctx.beginPath();
  ctx.moveTo(-15, 12);
  ctx.quadraticCurveTo(-50, 32, -85, 20);
  ctx.quadraticCurveTo(-50, 10, -15, 12);
  ctx.fillStyle = darkOrange;
  ctx.fill();

  // Big fluffy white tail tip
  ctx.beginPath();
  ctx.moveTo(-80, -22);
  ctx.quadraticCurveTo(-110, -12, -118, -2);
  ctx.quadraticCurveTo(-108, 18, -85, 22);
  // Jagged fur edge connecting to orange
  ctx.lineTo(-80, 8);
  ctx.lineTo(-88, 2);
  ctx.lineTo(-78, -6);
  ctx.lineTo(-86, -14);
  ctx.closePath();
  ctx.fillStyle = whiteTip;
  ctx.fill();

  ctx.restore();
}

// Helper: Draw Leg & Paw
function drawLeg(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  legColor: string,
  pawColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1 - 4, y1);
  ctx.lineTo(x2 - 3, y2 - 6);
  ctx.lineTo(x2 + 3, y2 - 6);
  ctx.lineTo(x1 + 4, y1);
  ctx.closePath();
  ctx.fillStyle = legColor;
  ctx.fill();

  // Dark paw
  ctx.beginPath();
  ctx.ellipse(x2, y2, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = pawColor;
  ctx.fill();
  ctx.restore();
}

// Eye helpers
function drawOpenEye(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Big dark eye
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.5, 7, 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#261814';
  ctx.fill();

  // Amber iris ring
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 4.2, 5.5, 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#8A421D';
  ctx.fill();

  // Dark pupil
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 2.8, 4.2, 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#1A100E';
  ctx.fill();

  // Specular gleam sparkles
  ctx.beginPath();
  ctx.arc(1.5, -2, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-1.2, 2, 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fill();

  ctx.restore();
}

function drawPleasedEye(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 2, width / 2, Math.PI * 1.1, Math.PI * 1.9);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#2B1A15';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawClosedEye(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, isPleased: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  if (isPleased) {
    ctx.arc(0, 1, width / 2, Math.PI * 1.1, Math.PI * 1.9);
  } else {
    ctx.moveTo(-width / 2, 2);
    ctx.quadraticCurveTo(0, 5, width / 2, 2);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2B1A15';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

// Particle shape drawers
function drawHeart(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // top left curve
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  // bottom left curve
  ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.4, 0, size);
  // bottom right curve
  ctx.bezierCurveTo(0, (size + topCurveHeight) / 1.4, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
  // top right curve
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.closePath();
  ctx.fill();
}

function drawSparkle(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const nextAngle = ((i + 1) * Math.PI) / 2;
    const midAngle = (angle + nextAngle) / 2;

    const x1 = Math.cos(angle) * size;
    const y1 = Math.sin(angle) * size;
    const xMid = Math.cos(midAngle) * (size * 0.3);
    const yMid = Math.sin(midAngle) * (size * 0.3);

    if (i === 0) ctx.moveTo(x1, y1);
    ctx.lineTo(xMid, yMid);
    ctx.lineTo(Math.cos(nextAngle) * size, Math.sin(nextAngle) * size);
  }
  ctx.closePath();
  ctx.fill();
}

function drawZzz(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#8BA3C7';
  ctx.font = `bold ${Math.round(size)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Z', 0, 0);
}

function drawLeaf(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#E78839';
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Minimalist 2D Red Cube Bed
 * Designed with simple, crisp geometric styling and minimal graphics.
 */
function drawRedCubeBed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1,
  isOccupied: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 1. Soft minimal shadow on floor under the cube
  ctx.beginPath();
  ctx.ellipse(0, 42, 68, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40, 15, 15, 0.2)';
  ctx.fill();

  const hw = 58; // half width
  const topD = 24; // top depth
  const h = 34; // cube height

  // 2. Front-Left Face (Solid Bold Red)
  ctx.beginPath();
  ctx.moveTo(-hw, -topD);
  ctx.lineTo(0, 8);
  ctx.lineTo(0, 8 + h);
  ctx.lineTo(-hw, -topD + h);
  ctx.closePath();
  ctx.fillStyle = '#DC2626';
  ctx.fill();
  ctx.strokeStyle = '#B91C1C';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 3. Front-Right Face (Minimal Dark Red Shadow Face)
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(hw, -topD);
  ctx.lineTo(hw, -topD + h);
  ctx.lineTo(0, 8 + h);
  ctx.closePath();
  ctx.fillStyle = '#991B1B';
  ctx.fill();
  ctx.strokeStyle = '#7F1D1D';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 4. Top Face (Bright Minimal Red Surface where the fox curls up)
  ctx.beginPath();
  ctx.moveTo(0, -topD * 2 + 8);
  ctx.lineTo(hw, -topD);
  ctx.lineTo(0, 8);
  ctx.lineTo(-hw, -topD);
  ctx.closePath();
  ctx.fillStyle = '#EF4444';
  ctx.fill();
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 5. Minimalist sleep cushion inset on the top surface
  ctx.beginPath();
  ctx.moveTo(0, -topD * 2 + 14);
  ctx.lineTo(hw - 12, -topD + 2);
  ctx.lineTo(0, 2);
  ctx.lineTo(-hw + 12, -topD + 2);
  ctx.closePath();
  ctx.fillStyle = isOccupied ? '#FCA5A5' : '#F87171';
  ctx.fill();
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 6. Minimal graphic accent: subtle bed label/geometric dot
  ctx.beginPath();
  ctx.arc(0, 24, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  ctx.restore();
}
