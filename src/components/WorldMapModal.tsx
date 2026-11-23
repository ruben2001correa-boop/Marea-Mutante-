import { Compass, Crosshair, LocateFixed, MapPin, Minus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {
  EnemyEntity,
  IslandEntity,
  PersistentState,
  PlayerEntity,
  RaftEntity,
  WorldNpcEntity,
} from '../game/types';
import { getMarineWantedLevel } from '../game/socialAndKingdoms';
import { getIslandFactionControl, getPirateRankInfo } from '../game/worldGen';

interface WorldMapModalProps {
  open: boolean;
  state: PersistentState;
  player: PlayerEntity;
  raft: RaftEntity;
  islands: IslandEntity[];
  enemies: EnemyEntity[];
  worldNpcs: WorldNpcEntity[];
  onSetWaypoint: (waypoint: { x: number; y: number; label: string } | null) => void;
  onClose: () => void;
}

export function WorldMapModal({
  open,
  state,
  player,
  raft,
  islands,
  enemies,
  worldNpcs,
  onSetWaypoint,
  onClose,
}: WorldMapModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [center, setCenter] = useState<{ x: number; y: number }>({ x: player.x, y: player.y });
  const [zoom, setZoom] = useState<number>(0.16);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCenterX: number;
    startCenterY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setCenter({ x: player.x, y: player.y });
    }
  }, [open, player.x, player.y]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(280, Math.floor(rect.width));
    const h = Math.max(220, Math.floor(rect.height));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Ocean backdrop
    ctx.fillStyle = '#041423';
    ctx.fillRect(0, 0, w, h);

    const worldToScreen = (wx: number, wy: number) => ({
      sx: w / 2 + (wx - center.x) * zoom,
      sy: h / 2 + (wy - center.y) * zoom,
    });

    // Tactical grid every 500 world units
    const gridStep = 500;
    const minWx = center.x - w / (2 * zoom);
    const maxWx = center.x + w / (2 * zoom);
    const minWy = center.y - h / (2 * zoom);
    const maxWy = center.y + h / (2 * zoom);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    const startGx = Math.floor(minWx / gridStep) * gridStep;
    const startGy = Math.floor(minWy / gridStep) * gridStep;
    for (let gx = startGx; gx <= maxWx; gx += gridStep) {
      const { sx } = worldToScreen(gx, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = startGy; gy <= maxWy; gy += gridStep) {
      const { sy } = worldToScreen(0, gy);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Islands
    for (const isl of islands) {
      const { sx, sy } = worldToScreen(isl.x, isl.y);
      const rad = Math.max(7, isl.radius * zoom);
      if (sx + rad < -40 || sx - rad > w + 40 || sy + rad < -40 || sy - rad > h + 40) continue;

      const control = getIslandFactionControl(isl);
      ctx.fillStyle =
        state.hqIslandId === isl.id
          ? 'rgba(52, 211, 153, 0.58)'
          : control === 'neutral_safe'
            ? 'rgba(16, 185, 129, 0.65)'
            : control === 'marina_gov'
              ? 'rgba(37, 99, 235, 0.48)'
              : control === 'pirate'
                ? 'rgba(225, 29, 72, 0.48)'
                : isl.dangerous
                  ? 'rgba(249, 115, 22, 0.4)'
                  : 'rgba(132, 204, 22, 0.34)';
      ctx.strokeStyle =
        control === 'neutral_safe'
          ? '#ffffff'
          : isl.pirateRank
            ? getPirateRankInfo(isl.pirateRank).color
            : control === 'marina_gov'
              ? '#60a5fa'
              : state.hqIslandId === isl.id
                ? '#6ee7b7'
                : '#38bdf8';
      ctx.lineWidth = control === 'neutral_safe' ? 2.4 : 1.6;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (control === 'neutral_safe') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx - 3.5, sy);
        ctx.lineTo(sx + 3.5, sy);
        ctx.moveTo(sx, sy - 3.5);
        ctx.lineTo(sx, sy + 3.5);
        ctx.stroke();
      }

      // Marine Checkpoint indicator on island
      const hasMarineCheckpoint = isl.nodes.some(
        (n) => n.kind === 'marine_checkpoint' && !n.depleted
      );
      if (hasMarineCheckpoint) {
        ctx.fillStyle = '#2563eb';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.2;
        ctx.fillRect(sx - rad * 0.65 - 3, sy - rad * 0.5 - 3, 6, 6);
        ctx.strokeRect(sx - rad * 0.65 - 3, sy - rad * 0.5 - 3, 6, 6);
      }

      // Mystery or Easter egg indicator on island (only if NOT already found globally!)
      const hasUndiscoveredMystery = isl.nodes.some(
        (n) =>
          (n.kind === 'mystery_monolith' || n.kind === 'easter_egg') &&
          !n.depleted &&
          !(n.mysteryId && state.discoveredMysteries?.includes(n.mysteryId))
      );
      if (hasUndiscoveredMystery) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(sx + rad * 0.45, sy - rad * 0.45, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (zoom >= 0.08) {
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(
          `${isl.cultureEmblem ? `${isl.cultureEmblem} ` : ''}${isl.name}${state.hqIslandId === isl.id ? ' (HQ)' : ''}`,
          sx,
          sy + rad + 12
        );
      }
    }

    // World NPCs
    for (const npc of worldNpcs) {
      const { sx, sy } = worldToScreen(npc.x, npc.y);
      ctx.fillStyle = npc.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Active Boss Territory Circles & Enemies
    for (const e of enemies) {
      if (typeof e.homeX === 'number' && typeof e.homeY === 'number' && typeof e.territoryRadius === 'number') {
        const homePt = worldToScreen(e.homeX, e.homeY);
        ctx.save();
        ctx.strokeStyle = e.isBoss ? 'rgba(244, 63, 94, 0.55)' : 'rgba(251, 146, 60, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(homePt.sx, homePt.sy, Math.max(8, e.territoryRadius * zoom), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      const { sx, sy } = worldToScreen(e.x, e.y);
      if (e.kind === 'gov_agent') {
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 4.5);
        ctx.lineTo(sx + 4.5, sy);
        ctx.lineTo(sx, sy + 4.5);
        ctx.lineTo(sx - 4.5, sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.fillStyle =
        e.kind === 'marine_patrol' || e.kind === 'marine_captain'
          ? '#60a5fa'
          : e.bountyId
            ? '#facc15'
            : e.isLeviathan
              ? '#22d3ee'
              : e.isBoss || e.isSemiBoss
                ? '#f43f5e'
                : '#fb923c';
      ctx.beginPath();
      ctx.arc(sx, sy, e.isLeviathan || e.isBoss || e.bountyId || e.kind === 'marine_captain' ? 5 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Story Mission Marker (Cyan)
    const activeStory = state.storyMissions.find(
      (m) => m.status === 'active' && typeof m.markerX === 'number' && typeof m.markerY === 'number'
    );
    if (activeStory && typeof activeStory.markerX === 'number' && typeof activeStory.markerY === 'number') {
      const { sx, sy } = worldToScreen(activeStory.markerX, activeStory.markerY);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Checkpoint (Emerald)
    if (state.checkpoint) {
      const { sx, sy } = worldToScreen(state.checkpoint.x, state.checkpoint.y);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
    }

    // Player Raft (Amber square)
    {
      const { sx, sy } = worldToScreen(raft.x, raft.y);
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.fillRect(sx - 5, sy - 5, 10, 10);
      ctx.strokeRect(sx - 5, sy - 5, 10, 10);
    }

    // Player (White circle)
    {
      const { sx, sy } = worldToScreen(player.x, player.y);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Custom Waypoint Marker (Magenta star/pin + dashed line from player)
    if (state.customWaypoint) {
      const pPos = worldToScreen(player.x, player.y);
      const wpPos = worldToScreen(state.customWaypoint.x, state.customWaypoint.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(pPos.sx, pPos.sy);
      ctx.lineTo(wpPos.sx, wpPos.sy);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#e879f9';
      ctx.strokeStyle = '#fdf4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wpPos.sx, wpPos.sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f5d0fe';
      ctx.fillText(
        `📍 ${state.customWaypoint.label}`,
        wpPos.sx,
        wpPos.sy - 12
      );
    }

    ctx.restore();
  }, [open, center, zoom, islands, enemies, worldNpcs, player.x, player.y, raft.x, raft.y, state.hqIslandId, state.checkpoint, state.storyMissions, state.customWaypoint, state.discoveredMysteries]);

  if (!open) return null;

  const marineWanted = getMarineWantedLevel(state);
  const wpDist = state.customWaypoint
    ? Math.round(Math.hypot(state.customWaypoint.x - player.x, state.customWaypoint.y - player.y))
    : 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCenterX: center.x,
      startCenterY: center.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d || !d.active) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    setCenter({
      x: d.startCenterX - dx / zoom,
      y: d.startCenterY - dy / zoom,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.moved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = center.x + (sx - rect.width / 2) / zoom;
    const wy = center.y + (sy - rect.height / 2) / zoom;

    const hitIsl = islands.find((isl) => Math.hypot(isl.x - wx, isl.y - wy) <= Math.max(isl.radius, 80));
    const label = hitIsl ? `Rumbo: ${hitIsl.name}` : `Ruta (${Math.round(wx)}, ${Math.round(wy)})`;
    onSetWaypoint({ x: Math.round(wx), y: Math.round(wy), label });
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-5xl h-[90dvh] rounded-2xl bg-[#071625] border border-[#2b5276] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0b1f33] border-b border-[#204464]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/55 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-fuchsia-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-extrabold text-slate-100 truncate">
                Carta Náutica Táctica — Arrastra para explorar · Toca para marcar ruta
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                {state.customWaypoint
                  ? `📍 ${state.customWaypoint.label} (${wpDist}m) · `
                  : ''}
                Marina: {marineWanted.label}{state.worldGovDecree ? ` · 🏛️ ${state.worldGovDecree}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {state.customWaypoint && (
              <button
                type="button"
                onClick={() => onSetWaypoint(null)}
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/50 text-[11px] font-bold text-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar Marca</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
              aria-label="Cerrar mapa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="relative flex-1 min-h-0 bg-[#041423]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full block touch-none cursor-crosshair"
          />

          {/* Zoom & Center Controls */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(0.65, z * 1.35))}
              className="w-10 h-10 rounded-xl bg-[#0a2135]/95 hover:bg-[#133654] border border-[#2c5a84] text-slate-100 flex items-center justify-center shadow-lg cursor-pointer"
              title="Acercar"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.05, z * 0.74))}
              className="w-10 h-10 rounded-xl bg-[#0a2135]/95 hover:bg-[#133654] border border-[#2c5a84] text-slate-100 flex items-center justify-center shadow-lg cursor-pointer"
              title="Alejar"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCenter({ x: player.x, y: player.y })}
              className="w-10 h-10 rounded-xl bg-sky-600/90 hover:bg-sky-500 border border-sky-300/60 text-white flex items-center justify-center shadow-lg cursor-pointer"
              title="Centrar en mi posición"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>

          {/* Color Legend */}
          <div className="hidden sm:flex absolute left-3 bottom-3 px-2.5 py-1.5 rounded-lg bg-[#071828]/90 border border-[#1d4261] text-[10px] text-slate-200 items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-white inline-block" /> Tú</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Zona Segura</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Isla Marina/Gob</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Isla Pirata</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rotate-45 bg-slate-100 border border-amber-400 inline-block" /> Gob. Mundial</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-rose-400 inline-block" /> Territorio Jefe</span>
          </div>
        </div>

        {/* Quick Focus & Waypoint Presets Bar */}
        <div className="px-3 py-2 bg-[#0a1e30] border-t border-[#1c3d59] flex items-center gap-1.5 overflow-x-auto deck-scroll text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 mr-1 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-fuchsia-300" /> Ir / Marcar:
          </span>
          {islands.slice(0, 12).map((isl) => (
            <button
              key={isl.id}
              type="button"
              onClick={() => {
                setCenter({ x: isl.x, y: isl.y });
                onSetWaypoint({ x: Math.round(isl.x), y: Math.round(isl.y), label: isl.name });
              }}
              className="px-2.5 py-1 rounded-lg bg-[#102940] hover:bg-[#183d5e] border border-[#244e75] text-slate-200 font-semibold whitespace-nowrap cursor-pointer inline-flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-fuchsia-300 shrink-0" />
              <span>{isl.cultureEmblem ? `${isl.cultureEmblem} ` : ''}{isl.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
