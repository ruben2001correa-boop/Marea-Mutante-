import { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onVector: (vx: number, vy: number) => void;
}

export function VirtualJoystick({ onVector }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const maxRadius = 26;

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnob({ x: dx, y: dy, active: true });
    onVector(dx / maxRadius, dy / maxRadius);
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onVector(0, 0);
  };

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Joystick analógico de movimiento"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        resetStick();
      }}
      onPointerCancel={resetStick}
      className={`relative w-20 h-20 rounded-full bg-[#071828]/35 border-2 border-sky-400/35 shadow-md touch-none select-none flex items-center justify-center backdrop-blur-[2px] cursor-grab active:cursor-grabbing transition-opacity ${
        knob.active ? 'opacity-90' : 'opacity-45 hover:opacity-85'
      }`}
    >
      <div className="pointer-events-none absolute inset-2.5 rounded-full border border-sky-300/15" />
      <div
        className={`pointer-events-none w-8 h-8 rounded-full border-2 shadow-md transition-colors ${
          knob.active
            ? 'bg-amber-400/85 border-amber-200'
            : 'bg-sky-400/50 border-sky-200/65'
        }`}
        style={{
          transform: `translate(${knob.x}px, ${knob.y}px)`,
        }}
      />
    </div>
  );
}
