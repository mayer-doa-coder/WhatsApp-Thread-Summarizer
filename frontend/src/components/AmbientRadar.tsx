import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Html, Line, OrbitControls } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { type BriefResult, type BriefChatCard } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RadarNode {
  id: number;
  card: BriefChatCard;
  angle: number;
  radius: number;
  yOffset: number;
  phase: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function worldPos(n: RadarNode): THREE.Vector3 {
  const a = (n.angle * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(a) * n.radius, n.yOffset, Math.sin(a) * n.radius);
}

const ORIGIN = new THREE.Vector3(0, 0, 0);

// ── AI Core ───────────────────────────────────────────────────────────────────

function AICore() {
  const innerRef = useRef<THREE.Mesh>(null);
  const wireRef  = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 0.85) * 0.07);
      (innerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.6 + Math.sin(t * 1.1) * 0.5;
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = t * 0.13;
      wireRef.current.rotation.y = t * 0.21;
      (wireRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.14 + Math.sin(t * 0.7) * 0.05;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z =  t * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.19;
  });

  return (
    <group>
      <pointLight color="#22d3ee" intensity={10} distance={14} decay={2} />
      <pointLight color="#818cf8" intensity={3}  distance={8}  decay={2} position={[0, 2, 0]} />

      {/* Solid glowing sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={2}
          roughness={0.05}
          metalness={0.9}
        />
      </mesh>

      {/* Wireframe shell */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[0.92, 14, 14]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
      </mesh>

      {/* Orbital rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.18, 0.018, 8, 80]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3.5, 0.4, 0]}>
        <torusGeometry args={[1.35, 0.011, 8, 80]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.28} />
      </mesh>

      {/* Label */}
      <Html center distanceFactor={8} position={[0, -1.6, 0]}>
        <p
          className="text-[9px] tracking-[0.35em] uppercase font-mono text-cyan-400/45 pointer-events-none whitespace-nowrap"
          style={{ textShadow: '0 0 12px rgba(34,211,238,0.6)' }}
        >
          AI Core
        </p>
      </Html>
    </group>
  );
}

// ── Radar Floor Grid ──────────────────────────────────────────────────────────

function RadarGrid() {
  const sweepRef = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const rings = [r1, r2, r3];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (sweepRef.current) sweepRef.current.rotation.y = t * 0.42;
    rings.forEach((ref, i) => {
      if (ref.current) {
        (ref.current.material as THREE.MeshBasicMaterial).opacity =
          0.07 + Math.sin(t * 0.45 + i * 1.6) * 0.032;
      }
    });
  });

  return (
    <group position={[0, -1.85, 0]}>
      {/* Range rings */}
      {([2.8, 4.5, 6.2] as const).map((r, i) => (
        <mesh key={i} ref={rings[i]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.026, r, 96]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.07}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Rotating sweep line */}
      <group ref={sweepRef}>
        <mesh position={[3.1, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.2, 0.038]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Fan glow behind sweep */}
        <mesh position={[2.0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.0, 2.2]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.013}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Neural Line ───────────────────────────────────────────────────────────────

function NeuralLine({
  from,
  active,
  phase,
}: {
  from: THREE.Vector3;
  active: boolean;
  phase: number;
}) {
  const ref = useRef<any>(null);

  useFrame(({ clock }) => {
    const mat = ref.current?.material;
    if (!mat) return;
    const t = clock.elapsedTime;
    mat.opacity = active
      ? 0.75 + Math.sin(t * 3.2 + phase) * 0.22
      : 0.13 + Math.sin(t * 0.75 + phase) * 0.05;
    if (active && mat.dashOffset !== undefined) {
      mat.dashOffset = -(t * 0.55);
    }
  });

  return (
    <Line
      ref={ref}
      points={[from, ORIGIN]}
      color={active ? '#22d3ee' : '#0e7490'}
      lineWidth={active ? 1.5 : 0.55}
      dashed={active}
      dashSize={0.2}
      gapSize={0.12}
      transparent
      opacity={0.18}
    />
  );
}

// ── Data Pane ─────────────────────────────────────────────────────────────────

function DataPane({
  node,
  active,
  onHover,
  onSelect,
}: {
  node: RadarNode;
  active: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useMemo(() => worldPos(node), [node]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      node.yOffset + Math.sin(clock.elapsedTime * 0.33 + node.phase) * 0.17;
  });

  const { card } = node;
  const isAction = card.actionRequired ?? false;

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      <Html
        center
        transform
        distanceFactor={5.5}
        zIndexRange={[10, 20]}
        style={{ width: '220px', userSelect: 'none' }}
      >
        <div
          className={[
            'relative rounded-2xl border px-4 py-3.5 cursor-pointer',
            'backdrop-blur-md transition-all duration-300',
            active
              ? 'border-cyan-400/65 bg-cyan-950/65 shadow-[0_0_32px_rgba(34,211,238,0.32)]'
              : isAction
              ? 'border-emerald-400/28 bg-slate-950/55 shadow-[0_0_16px_rgba(52,211,153,0.15)]'
              : 'border-white/[0.09] bg-slate-950/50',
          ].join(' ')}
          style={active ? { transform: 'scale(1.04)' } : undefined}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(node.id)}
        >
          {/* Top glint */}
          <span className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] tracking-[0.3em] uppercase font-mono text-cyan-400/50">
              Node {node.id}
            </span>
            {isAction && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="action-ping absolute inset-0 rounded-full bg-emerald-400" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 inline-flex" />
                </span>
                Action
              </span>
            )}
          </div>

          {/* Topic */}
          <p className="text-[11px] font-semibold text-slate-100 leading-snug mb-1.5 line-clamp-2">
            {card.topic}
          </p>

          {/* One-liner */}
          <p className="text-[10px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
            {card.oneLiner || card.summaryText}
          </p>

          {/* Participants */}
          <div className="flex flex-wrap gap-1 mb-3">
            {card.participants.slice(0, 3).map((p, i) => (
              <span
                key={i}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/18 text-cyan-300/60 font-mono"
              >
                {p.split(' ')[0]}
              </span>
            ))}
            {card.participants.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/18 text-cyan-300/60 font-mono">
                +{card.participants.length - 3}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="flex justify-end">
            <span className="text-[10px] font-semibold text-cyan-400/70">
              View thread <span className="text-cyan-300">›</span>
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── Inner R3F Scene ───────────────────────────────────────────────────────────

function Scene({
  nodes,
  activeId,
  onHover,
  onSelect,
}: {
  nodes: RadarNode[];
  activeId: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      <fog attach="fog" args={['#02040a', 10, 32]} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[4, 8, 4]} intensity={0.22} color="#b0e0ff" />

      <Stars radius={75} depth={38} count={4200} factor={2.8} saturation={0} fade speed={0.5} />
      <RadarGrid />
      <AICore />

      {nodes.map((n) => (
        <NeuralLine key={n.id} from={worldPos(n)} active={activeId === n.id} phase={n.phase} />
      ))}
      {nodes.map((n) => (
        <DataPane key={n.id} node={n} active={activeId === n.id} onHover={onHover} onSelect={onSelect} />
      ))}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI * 0.7}
        minDistance={5}
        maxDistance={17}
        autoRotate
        autoRotateSpeed={0.28}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

// ── Detail Panel (HTML overlay) ───────────────────────────────────────────────

function DetailPanel({
  node,
  onClose,
}: {
  node: RadarNode;
  onClose: () => void;
}) {
  const { card } = node;
  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 36 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute top-24 right-6 w-72 rounded-2xl border border-white/[0.09] bg-slate-950/82 backdrop-blur-xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.7)]"
      style={{ zIndex: 50 }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.05] text-slate-400 hover:text-slate-100 text-xs outline-none transition-colors"
      >
        ✕
      </button>

      {/* Node label */}
      <p className="text-[9px] tracking-[0.3em] uppercase font-mono text-cyan-400/55 mb-2">
        Node {node.id}
      </p>

      {/* Topic */}
      <h2 className="text-sm font-semibold text-slate-100 leading-snug mb-4 pr-6">
        {card.topic}
      </h2>

      {/* Stats */}
      <div className="flex gap-2.5 mb-4">
        {[
          { label: 'Messages', value: card.messageCount },
          { label: 'People', value: card.participants.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
          >
            <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-200 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Key decisions */}
      {card.keyDecisions.length > 0 && (
        <div className="mb-3.5">
          <p className="text-[8px] tracking-widest uppercase text-slate-500 mb-2">Decisions</p>
          <ul className="space-y-1.5">
            {card.keyDecisions.slice(0, 3).map((d, i) => (
              <li key={i} className="flex gap-1.5 text-[10px] text-slate-400">
                <span className="text-cyan-500/55 shrink-0 mt-px">›</span>
                <span className="line-clamp-2">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action items */}
      {card.actionItems.length > 0 && (
        <div className="mb-3.5">
          <p className="text-[8px] tracking-widest uppercase text-slate-500 mb-2">Action Items</p>
          <ul className="space-y-1.5">
            {card.actionItems.slice(0, 3).map((a, i) => (
              <li key={i} className="flex gap-1.5 text-[10px] text-emerald-400/80">
                <span className="shrink-0 mt-px">·</span>
                <span className="line-clamp-2">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary excerpt */}
      <p className="text-[10px] leading-relaxed text-slate-500 line-clamp-4 border-t border-white/[0.06] pt-3">
        {card.summaryText}
      </p>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AmbientRadarProps {
  brief: BriefResult;
  onExit: () => void;
}

export default function AmbientRadar({ brief, onExit }: AmbientRadarProps) {
  const [activeId,   setActiveId]   = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const nodes = useMemo<RadarNode[]>(() => {
    const count = brief.chatCards.length || 1;
    return brief.chatCards.map((card, i) => ({
      id:      card.index ?? i + 1,
      card,
      angle:   (360 / count) * i + 18,
      radius:  3.6 + (i % 2) * 1.15,
      yOffset: ([0.45, -0.38, 0.18, -0.55, 0.28] as const)[i % 5],
      phase:   i * 1.42,
    }));
  }, [brief.chatCards]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleHover  = useCallback((id: number | null) => setActiveId(id), []);
  const handleSelect = useCallback(
    (id: number) => setSelectedId((prev) => (prev === id ? null : id)),
    [],
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }),
    [],
  );

  return (
    <div className="fixed inset-0 z-40" style={{ background: '#02040a' }}>
      {/* ── 3D Canvas ── */}
      <Canvas
        camera={{ position: [0, 3.5, 10.5], fov: 58, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Scene
          nodes={nodes}
          activeId={activeId}
          onHover={handleHover}
          onSelect={handleSelect}
        />
      </Canvas>

      {/* ── HUD: top-left identity ── */}
      <div className="absolute top-7 left-8 pointer-events-none">
        <p className="text-[9px] tracking-[0.38em] uppercase font-mono text-cyan-400/40 mb-1.5">
          Ambient Radar
        </p>
        <h1
          className="text-2xl font-semibold text-slate-50 tracking-tight leading-none"
          style={{ textShadow: '0 0 40px rgba(34,211,238,0.2)' }}
        >
          Daily Brief
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">{today}</p>
      </div>

      {/* ── HUD: top-right stats ── */}
      <div className="absolute top-7 right-8 text-right pointer-events-none">
        <p className="text-[9px] font-mono tracking-widest text-cyan-400/40 uppercase mb-1">
          Active Nodes
        </p>
        <p
          className="text-3xl font-bold text-cyan-300 tabular-nums leading-none"
          style={{ textShadow: '0 0 24px rgba(34,211,238,0.5)' }}
        >
          {nodes.length}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {nodes.filter((n) => n.card.actionRequired).length} action required
        </p>
      </div>

      {/* ── HUD: top-center exit ── */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2">
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] backdrop-blur-md px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-100 hover:border-white/16 transition-colors outline-none"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          List View
        </button>
      </div>

      {/* ── HUD: bottom overview strip ── */}
      {brief.overviewParagraph && (
        <div className="absolute bottom-7 left-8 right-8 pointer-events-none">
          <div className="max-w-2xl mx-auto rounded-2xl border border-white/[0.07] bg-slate-950/72 backdrop-blur-md px-5 py-4">
            <p className="text-[9px] tracking-[0.32em] uppercase font-mono text-cyan-400/40 mb-1.5">
              Overview
            </p>
            <p className="text-sm leading-relaxed text-slate-400 line-clamp-2">
              {brief.overviewParagraph}
            </p>
          </div>
        </div>
      )}

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selectedNode && (
          <DetailPanel
            key={selectedNode.id}
            node={selectedNode}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
