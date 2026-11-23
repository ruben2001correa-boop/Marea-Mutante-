import { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onVector: (vx: number, vy: number) => void;
  scale?: number;
  opacity?: number;
  label?: string;
  variant?: 'move' | 'aim';
}

export function VirtualJoystick({
  onVector,
  scale = 1,
  opacity = 0.72,
  label,
  variant = 'move',
}: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const maxRadius = Math.round(28 * scale);

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const safeRadius = Math.max(1, maxRadius);
    if (dist > safeRadius) {
      dx = (dx / dist) * safeRadius;
      dy = (dy / dist) * safeRadius;
    }
    setKnob({ x: dx, y: dy, active: true });

    const norm = Math.min(1, dist / safeRadius);
    if (norm < 0.1) {
      onVector(0, 0);
      return;
    }
    // Ramp from 0.65 at deadzone edge to full 1.0 speed by 45% thumb throw so movement never feels sluggish
    const speedMag = Math.min(1, 0.65 + ((norm - 0.1) / 0.35) * 0.35);
    const ux = dx / Math.max(0.0001, Math.min(dist, safeRadius));
    const uy = dy / Math.max(0.0001, Math.min(dist, safeRadius));
    onVector(ux * speedMag, uy * speedMag);
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onVector(0, 0);
  };

  const baseSize = Math.round(86 * scale);
  const knobSize = Math.round(34 * scale);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label={label || (variant === 'aim' ? 'Joystick de apuntado' : 'Joystick analógico de movimiento')}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pointerIdRef.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore environments where pointer capture is unavailable
        }
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      onPointerCancel={resetStick}
      onLostPointerCapture={resetStick}
      style={{
        width: `${baseSize}px`,
        height: `${baseSize}px`,
        opacity: knob.active ? Math.min(1, opacity + 0.25) : opacity,
      }}
      className={`relative rounded-full bg-[#071828]/45 border-2 shadow-md touch-none select-none flex items-center justify-center backdrop-blur-[2px] cursor-grab active:cursor-grabbing transition-opacity ${
        variant === 'aim' ? 'border-rose-400/50' : 'border-sky-400/45'
      }`}
    >
      <div className="pointer-events-none absolute inset-2.5 rounded-full border border-sky-300/15" />
      {label && (
        <span className="pointer-events-none absolute -top-4 text-[10px] font-bold text-slate-300 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div
        className={`pointer-events-none rounded-full border-2 shadow-md transition-colors ${
          variant === 'aim'
            ? knob.active
              ? 'bg-rose-400/90 border-rose-200'
              : 'bg-rose-400/55 border-rose-200/70'
            : knob.active
              ? 'bg-amber-400/90 border-amber-200'
              : 'bg-sky-400/55 border-sky-200/70'
        }`}
        style={{
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
}
