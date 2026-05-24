import { useCallback, useEffect } from 'react';
import { Particles, ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine';

// ── AppState type (mirrors UploadPage's derived state) ───────────────────────
export type AppState = 'idle' | 'processing' | 'success';

// ── Speed targets per state ──────────────────────────────────────────────────
const SPEEDS: Record<AppState, number> = {
  idle:       0.35,   // slow ambient drift
  processing: 2.5,    // noticeably faster — "AI thinking" energy
  success:    0.35,   // settles back to idle
};

// ── Particle config ──────────────────────────────────────────────────────────
const OPTIONS: ISourceOptions = {
  fpsLimit:               120,
  pauseOnBlur:            true,
  pauseOnOutsideViewport: false,
  smooth:                 true,
  detectRetina:           true,
  background: { color: { value: 'transparent' } },
  particles: {
    number: {
      value:   55,
      density: { enable: false },
    },
    color: {
      value: ['#38bdf8', '#0891b2', '#06b6d4', '#0e7490'],
    },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.04, max: 0.18 },
      animation: {
        enable: true,
        speed:  0.35,
        sync:   false,
      },
    },
    size: {
      value:     { min: 1, max: 2.2 },
      animation: { enable: false },
    },
    links: {
      enable:   true,
      distance: 140,
      color:    '#0891b2',
      opacity:  0.07,
      width:    0.7,
      triangles: { enable: false },
    },
    move: {
      enable:    true,
      speed:     SPEEDS.idle,
      direction: 'none',
      random:    true,
      straight:  false,
      outModes:  { default: 'out' },
      trail:     { enable: false },
    },
    collisions: { enable: false },
  },
  interactivity: {
    events: {
      onHover: { enable: false },
      onClick: { enable: false },
      resize:  { enable: true, delay: 0.5 },
    },
  },
};

// ── Module-level singleton ───────────────────────────────────────────────────
let _container:    Container | null = null;
let _currentSpeed: number           = SPEEDS.idle;
let _rafId:        number | null    = null;

type LiveParticle = { velocity: { x: number; y: number } };

function lerpSpeeds(target: number): void {
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }

  function tick(): void {
    const diff = target - _currentSpeed;

    if (Math.abs(diff) < 0.004) {
      _currentSpeed = target;
      return;
    }

    const next  = _currentSpeed + diff * 0.055;
    const ratio = next / _currentSpeed;
    _currentSpeed = next;

    const arr = (_container as unknown as { particles: { array: LiveParticle[] } })
      ?.particles?.array;

    if (arr) {
      for (const p of arr) {
        p.velocity.x *= ratio;
        p.velocity.y *= ratio;
      }
    }

    _rafId = requestAnimationFrame(tick);
  }

  _rafId = requestAnimationFrame(tick);
}

// ── Exported imperative update function ──────────────────────────────────────
export function updateParticleState(appState: AppState): void {
  lerpSpeeds(SPEEDS[appState]);
}

// ── Stable module-level init (ParticlesProvider requires stable reference) ───
const initEngine: (engine: Engine) => Promise<void> = async (engine) => {
  await loadSlim(engine);
};

// ── Component ────────────────────────────────────────────────────────────────

interface ParticleBackgroundProps {
  appState?: AppState;
}

export default function ParticleBackground({ appState = 'idle' }: ParticleBackgroundProps) {
  useEffect(() => {
    updateParticleState(appState);
  }, [appState]);

  useEffect(() => {
    return () => {
      if (_rafId !== null) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      _container = null;
    };
  }, []);

  const onLoaded = useCallback((container?: Container) => {
    _container    = container ?? null;
    _currentSpeed = SPEEDS.idle;
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      <ParticlesProvider init={initEngine}>
        <Particles
          id="ambient-particles"
          style={{ width: '100%', height: '100%' }}
          options={OPTIONS}
          particlesLoaded={onLoaded}
        />
      </ParticlesProvider>
    </div>
  );
}
