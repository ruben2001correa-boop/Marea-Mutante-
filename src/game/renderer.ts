import { getIslandCorralLimit, getRaftCorralLimit, getRaftHalfSize, getRelicTotals } from './constants';
import { SURVIVORS_CATALOG } from './destinyTree';
import { CROPS_CATALOG, TITLE_MAP } from './socialAndKingdoms';
import { WEAPON_MAP } from './weapons';
import { getPirateRankInfo } from './worldGen';
import type {
  ActiveNpcChatRenderInfo,
  AnimalEntity,
  CaptiveAnimal,
  ComicBubble,
  EnemyEntity,
  ExplosionFx,
  FarmPlot,
  FloatingDrop,
  FloatingPopup,
  IntroCutsceneState,
  IslandEntity,
  IslandStructure,
  NpcAnimState,
  NpcAttitudeMood,
  NpcLiveVisualState,
  PersistentState,
  PlayerEntity,
  ProjectileEntity,
  RaftEntity,
  RandomEventState,
  SlashFx,
  SplashFx,
  WeatherType,
} from './types';

export type { NpcAnimState };

export interface TopDownRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  camX: number;
  camY: number;
  time: number;
  shake: number;
  weather: WeatherType;
  lightningAlpha: number;
  dangerousWater: boolean;
  randomEvent: RandomEventState;
  uiPaused: boolean;
  state: PersistentState;
  raft: RaftEntity;
  player: PlayerEntity;
  islands: IslandEntity[];
  animals: AnimalEntity[];
  enemies: EnemyEntity[];
  projectiles: ProjectileEntity[];
  drops: FloatingDrop[];
  explosions: ExplosionFx[];
  splashes: SplashFx[];
  slashes: SlashFx[];
  pops: FloatingPopup[];
  comics: ComicBubble[];
  introCutscene?: IntroCutsceneState;
  activeNpcChat?: ActiveNpcChatRenderInfo | null;
  npcLiveStates?: Record<string, NpcLiveVisualState>;
}

export function renderTopDownWorld(rc: TopDownRenderContext): void {
  const { ctx, width, height, camX, camY, time, shake, weather } = rc;

  ctx.save();
  if (shake > 0.05) {
    ctx.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
  }

  // 1. Ocean background (shifts tint in ☣️ Dangerous Waters!)
  const dayPhase = (rc.state.elapsedSeconds % 90) / 90;
  const nightFactor = Math.max(0, Math.sin(dayPhase * Math.PI * 2 - Math.PI * 0.5) * 0.3);

  const oceanGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    80,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.78
  );
  if (rc.player.swimming) {
    oceanGrad.addColorStop(0, '#0a4866');
    oceanGrad.addColorStop(1, '#041a29');
  } else if (rc.dangerousWater) {
    oceanGrad.addColorStop(0, '#0f3642');
    oceanGrad.addColorStop(1, '#05151e');
  } else if (weather === 'tormenta') {
    oceanGrad.addColorStop(0, '#09314a');
    oceanGrad.addColorStop(1, '#041421');
  } else {
    oceanGrad.addColorStop(0, nightFactor > 0.15 ? '#0b3c58' : '#0f5478');
    oceanGrad.addColorStop(1, '#061d2e');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5 - camX, height * 0.5 - camY);

  // 2. Ocean Currents & Fish Frenzy schools
  drawOceanCurrents(ctx, camX, camY, width, height, time, weather, rc.dangerousWater);
  if (rc.randomEvent.active && rc.randomEvent.kind === 'fish_frenzy') {
    drawFishFrenzySchools(ctx, rc.player.x, rc.player.y, time);
  }

  // 3. Large Proportional Procedural Islands & Built Structures
  for (const isl of rc.islands) {
    if (
      Math.abs(isl.x - camX) > width * 0.65 + isl.radius + 110 ||
      Math.abs(isl.y - camY) > height * 0.65 + isl.radius + 110
    ) {
      continue;
    }
    drawIsland(ctx, isl, rc.state, time, rc.player, rc.activeNpcChat);
  }

  const isDonorSkin = Boolean(rc.state.donorUnlocked && rc.state.donorSkinEnabled);

  for (const st of rc.state.islandStructures) {
    if (Math.abs(st.x - camX) > width * 0.7 || Math.abs(st.y - camY) > height * 0.7) continue;
    drawIslandStructure(ctx, st, rc.enemies, time, isDonorSkin);
  }

  // Active Story Mission Distress Buoy / Beacon (revealed after player meets Vega on deck)
  const hideMissionMarkersForIntro =
    Boolean(rc.introCutscene?.active) && rc.introCutscene?.phase !== 'meet_vega';
  const activeMission = !hideMissionMarkersForIntro
    ? rc.state.storyMissions.find(
        (m) => m.status === 'active' && typeof m.markerX === 'number' && typeof m.markerY === 'number'
      )
    : undefined;
  if (activeMission && typeof activeMission.markerX === 'number' && typeof activeMission.markerY === 'number') {
    const mx = activeMission.markerX;
    const my = activeMission.markerY;
    const pulse = 26 + Math.sin(time * 4.5) * 6;
    ctx.save();
    ctx.translate(mx, my);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = Math.sin(time * 6) > 0 ? '#22d3ee' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('SEÑAL DE MISIÓN', 0, -16);
    ctx.restore();
  }

  // Saved Checkpoint Beacon on Island/World
  if (rc.state.checkpoint && rc.state.checkpoint.islandId) {
    const cp = rc.state.checkpoint;
    if (Math.abs(cp.x - camX) <= width * 0.65 && Math.abs(cp.y - camY) <= height * 0.65) {
      drawCheckpointBeacon(ctx, cp.x, cp.y, time);
    }
  }

  // Island Farm Plots & Island Captive Pens
  for (const plot of rc.state.farmPlots) {
    if (plot.location !== 'island') continue;
    if (Math.abs(plot.x - camX) > width * 0.65 || Math.abs(plot.y - camY) > height * 0.65) continue;
    drawFarmPlot(ctx, plot, plot.x, plot.y, time);
  }

  // 4. Farm & Wild Island Animals
  for (const an of rc.animals) {
    if (Math.abs(an.x - camX) > width * 0.65 || Math.abs(an.y - camY) > height * 0.65) continue;
    drawAnimal(ctx, an, time);
  }

  // 5. Water Splash Ripples
  for (const sp of rc.splashes) {
    const t = 1 - sp.life / sp.maxLife;
    ctx.save();
    ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 1 - t)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 8 + t * sp.maxRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 6. Shaped Resource Drops
  for (const drop of rc.drops) {
    drawDrop(ctx, drop, time);
  }

  // 7. Parked Pirate Boats (from Boarding Pirates)
  for (const enemy of rc.enemies) {
    if (enemy.parkedBoat) {
      drawParkedPirateBoat(ctx, enemy.parkedBoat.x, enemy.parkedBoat.y, enemy.parkedBoat.angle, enemy.isBoss, time);
    }
  }

  // 8. Evolving Raft / Warship, Raft Farm Plots, Captive Animals & Animated Fighting Crew
  if (
    rc.introCutscene?.active &&
    (rc.introCutscene.phase === 'spot_raft' || rc.introCutscene.phase === 'swim_to_raft')
  ) {
    const glowR = 54 + Math.sin(time * 5) * 6;
    ctx.save();
    ctx.translate(rc.raft.x, rc.raft.y);
    const salvGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, glowR);
    salvGrad.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
    salvGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = salvGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, glowR * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '800 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('¡BALSA · TU SALVACIÓN!', 0, -glowR * 0.78);
    ctx.restore();
  }
  drawTopDownRaft(ctx, rc.raft, rc.state, rc.enemies, time);
  drawRaftFarmAndPens(ctx, rc.raft, rc.state, rc.islands, time);
  drawCrewOnRaft(ctx, rc.raft, rc.state, time, rc.player, rc.activeNpcChat, rc.npcLiveStates);

  // 9. Skinned & Shaped Enemies + 3s Steal Timer Ring
  for (const enemy of rc.enemies) {
    drawEnemy(ctx, enemy, time);
  }

  // 10. Articulated Player
  drawTopDownPlayer(ctx, rc.player, rc.state, time);

  // 11. Projectiles & FX
  for (const proj of rc.projectiles) {
    drawProjectile(ctx, proj, time);
  }

  for (const slash of rc.slashes) {
    const t = slash.life / slash.maxLife;
    ctx.save();
    ctx.translate(slash.x, slash.y);
    ctx.rotate(slash.angle);
    ctx.strokeStyle = slash.color;
    ctx.globalAlpha = Math.min(1, t * 1.4);
    ctx.lineWidth = 4 + t * 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, slash.reach * 0.68, -0.85, 0.85);
    ctx.stroke();
    ctx.restore();
  }

  for (const exp of rc.explosions) {
    const t = 1 - exp.life / exp.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = exp.color;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * (0.35 + t * 0.65), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (const p of rc.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.2));
    ctx.fillStyle = 'rgba(4, 15, 25, 0.85)';
    ctx.fillText(p.text, p.x + 1, p.y + 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  for (const c of rc.comics) {
    drawComicBubble(ctx, c);
  }

  ctx.restore(); // end world transform

  // 12. Weather Particles & Atmospheric Overlay (Screen Space)
  drawWeatherOverlay(ctx, width, height, weather, rc.lightningAlpha, time);

  // Diving / Night Vignette
  if (rc.player.swimming || nightFactor > 0.08) {
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.28,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.74
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(
      1,
      rc.player.swimming
        ? 'rgba(3, 24, 38, 0.45)'
        : `rgba(2, 10, 22, ${nightFactor * 0.52})`
    );
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  // Off-screen Story Mission Directional Compass Arrow
  if (
    activeMission &&
    typeof activeMission.markerX === 'number' &&
    typeof activeMission.markerY === 'number'
  ) {
    const dxM = activeMission.markerX - rc.player.x;
    const dyM = activeMission.markerY - rc.player.y;
    const distM = Math.hypot(dxM, dyM);
    if (distM > Math.min(width, height) * 0.34) {
      const angM = Math.atan2(dyM, dxM);
      const rad = Math.min(width, height) * 0.33;
      const px = width / 2 + Math.cos(angM) * rad;
      const py = height / 2 + Math.sin(angM) * rad;
      ctx.save();
      ctx.translate(px, py);
      ctx.save();
      ctx.rotate(angM);
      ctx.fillStyle = '#22d3ee';
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText(`Misión (${Math.round(distM / 10)}m)`, 0, -14);
      ctx.restore();
    }
  }

  // 13. Minimap Radar (hidden during intro cutscene for clean cinematic framing)
  if (!rc.introCutscene?.active) {
    drawMinimap(ctx, width, rc);
  } else {
    const barH = Math.max(22, Math.min(44, Math.round(height * 0.065)));
    ctx.fillStyle = 'rgba(2, 8, 16, 0.78)';
    ctx.fillRect(0, 0, width, barH);
    ctx.fillRect(0, height - barH, width, barH);
  }

  // 14. Subtle UI Pause Tint
  if (rc.uiPaused) {
    ctx.fillStyle = 'rgba(4, 15, 25, 0.28)';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: WeatherType,
  lightningAlpha: number,
  time: number
): void {
  if (weather === 'lluvia' || weather === 'tormenta') {
    const count = weather === 'tormenta' ? 105 : 60;
    ctx.save();
    ctx.strokeStyle =
      weather === 'tormenta' ? 'rgba(186, 230, 253, 0.38)' : 'rgba(147, 197, 253, 0.26)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const rx = ((i * 193 + time * 420) % (width + 120)) - 60;
      const ry = ((i * 97 + time * 680) % (height + 120)) - 60;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 12, ry + 20);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.16)';
    for (let i = 0; i < 8; i++) {
      const phase = (time * 2 + i * 0.37) % 1;
      const px = (((i * 313 + 71) % 1000) / 1000) * width;
      const py = (((i * 541 + 29) % 1000) / 1000) * height;
      ctx.beginPath();
      ctx.arc(px, py, 2 + phase * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (weather === 'brisa' || weather === 'oleaje') {
    ctx.save();
    ctx.strokeStyle =
      weather === 'oleaje' ? 'rgba(125, 211, 252, 0.22)' : 'rgba(224, 242, 254, 0.15)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 14; i++) {
      const wx = ((i * 211 + time * (weather === 'oleaje' ? 210 : 140)) % (width + 180)) - 90;
      const wy = ((i * 137 + 45) % height);
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 24, wy - 6, wx + 48, wy);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (weather === 'niebla') {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const fx = ((i * 280 + time * 18) % (width + 320)) - 160;
      const fy = (i * 140 + 60) % height;
      const grad = ctx.createRadialGradient(fx, fy, 20, fx, fy, 170);
      grad.addColorStop(0, 'rgba(203, 213, 225, 0.18)');
      grad.addColorStop(1, 'rgba(203, 213, 225, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 170, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (weather === 'despejado') {
    ctx.save();
    const sunGrad = ctx.createRadialGradient(width * 0.15, 0, 10, width * 0.15, 0, 260);
    sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.09)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (lightningAlpha > 0.02) {
    ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(0.45, lightningAlpha)})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawFishFrenzySchools(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  time: number
): void {
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + time * 0.4;
    const dist = 110 + (i % 3) * 45;
    const fx = px + Math.cos(ang) * dist;
    const fy = py + Math.sin(ang) * dist;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang + Math.PI * 0.5);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawOceanCurrents(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  width: number,
  height: number,
  time: number,
  weather: WeatherType,
  dangerousWater: boolean
): void {
  const cell = 150;
  const startX = Math.floor((camX - width * 0.6) / cell) * cell;
  const endX = camX + width * 0.6 + cell;
  const startY = Math.floor((camY - height * 0.6) / cell) * cell;
  const endY = camY + height * 0.6 + cell;

  ctx.save();
  ctx.strokeStyle = dangerousWater
    ? 'rgba(52, 211, 153, 0.13)'
    : weather === 'oleaje' || weather === 'tormenta'
      ? 'rgba(224, 242, 254, 0.16)'
      : 'rgba(186, 230, 253, 0.09)';
  ctx.lineWidth = weather === 'oleaje' ? 2.2 : 1.6;
  ctx.lineCap = 'round';
  for (let x = startX; x <= endX; x += cell) {
    for (let y = startY; y <= endY; y += cell) {
      const shift = Math.sin(time * (weather === 'oleaje' ? 2.5 : 1.4) + x * 0.01 + y * 0.01) * 16;
      ctx.beginPath();
      ctx.moveTo(x + shift, y);
      ctx.quadraticCurveTo(x + 24 + shift, y - 6, x + 48 + shift, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawIsland(
  ctx: CanvasRenderingContext2D,
  isl: IslandEntity,
  state: PersistentState,
  time: number,
  player?: PlayerEntity,
  activeNpcChat?: ActiveNpcChatRenderInfo | null
): void {
  const palette = {
    tropical: { shore: '#f3d999', wetSand: '#d9b978', inner: '#256c3e', innerHi: '#349456', ring: 'rgba(125, 211, 252, 0.25)' },
    desierto: { shore: '#fde68a', wetSand: '#e2bd64', inner: '#d99b26', innerHi: '#f5be41', ring: 'rgba(250, 204, 21, 0.24)' },
    volcanica: { shore: '#78716c', wetSand: '#57534e', inner: '#292524', innerHi: '#44403c', ring: 'rgba(249, 115, 22, 0.24)' },
    minera: { shore: '#a8a29e', wetSand: '#78716c', inner: '#44403c', innerHi: '#57534e', ring: 'rgba(148, 163, 184, 0.24)' },
    chatarra: { shore: '#c2b280', wetSand: '#96875b', inner: '#3f4d5e', innerHi: '#526378', ring: 'rgba(56, 189, 248, 0.24)' },
    pirata: { shore: '#e7c687', wetSand: '#b8945a', inner: '#5c2626', innerHi: '#783232', ring: 'rgba(225, 29, 72, 0.26)' },
    pradera: { shore: '#f3d999', wetSand: '#d4b472', inner: '#2e8b4e', innerHi: '#4ade80', ring: 'rgba(74, 222, 128, 0.24)' },
    abisal: { shore: '#818cf8', wetSand: '#4f46e5', inner: '#1e1b4b', innerHi: '#312e81', ring: 'rgba(192, 132, 252, 0.30)' },
  }[isl.biome];

  const isHQ = state.hqIslandId === isl.id;

  ctx.save();
  ctx.translate(isl.x, isl.y);

  // Outer shallow surf & animated foam ring
  ctx.fillStyle = isHQ ? 'rgba(52, 211, 153, 0.28)' : palette.ring;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const r = pt.r + 28 + Math.sin(time * 2.1 + idx) * 4;
    const px = Math.cos(pt.angle) * r;
    const py = Math.sin(pt.angle) * r;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(224, 242, 254, 0.38)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const r = pt.r + 11 + Math.sin(time * 2.4 + idx * 0.7) * 2.5;
    const px = Math.cos(pt.angle) * r;
    const py = Math.sin(pt.angle) * r;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.stroke();

  // Wet shoreline rim
  ctx.fillStyle = palette.wetSand;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const px = Math.cos(pt.angle) * (pt.r + 4);
    const py = Math.sin(pt.angle) * (pt.r + 4);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  // Dry beach / rocky coast
  ctx.fillStyle = palette.shore;
  ctx.strokeStyle = isHQ ? '#34d399' : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = isHQ ? 3.5 : 2;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const px = Math.cos(pt.angle) * pt.r;
    const py = Math.sin(pt.angle) * pt.r;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle beach pebbles & shells
  for (let s = 0; s < 14; s++) {
    const sa = s * 0.45 + isl.x * 0.01;
    const sr = isl.radius * (0.78 + (s % 3) * 0.05);
    ctx.fillStyle = s % 2 === 0 ? 'rgba(120, 113, 108, 0.38)' : 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 2.2 + (s % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Elevated inland biome terrain + contour highlight
  ctx.fillStyle = palette.inner;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const px = Math.cos(pt.angle) * pt.r * 0.77;
    const py = Math.sin(pt.angle) * pt.r * 0.77;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.innerHi;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  isl.points.forEach((pt, idx) => {
    const px = Math.cos(pt.angle) * pt.r * 0.52;
    const py = Math.sin(pt.angle) * pt.r * 0.52;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Desert Oasis Pool or Volcanic Caldera Centerpiece
  if (isl.biome === 'desierto') {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(-28, 22, 38, 24, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-30, 20, 24, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (isl.hasVolcano) {
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = '#57534e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Magma cracks
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    for (let f = 0; f < 5; f++) {
      const fa = (f / 5) * Math.PI * 2 + 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(fa) * 26, Math.sin(fa) * 26);
      ctx.lineTo(Math.cos(fa + 0.15) * 52, Math.sin(fa + 0.15) * 52);
      ctx.stroke();
    }
    const pulse = 0.72 + Math.sin(time * 4) * 0.28;
    ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  for (const node of isl.nodes) {
    if (node.depleted) continue;
    ctx.save();
    ctx.translate(node.x, node.y);

    if (node.kind === 'village') {
      ctx.fillStyle = 'rgba(214, 211, 209, 0.26)';
      ctx.beginPath();
      ctx.arc(0, 0, 78, 0, Math.PI * 2);
      ctx.fill();

      // Cobblestone Plaza + stone tiles
      ctx.fillStyle = '#78716c';
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-32, -24, 64, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(-16, -10, 12, 8);
      ctx.fillRect(6, 4, 12, 8);

      // House 1 (North-West) with pitched shingled roof & chimney
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(-55, -51, 44, 34);
      ctx.fillStyle = '#f5f5f4';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.fillRect(-58, -54, 42, 32);
      ctx.strokeRect(-58, -54, 42, 32);
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.moveTo(-62, -52);
      ctx.lineTo(-37, -72);
      ctx.lineTo(-12, -52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-37, -72);
      ctx.lineTo(-37, -52);
      ctx.stroke();
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-26, -65, 6, 8);

      // House 2 (North-East)
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(19, -49, 44, 34);
      ctx.fillStyle = '#e7e5e4';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.fillRect(16, -52, 42, 34);
      ctx.strokeRect(16, -52, 42, 34);
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(12, -50);
      ctx.lineTo(37, -70);
      ctx.lineTo(62, -50);
      ctx.closePath();
      ctx.fill();

      // Tavern (South-West) with timber beams & barrels
      ctx.fillStyle = '#fde68a';
      ctx.strokeStyle = '#78350f';
      ctx.fillRect(-54, 18, 44, 34);
      ctx.strokeRect(-54, 18, 44, 34);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-54, 18, 44, 12);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(-6, 44, 4.5, 0, Math.PI * 2);
      ctx.arc(-6, 33, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Market Stall & Pier (East)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(18, 20, 34, 18);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(24, 20, 8, 18);
      ctx.fillRect(40, 20, 8, 18);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(54, -9, 32, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(60, -11, 4, 22);
      ctx.fillRect(78, -11, 4, 22);

      // Animated Villagers with distinct states (strolling, trading/interacting at stall, swimming by pier)
      const villPhase = (time * 0.85) % 8;
      const plazaWalkAngle = time * 0.8 + 0.5;
      const aldeanoMood: NpcAttitudeMood = state.npcMoods?.aldeano?.mood || 'equilibrio';
      const talkingToVillager = activeNpcChat?.npcId === 'aldeano';
      const merchantWorldX = node.x + 12;
      const merchantWorldY = node.y + 28;
      const merchantNearPlayer =
        talkingToVillager &&
        player &&
        Math.hypot(player.x - merchantWorldX, player.y - merchantWorldY) < 420;
      const merchantAngle =
        merchantNearPlayer && player
          ? Math.atan2(player.y - merchantWorldY, player.x - merchantWorldX)
          : -Math.PI * 0.35;

      drawAnimatedNpc(ctx, {
        x: Math.cos(plazaWalkAngle) * 20,
        y: Math.sin(plazaWalkAngle * 1.2) * 14,
        angle: plazaWalkAngle + Math.PI * 0.5,
        time,
        animState: villPhase > 5.8 ? 'interacting' : 'walking',
        interactMood: 'chat',
        mood: aldeanoMood,
        scale: 0.72,
        coatColor: '#0284c7',
        trimColor: '#fde68a',
        hatStyle: 'straw',
        hatColor: '#eab308',
        prop: 'scroll',
        phaseOffset: 0.4,
      });

      // Market merchant interacting with customers (or directly with player in AI dialogue)
      drawAnimatedNpc(ctx, {
        x: 12,
        y: 28,
        angle: merchantAngle,
        time,
        animState: 'interacting',
        interactMood: merchantNearPlayer ? 'chat' : 'trade',
        mood: aldeanoMood,
        aiSpeaking: Boolean(merchantNearPlayer && (activeNpcChat?.aiMode || activeNpcChat?.aiLoading)),
        aiThinking: Boolean(merchantNearPlayer && activeNpcChat?.aiLoading),
        scale: 0.74,
        coatColor: '#059669',
        trimColor: '#fef08a',
        hatStyle: 'bandana',
        hatColor: '#dc2626',
        prop: 'crate',
        phaseOffset: 2.1,
      });

      // Swimmer villager splashing off the East wooden pier
      const swimT = time * 1.1;
      drawAnimatedNpc(ctx, {
        x: 78 + Math.cos(swimT) * 8,
        y: 22 + Math.sin(swimT * 1.4) * 7,
        angle: Math.atan2(Math.cos(swimT * 1.4) * 1.4, -Math.sin(swimT)),
        time,
        animState: 'swimming',
        mood: 'felicidad',
        scale: 0.68,
        coatColor: '#0ea5e9',
        trimColor: '#e0f2fe',
        hatStyle: 'none',
        phaseOffset: 4.3,
      });

      ctx.font = '700 12px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(node.villageName || 'Aldea', 0, -78);
    } else if (node.kind === 'fishing_post') {
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.fillRect(-24, -15, 34, 26);
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.8;
      ctx.fillRect(-26, -18, 34, 26);
      ctx.strokeRect(-26, -18, 34, 26);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-28, -22, 38, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(10, -7, 30, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-20, 14, 22, 6);
      drawAnimatedNpc(ctx, {
        x: 24,
        y: 0,
        angle: 0.15,
        time,
        animState: 'interacting',
        interactMood: 'trade',
        scale: 0.72,
        coatColor: '#0284c7',
        trimColor: '#bae6fd',
        hatStyle: 'straw',
        hatColor: '#facc15',
        prop: 'fish',
        phaseOffset: 1.3,
      });
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('Puesto Pesquero', 0, -28);
    } else if (node.kind === 'abandoned_ruin') {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.fillRect(-26, -24, 18, 14);
      ctx.strokeRect(-26, -24, 18, 14);
      ctx.fillRect(10, -22, 16, 22);
      ctx.strokeRect(10, -22, 16, 22);
      ctx.fillRect(-20, 10, 36, 12);
      ctx.strokeRect(-20, 10, 36, 12);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(-14, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(0, -14, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(-18, -18, 5, 0, Math.PI * 2);
      ctx.arc(16, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Ruinas Antiguas', 0, -32);
    } else if (node.kind === 'abandoned_lighthouse') {
      // Rotating subtle lighthouse beam
      ctx.save();
      ctx.rotate(time * 0.9);
      const beam = ctx.createLinearGradient(0, 0, 75, 0);
      beam.addColorStop(0, 'rgba(253, 224, 71, 0.32)');
      beam.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(75, -20);
      ctx.lineTo(75, 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(253, 224, 71, ${0.4 + Math.sin(time * 3) * 0.25})`;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('Faro Abandonado', 0, -28);
    } else if (node.kind === 'shipwreck') {
      ctx.save();
      ctx.rotate(0.42);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(2, 4, 30, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c3317';
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.quadraticCurveTo(0, 18, -28, 12);
      ctx.lineTo(-22, -12);
      ctx.quadraticCurveTo(0, -16, 32, 0);
      ctx.fill();
      ctx.stroke();
      // Exposed broken ribs
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.4;
      for (let rx = -14; rx <= 14; rx += 9) {
        ctx.beginPath();
        ctx.moveTo(rx, -11);
        ctx.lineTo(rx, 11);
        ctx.stroke();
      }
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.lineTo(10, 16);
      ctx.stroke();
      ctx.restore();
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fdba74';
      ctx.fillText('Barco Encallado', 0, -24);
    } else if (node.kind === 'abandoned_bunker') {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-24, -18, 48, 36, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(14, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Búnker Oxidado', 0, -24);
    } else if (node.kind === 'pirate_camp') {
      const rank = node.pirateRank || isl.pirateRank || 'F';
      const rankMeta = getPirateRankInfo(rank);
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(-38, -28, 76, 58);

      // Fortified Pirate HQ walls & corner towers
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = rankMeta.color;
      ctx.lineWidth = rank === 'S' || rank === 'SS' || rank === 'SSS' ? 3.2 : 2.5;
      ctx.beginPath();
      ctx.roundRect(-36, -28, 72, 56, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-38, -30, 12, 12);
      ctx.fillRect(26, -30, 12, 12);
      ctx.fillRect(-38, 18, 12, 12);
      ctx.fillRect(26, 18, 12, 12);

      // Skull Emblem
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, -2, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -5, 2.5, 2.5);
      ctx.fillRect(1.5, -5, 2.5, 2.5);

      // Rank Banner & Label
      ctx.fillStyle = rankMeta.color;
      ctx.fillRect(-30, -49, 60, 13);
      ctx.font = '800 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#090d16';
      ctx.fillText(`CUARTEL ${rank}`, 0, -39);

      // HP Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-28, -34, 56, 5);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(-28, -34, 56 * Math.max(0, node.hp / node.maxHp), 5);
    } else if (node.kind === 'tree') {
      if (isl.biome === 'desierto') {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(3, 5, 9, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-5, -18, 10, 32, 5);
        ctx.roundRect(-14, -10, 9, 6, 3);
        ctx.roundRect(5, -13, 9, 6, 3);
        ctx.fill();
        ctx.stroke();
      } else {
        // Soft ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.beginPath();
        ctx.ellipse(4, 5, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();
        // Coconuts under tropical fronds
        if (isl.biome === 'tropical') {
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(-4, 4, 2.6, 0, Math.PI * 2);
          ctx.arc(4, 3, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.sin(time * 1.5 + i) * 0.06;
          ctx.fillStyle = i % 2 === 0 ? (isl.biome === 'pradera' ? '#16a34a' : '#15803d') : (isl.biome === 'pradera' ? '#4ade80' : '#22c55e');
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 14, Math.sin(a) * 14, 14, 6.5, a, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (node.kind === 'rock') {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(2, 4, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-14, 6);
      ctx.lineTo(-9, -12);
      ctx.lineTo(8, -13);
      ctx.lineTo(14, 4);
      ctx.lineTo(3, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-3, -4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.kind === 'coal') {
      ctx.fillStyle = '#292524';
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-6, -6, 6, 6);
      ctx.fillRect(2, 1, 6, 6);
    } else if (node.kind === 'iron') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, -5, 6, 5);
      ctx.fillRect(2, 1, 6, 5);
    } else if (node.kind === 'gold_vein') {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6, -6, 6, 6);
      ctx.fillRect(2, 1, 6, 6);
    } else if (node.kind === 'tech_wreck') {
      const glow = 0.65 + 0.35 * Math.sin(time * 5);
      ctx.fillStyle = `rgba(34, 211, 238, ${glow * 0.25})`;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -11, 28, 22, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-8, -4, 6, 6);
      ctx.fillRect(2, 0, 7, 4);
    } else if (node.kind === 'titanium') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-13, 5);
      ctx.lineTo(-7, -12);
      ctx.lineTo(10, -10);
      ctx.lineTo(13, 6);
      ctx.lineTo(0, 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-5, -5, 5, 5);
      ctx.fillRect(2, 1, 5, 5);
    } else if (node.kind === 'crystal') {
      const glow = 0.7 + 0.3 * Math.sin(time * 4);
      ctx.fillStyle = `rgba(192, 132, 252, ${glow * 0.35})`;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(11, 4);
      ctx.lineTo(0, 13);
      ctx.lineTo(-11, 4);
      ctx.closePath();
      ctx.fill();
    } else if (node.kind === 'chest') {
      const pulse = 0.75 + 0.25 * Math.sin(time * 5);
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.38})`;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -9, 24, 18, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, -2, 6, 5);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.font = '700 13px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(5, 17, 28, 0.88)';
  ctx.fillRect(isl.x - 118, isl.y - isl.radius - 28, 236, 20);
  const rankCol = isl.pirateRank ? getPirateRankInfo(isl.pirateRank).color : '#fda4af';
  ctx.fillStyle = isHQ
    ? '#6ee7b7'
    : isl.pirateRank
      ? rankCol
      : isl.dangerous
        ? '#fda4af'
        : isl.discovered
          ? '#fde68a'
          : '#7dd3fc';
  const tag = isHQ
    ? `${isl.name} [CUARTEL]`
    : isl.pirateRank
      ? `${isl.name} [Piratas Rango ${isl.pirateRank}]`
      : isl.dangerous
        ? `${isl.name} (Peligro)`
        : isl.name;
  ctx.fillText(isl.discovered ? tag : `${tag} ?`, isl.x, isl.y - isl.radius - 13);
  ctx.restore();
}

function drawAnimal(ctx: CanvasRenderingContext2D, a: AnimalEntity, time: number): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  const colHit = a.hitT > 0;
  const ang = Math.atan2(a.vy, a.vx);
  const hop = Math.abs(Math.sin(a.gaitPhase)) * 2.2;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(2, 3, a.radius + 1, a.radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(ang);
  ctx.translate(0, -hop);

  if (a.kind === 'chicken') {
    // Layered plumage, tail feathers, wing tips, comb & beak
    ctx.fillStyle = colHit ? '#fff' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-8, -3);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colHit ? '#fff' : '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(-1, -4.5, 4, 2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-1, 4.5, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, -2, 3.5, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(7, -2);
    ctx.lineTo(10.5, 0);
    ctx.lineTo(7, 2);
    ctx.closePath();
    ctx.fill();
  } else if (a.kind === 'pig') {
    // Curly tail, floppy ears, snout & back shading
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-12, 0, 2.5, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.fillStyle = colHit ? '#fff' : '#f9a8d4';
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(5, -6, 3, 2, 0.5, 0, Math.PI * 2);
    ctx.ellipse(5, 6, 3, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(9.5, -3, 3.8, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(7, -3.5, 1.5, 1.5);
    ctx.fillRect(7, 2, 1.5, 1.5);
  } else if (a.kind === 'goat') {
    ctx.fillStyle = colHit ? '#fff' : '#e7e5e4';
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Sweeping horns
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.quadraticCurveTo(2, -9, -4, -7);
    ctx.moveTo(6, 3);
    ctx.quadraticCurveTo(2, 9, -4, 7);
    ctx.stroke();
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.arc(9, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (a.kind === 'boar') {
    // Dark bristled ridge, ears & curved ivory tusks
    ctx.fillStyle = colHit ? '#fff' : '#57534e';
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 8.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#292524';
    ctx.fillRect(-9, -2, 16, 4);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(16, -6);
    ctx.lineTo(12, -2);
    ctx.moveTo(10, 4);
    ctx.lineTo(16, 6);
    ctx.lineTo(12, 2);
    ctx.fill();
  } else if (a.kind === 'scorpion') {
    // Jointed legs, segmented chitin carapace, twin pincers & arching stinger tail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.8;
    for (let l = -1; l <= 1; l++) {
      const lx = l * 3.5;
      ctx.beginPath();
      ctx.moveTo(lx, -5);
      ctx.lineTo(lx - 2, -11);
      ctx.moveTo(lx, 5);
      ctx.lineTo(lx - 2, 11);
      ctx.stroke();
    }
    ctx.fillStyle = colHit ? '#fff' : '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Segmented stinger tail
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-17, Math.sin(time * 8) * 3, -12, -9);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-12, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Twin pincers
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(7, -4);
    ctx.lineTo(12, -7);
    ctx.moveTo(7, 4);
    ctx.lineTo(12, 7);
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(13, -7, 3.6, 0, Math.PI * 2);
    ctx.arc(13, 7, 3.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Wild Wolf: bushy tail, fur mane, pointed ears, snout & fierce red predator eyes
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(-13, Math.sin(time * 7) * 1.5, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colHit ? '#fff' : '#64748b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Ruff & head
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(6, 0, 5.5, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(4, -10);
    ctx.lineTo(9, -4);
    ctx.moveTo(6, 6);
    ctx.lineTo(4, 10);
    ctx.lineTo(9, 4);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, -2.5, 5, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(9, -3.5, 2, 2);
    ctx.fillRect(9, 1.5, 2, 2);
  }

  ctx.restore();
  ctx.restore();
}

function drawIslandStructure(
  ctx: CanvasRenderingContext2D,
  st: IslandStructure,
  enemies: EnemyEntity[],
  time: number,
  isDonorSkin = false
): void {
  ctx.save();
  ctx.translate(st.x, st.y);

  if (st.kind === 'shelter') {
    if (isDonorSkin) {
      // Exclusive Donor Sanctuary Refugio appearance
      const auraR = 62 + Math.sin(time * 3) * 2.5;
      const auraGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, auraR);
      auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.24)');
      auraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ivory-marble sanctuary walls & gilded roof
      ctx.fillStyle = '#0f293d';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(-25, -20, 50, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#047857';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-19, -14, 38, 28, 5);
      ctx.fill();
      ctx.stroke();

      // Golden central lantern crystal
      ctx.fillStyle = `rgba(253, 224, 71, ${0.72 + Math.sin(time * 6) * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Dual emerald-gold banners
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-25, -26, 3, 14);
      ctx.fillRect(22, -26, 3, 14);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-22, -26, 7, 5);
      ctx.fillRect(15, -26, 7, 5);

      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.fillText('★ SANTUARIO MECENAS', 0, -29);
    } else {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -18, 44, 36, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(251, 146, 60, ${0.55 + Math.sin(time * 8) * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 24, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('REFUGIO', 0, -24);
    }
  } else if (st.kind === 'hq') {
    ctx.fillStyle = isDonorSkin ? '#0f2740' : '#1e293b';
    ctx.strokeStyle = isDonorSkin ? '#fde047' : '#fbbf24';
    ctx.lineWidth = isDonorSkin ? 3.2 : 2.5;
    ctx.beginPath();
    ctx.roundRect(-30, -24, 60, 48, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isDonorSkin ? '#d97706' : '#475569';
    ctx.fillRect(-30, -24, 11, 11);
    ctx.fillRect(19, -24, 11, 11);
    ctx.fillRect(-30, 13, 11, 11);
    ctx.fillRect(19, 13, 11, 11);
    if (isDonorSkin) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -30);
    ctx.stroke();
    ctx.fillStyle = isDonorSkin ? '#10b981' : '#e11d48';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(18, -24 + Math.sin(time * 6) * 2);
    ctx.lineTo(0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText(isDonorSkin ? '★ CUARTEL MECENAS' : 'CUARTEL', 0, 36);
  } else if (st.kind === 'warehouse') {
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, -17, 44, 34, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-14, -10, 11, 11);
    ctx.fillRect(3, -10, 11, 11);
    ctx.fillRect(-5, 3, 11, 10);
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('ALMACÉN', 0, -22);
  } else if (st.kind === 'nuclear_bunker') {
    // Reinforced Nuclear Warhead Bunker
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-28, -22, 56, 44, 6);
    ctx.fill();
    ctx.stroke();

    // Silo blast door & nuclear glow
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(163, 230, 53, ${0.55 + Math.sin(time * 5) * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hazard corners
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-26, -20, 7, 4);
    ctx.fillRect(19, -20, 7, 4);
    ctx.fillRect(-26, 16, 7, 4);
    ctx.fillRect(19, 16, 7, 4);

    ctx.font = '700 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bef264';
    ctx.fillText('☢ BÚNKER NUCLEAR', 0, -28);
  } else if (st.kind === 'settlement') {
    const bannerMap: Record<string, string> = {
      dorado: '#fbbf24',
      esmeralda: '#10b981',
      carmesi: '#e11d48',
      cian: '#22d3ee',
    };
    const bannerCol = bannerMap[st.styleBanner || 'dorado'] || '#fbbf24';
    const tier = Math.max(1, Math.min(3, st.level || 1));
    const titlePrefix = tier === 1 ? 'Pueblo' : tier === 2 ? 'Reino' : 'Imperio';
    const labelText = `${titlePrefix}: ${st.customName || 'Nueva Costa'}`;

    if (tier === 1) {
      // Nv.1 PUEBLO: Cottages + central hearth plaza + banner
      ctx.strokeStyle = `${bannerCol}66`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const huts = [
        [-22, -14],
        [10, -16],
        [-20, 10],
        [12, 12],
      ];
      for (const [hx, hy] of huts) {
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(hx - 9, hy - 7, 18, 14, 3);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (tier === 2) {
      // Nv.2 REINO: Stone walls, corner towers, courtyard & royal banner
      ctx.strokeStyle = `${bannerCol}88`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 74, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = bannerCol;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-36, -30, 72, 60, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillRect(-26, -20, 52, 40);
      // Corner watchtowers
      ctx.fillStyle = '#1e293b';
      for (const [tx, ty] of [
        [-36, -30],
        [24, -30],
        [-36, 18],
        [24, 18],
      ]) {
        ctx.fillRect(tx, ty, 12, 12);
        ctx.strokeRect(tx, ty, 12, 12);
      }
      // Keep roof
      ctx.fillStyle = bannerCol;
      ctx.beginPath();
      ctx.roundRect(-12, -10, 24, 20, 4);
      ctx.fill();
    } else {
      // Nv.3 IMPERIO: Monumental gilded citadel, spires, dual banners & aura
      const auraR = 92 + Math.sin(time * 2.5) * 3;
      const impGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, auraR);
      impGrad.addColorStop(0, `${bannerCol}33`);
      impGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = impGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-48, -38, 96, 76, 10);
      ctx.fill();
      ctx.stroke();

      // Inner palace wings
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = bannerCol;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-32, -24, 64, 48, 6);
      ctx.fill();
      ctx.stroke();

      // Twin side domes + central imperial dome
      ctx.fillStyle = bannerCol;
      ctx.beginPath();
      ctx.arc(-20, 0, 9, 0, Math.PI * 2);
      ctx.arc(20, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Imperial flagpole
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, -46);
      ctx.stroke();
      ctx.fillStyle = bannerCol;
      ctx.beginPath();
      ctx.moveTo(0, -46);
      ctx.lineTo(24, -38 + Math.sin(time * 5) * 2.5);
      ctx.lineTo(0, -30);
      ctx.closePath();
      ctx.fill();
    }

    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(labelText, 0, tier === 3 ? -52 : tier === 2 ? -38 : -32);
  } else if (st.kind === 'turret') {
    const nearest = enemies[0];
    const ang = nearest ? Math.atan2(nearest.y - st.y, nearest.x - st.x) : time;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(ang);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, -3, 18, 6);
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(time * 2.4);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParkedPirateBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  isBoss: boolean,
  time: number
): void {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 3) * 2);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 22, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isBoss ? '#450a0a' : '#451a03';
  ctx.strokeStyle = isBoss ? '#fbbf24' : '#dc2626';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.quadraticCurveTo(0, 17, -21, 12);
  ctx.lineTo(-21, -12);
  ctx.quadraticCurveTo(0, -17, 24, 0);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, -5);
  ctx.lineTo(14, -3);
  ctx.moveTo(-14, 5);
  ctx.lineTo(14, 3);
  ctx.stroke();
  ctx.restore();
}

function drawCheckpointBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 14 + Math.sin(time * 4) * 3;
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -28, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 9px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('PUNTO GUARDADO', 0, -37);
  ctx.restore();
}

function drawTopDownRaft(
  ctx: CanvasRenderingContext2D,
  raft: RaftEntity,
  state: PersistentState,
  enemies: EnemyEntity[],
  time: number
): void {
  const lv = raft.level;
  const halfSize = getRaftHalfSize(lv);
  const isSloop = lv === 2;
  const isShip = lv >= 3;
  const isBrig = lv >= 4;
  const isFrigate = lv >= 5;
  const isLiner = lv >= 6;
  const isWarship = lv >= 7;

  ctx.save();
  ctx.translate(raft.x, raft.y);

  // Moving ocean wake behind vessel
  if (Math.hypot(raft.vx, raft.vy) > 12) {
    ctx.save();
    ctx.rotate(raft.angle);
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.36)';
    ctx.lineWidth = isWarship ? 4 : 2.8;
    ctx.beginPath();
    ctx.moveTo(-halfSize - 8, -halfSize * 0.52);
    ctx.lineTo(-halfSize - 38 - Math.sin(time * 12) * 5, -halfSize * 0.88);
    ctx.moveTo(-halfSize - 8, halfSize * 0.52);
    ctx.lineTo(-halfSize - 38 - Math.sin(time * 12) * 5, halfSize * 0.88);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.rotate(raft.angle);

  if (isSloop) {
    // LEVEL 2 (Balandra Armada): Clear transition from square raft into a real pointed wooden boat!
    ctx.fillStyle = 'rgba(2, 10, 18, 0.45)';
    ctx.beginPath();
    ctx.moveTo(halfSize + 24, 5);
    ctx.quadraticCurveTo(halfSize * 0.35, halfSize + 6, -halfSize - 4, halfSize * 0.86 + 5);
    ctx.lineTo(-halfSize - 4, -halfSize * 0.86 + 5);
    ctx.quadraticCurveTo(halfSize * 0.35, -halfSize - 1, halfSize + 24, 5);
    ctx.fill();

    // Wooden boat hull
    ctx.fillStyle = '#7c451e';
    ctx.strokeStyle = state.raft.damagedMode ? '#ef4444' : '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(halfSize + 22, 0);
    ctx.quadraticCurveTo(halfSize * 0.3, halfSize + 2, -halfSize - 6, halfSize * 0.84);
    ctx.lineTo(-halfSize - 6, -halfSize * 0.84);
    ctx.quadraticCurveTo(halfSize * 0.3, -halfSize - 2, halfSize + 22, 0);
    ctx.fill();
    ctx.stroke();

    // Recessed planked inner deck
    ctx.fillStyle = '#9c5e2f';
    ctx.beginPath();
    ctx.moveTo(halfSize + 10, 0);
    ctx.quadraticCurveTo(halfSize * 0.25, halfSize * 0.82, -halfSize + 2, halfSize * 0.7);
    ctx.lineTo(-halfSize + 2, -halfSize * 0.7);
    ctx.quadraticCurveTo(halfSize * 0.25, -halfSize * 0.82, halfSize + 10, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.5)';
    ctx.lineWidth = 1.4;
    for (let py = -halfSize * 0.58; py <= halfSize * 0.58; py += 12) {
      ctx.beginPath();
      ctx.moveTo(-halfSize + 6, py);
      ctx.lineTo(halfSize - 6, py);
      ctx.stroke();
    }

    // Small wooden / donor sanctuary shelter roof over stern-mid deck
    const donorRaftRoof = Boolean(state.donorUnlocked && state.donorSkinEnabled);
    ctx.fillStyle = donorRaftRoof ? '#065f46' : '#5c3317';
    ctx.strokeStyle = donorRaftRoof ? '#fde047' : '#fbbf24';
    ctx.lineWidth = donorRaftRoof ? 2 : 1.6;
    ctx.beginPath();
    ctx.roundRect(-halfSize * 0.55, -halfSize * 0.36, 30, halfSize * 0.72, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = donorRaftRoof ? '#fbbf24' : '#d97706';
    ctx.fillRect(-halfSize * 0.55 + 4, -halfSize * 0.36 + 4, 22, halfSize * 0.72 - 8);

    // Bowsprit + Single Jib Sail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(halfSize + 14, 0);
    ctx.lineTo(halfSize + 36, 0);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, -halfSize * 0.56);
    ctx.quadraticCurveTo(32, 0, 14, halfSize * 0.56);
    ctx.lineTo(8, halfSize * 0.56);
    ctx.quadraticCurveTo(22, 0, 8, -halfSize * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (isShip) {
    // LEVELS 3 -> 7+ (Goleta -> Bergantín -> Fragata -> Navío -> Buque de Guerra)
    const hullLenBonus = isWarship ? 44 : isLiner ? 38 : isFrigate ? 34 : isBrig ? 30 : 26;

    // Deep water shadow
    ctx.fillStyle = 'rgba(2, 10, 18, 0.5)';
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus + 4, 6);
    ctx.quadraticCurveTo(halfSize * 0.25, halfSize + 10, -halfSize - 12, halfSize * 0.86 + 6);
    ctx.lineTo(-halfSize - 12, -halfSize * 0.86 + 6);
    ctx.quadraticCurveTo(halfSize * 0.25, -halfSize - 4, halfSize + hullLenBonus + 4, 6);
    ctx.fill();

    // Main Ship Hull with steel/brass armor trim
    ctx.fillStyle = isWarship
      ? '#3a1d11'
      : isLiner
        ? '#542a16'
        : isFrigate
          ? '#6b3719'
          : isBrig
            ? '#7c451e'
            : '#8d5027';
    ctx.strokeStyle = state.raft.damagedMode
      ? '#ef4444'
      : isWarship
        ? '#facc15'
        : isLiner
          ? '#e2e8f0'
          : isFrigate
            ? '#94a3b8'
            : isBrig
              ? '#f59e0b'
              : '#cbd5e1';
    ctx.lineWidth = isWarship ? 5 : isLiner ? 4 : isFrigate ? 3.5 : 3;
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus, 0);
    ctx.quadraticCurveTo(halfSize * 0.22, halfSize + 6, -halfSize - 12, halfSize * 0.84);
    ctx.lineTo(-halfSize - 12, -halfSize * 0.84);
    ctx.quadraticCurveTo(halfSize * 0.22, -halfSize - 6, halfSize + hullLenBonus, 0);
    ctx.fill();
    ctx.stroke();

    // Ironclad side armor plates for Frigate/Liner/Warship
    if (isFrigate) {
      ctx.strokeStyle = isWarship ? '#94a3b8' : '#64748b';
      ctx.lineWidth = isWarship ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(-halfSize + 10, -halfSize * 0.72);
      ctx.quadraticCurveTo(halfSize * 0.2, -halfSize * 0.85, halfSize + hullLenBonus - 16, -6);
      ctx.moveTo(-halfSize + 10, halfSize * 0.72);
      ctx.quadraticCurveTo(halfSize * 0.2, halfSize * 0.85, halfSize + hullLenBonus - 16, 6);
      ctx.stroke();
    }

    // Recessed planked main deck + central spine beam
    ctx.fillStyle = isWarship ? '#6d3b1d' : '#9c5e2f';
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus - 14, 0);
    ctx.quadraticCurveTo(halfSize * 0.2, halfSize * 0.78, -halfSize - 2, halfSize * 0.72);
    ctx.lineTo(-halfSize - 2, -halfSize * 0.72);
    ctx.quadraticCurveTo(halfSize * 0.2, -halfSize * 0.78, halfSize + hullLenBonus - 14, 0);
    ctx.fill();

    ctx.strokeStyle = 'rgba(40, 18, 5, 0.45)';
    ctx.lineWidth = 1.4;
    for (let py = -halfSize * 0.64; py <= halfSize * 0.64; py += 12) {
      ctx.beginPath();
      ctx.moveTo(-halfSize + 4, py);
      ctx.lineTo(halfSize + 2, py);
      ctx.stroke();
    }

    // Bowsprit & Rigging Stay Lines (Lv4+)
    if (isBrig) {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(halfSize + hullLenBonus - 8, 0);
      ctx.lineTo(halfSize + hullLenBonus + 24, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(halfSize + hullLenBonus + 22, 0);
      ctx.lineTo(halfSize * 0.45, -halfSize * 0.6);
      ctx.moveTo(halfSize + hullLenBonus + 22, 0);
      ctx.lineTo(halfSize * 0.45, halfSize * 0.6);
      ctx.stroke();
    }

    // Golden Figurehead (Lv6+)
    if (isLiner) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(halfSize + hullLenBonus + 2, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Steel Ram Prow (Lv7 Buque de Guerra!)
    if (isWarship) {
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(halfSize + hullLenBonus + 22, 0);
      ctx.lineTo(halfSize + hullLenBonus - 4, -10);
      ctx.lineTo(halfSize + hullLenBonus - 4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Broadside Cannons (Lv5=4, Lv6=6, Lv7=8)
    if (isFrigate) {
      const cannonXs = isWarship
        ? [-halfSize * 0.36, -halfSize * 0.08, halfSize * 0.2, halfSize * 0.48]
        : isLiner
          ? [-halfSize * 0.3, 0, halfSize * 0.3]
          : [-halfSize * 0.15, halfSize * 0.25];
      for (const cx of cannonXs) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 4, -halfSize * 0.84 - 5, 8, 9);
        ctx.fillRect(cx - 4, halfSize * 0.84 - 4, 8, 9);
        ctx.fillStyle = isWarship ? '#fbbf24' : '#94a3b8';
        ctx.fillRect(cx - 2.5, -halfSize * 0.84 - 6, 5, 2);
        ctx.fillRect(cx - 2.5, halfSize * 0.84 + 4, 5, 2);
      }
    }

    // Enclosed Deckhouse Roof & Raised Armored Bridge / Stern Castle (at stern, keeping mid-deck corral open!)
    const roofW = isWarship ? 34 : isFrigate ? 28 : 24;
    const roofH = halfSize * (isWarship ? 0.88 : 0.78);
    ctx.fillStyle = isWarship ? '#2c150c' : '#451a03';
    ctx.strokeStyle = isWarship ? '#fbbf24' : '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfSize - 6, -roofH / 2, roofW, roofH, 4);
    ctx.fill();
    ctx.stroke();
    // Cabin roof planks & skylight
    ctx.fillStyle = isWarship ? '#7f1d1d' : '#78350f';
    ctx.fillRect(-halfSize, -roofH / 2 + 5, roofW - 12, roofH - 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-halfSize + 10, -7, 10, 14);

    // Stern Gallery Lantern Windows (Lv6+)
    if (isLiner) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-halfSize - 8, -16, 3.5, 6);
      ctx.fillRect(-halfSize - 8, -3, 3.5, 6);
      ctx.fillRect(-halfSize - 8, 10, 3.5, 6);
    }

    // Billowing Rigged Sails + Masts + Warship Crest
    const sailXs = isWarship
      ? [-halfSize * 0.22, halfSize * 0.14, halfSize * 0.5]
      : isLiner
        ? [-halfSize * 0.2, halfSize * 0.15, halfSize * 0.45]
        : isBrig
          ? [-halfSize * 0.1, halfSize * 0.32]
          : [halfSize * 0.14];
    sailXs.forEach((sx, idx) => {
      const span = halfSize * (idx === 0 && isWarship ? 0.58 : 0.66);
      // Yardarm beam
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, -span - 4);
      ctx.lineTo(sx, span + 4);
      ctx.stroke();

      // Sail canvas
      ctx.fillStyle = isWarship ? '#fef2f2' : '#f8fafc';
      ctx.strokeStyle = isWarship ? '#dc2626' : isFrigate ? '#fbbf24' : '#cbd5e1';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx + 4, -span);
      ctx.quadraticCurveTo(sx + 18, 0, sx + 4, span);
      ctx.lineTo(sx - 3, span);
      ctx.quadraticCurveTo(sx + 10, 0, sx - 3, -span);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Warship emblem stripe on main sail
      if (isWarship) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(sx + 6, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Mast cap
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(sx + 2, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fluttering Warship Pennant Flag at Masthead (Lv5+)
    if (isFrigate) {
      const fx = isWarship ? halfSize * 0.14 : halfSize * 0.32;
      ctx.fillStyle = isWarship ? '#dc2626' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.lineTo(fx - 22, -5 + Math.sin(time * 9) * 2.5);
      ctx.lineTo(fx - 18, 2 + Math.sin(time * 9) * 2.5);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // LEVEL 1 (Balsa de Náufrago): Detailed lashed timber raft WITH pre-upgrade canopy/roof!
    ctx.fillStyle = 'rgba(2, 10, 18, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-halfSize + 4, -halfSize + 4, halfSize * 2, halfSize * 2, 10);
    ctx.fill();

    // Individual rounded buoyant timber logs
    const logCount = 7;
    const logW = (halfSize * 2 - 8) / logCount;
    for (let i = 0; i < logCount; i++) {
      const ly = -halfSize + 4 + i * logW;
      ctx.fillStyle = i % 2 === 0 ? '#8b4f24' : '#7c451e';
      ctx.strokeStyle = state.raft.damagedMode ? '#ef4444' : '#451a03';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-halfSize, ly, halfSize * 2, logW - 1, 5);
      ctx.fill();
      ctx.stroke();

      // Wood grain knot
      ctx.fillStyle = 'rgba(69, 26, 3, 0.45)';
      ctx.beginPath();
      ctx.ellipse((i % 3 - 1) * 18, ly + logW * 0.5, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cross-beam deck planks
    ctx.fillStyle = '#a1622e';
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-halfSize + 10, -halfSize + 10, halfSize * 2 - 20, halfSize * 2 - 20);
    ctx.strokeRect(-halfSize + 10, -halfSize + 10, halfSize * 2 - 20, halfSize * 2 - 20);
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
    for (let px = -halfSize + 24; px < halfSize - 12; px += 16) {
      ctx.beginPath();
      ctx.moveTo(px, -halfSize + 10);
      ctx.lineTo(px, halfSize - 10);
      ctx.stroke();
    }

    // Corner Rope Lashings
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.2;
    for (const cx of [-halfSize + 10, halfSize - 14]) {
      for (const cy of [-halfSize + 10, halfSize - 14]) {
        ctx.strokeRect(cx, cy, 5, 5);
      }
    }

    // Pre-Upgrade Small Timber & Canvas Canopy Roof (compact at aft-port corner, away from the open corral!)
    const roofX = -halfSize + 10;
    const roofY = -halfSize + 10;
    const roofW = 28;
    const roofH = 22;
    // Soft canopy shadow on deck
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(roofX + 3, roofY + 4, roofW, roofH);
    // Support bamboo/wood posts
    ctx.fillStyle = '#451a03';
    ctx.fillRect(roofX, roofY, 4, 4);
    ctx.fillRect(roofX + roofW - 4, roofY, 4, 4);
    ctx.fillRect(roofX, roofY + roofH - 4, 4, 4);
    ctx.fillRect(roofX + roofW - 4, roofY + roofH - 4, 4, 4);
    // Tarp / Palm-thatched or Donor Sanctuary shelter roof
    const donorCanopy = Boolean(state.donorUnlocked && state.donorSkinEnabled);
    ctx.fillStyle = donorCanopy ? '#047857' : '#d97706';
    ctx.strokeStyle = donorCanopy ? '#fde047' : '#fef3c7';
    ctx.lineWidth = donorCanopy ? 1.8 : 1.4;
    ctx.beginPath();
    ctx.roundRect(roofX, roofY, roofW, roofH, 3);
    ctx.fill();
    ctx.stroke();
    // Striped canvas slats & ridge pole
    ctx.fillStyle = donorCanopy ? '#f59e0b' : '#b45309';
    ctx.fillRect(roofX + 5, roofY + 2, 5, roofH - 4);
    ctx.fillRect(roofX + 16, roofY + 2, 5, roofH - 4);
    ctx.strokeStyle = donorCanopy ? '#fef08a' : '#fde68a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(roofX, roofY + roofH / 2);
    ctx.lineTo(roofX + roofW, roofY + roofH / 2);
    ctx.stroke();

    // Hanging warm lantern at canopy corner
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(roofX + roofW + 2, roofY + roofH - 2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Storage Crate (center-aft)
  ctx.fillStyle = '#b45309';
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-halfSize * 0.25, -14, 15, 15);
  ctx.strokeRect(-halfSize * 0.25, -14, 15, 15);

  // Helm Wheel (Bow)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(halfSize - 18, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(halfSize - 27, 0);
  ctx.lineTo(halfSize - 9, 0);
  ctx.moveTo(halfSize - 18, -9);
  ctx.lineTo(halfSize - 18, 9);
  ctx.stroke();

  // Distiller, Solar & Engine Modules
  if (state.raft.distillerLevel >= 1) {
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-halfSize * 0.52, 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (state.raft.solarLevel >= 1) {
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-10, -halfSize * 0.68, 22, 10);
    ctx.strokeRect(-10, -halfSize * 0.68, 22, 10);
  }
  if (state.raft.engineLevel >= 1) {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-halfSize - 10, -9, 10, 18);
    ctx.strokeRect(-halfSize - 10, -9, 10, 18);
  }
  ctx.restore();

  // Hull HP Bar when damaged or below max
  if (state.raft.hp < state.raft.maxHp || state.raft.damagedMode) {
    const bw = 82;
    ctx.fillStyle = 'rgba(4, 14, 23, 0.85)';
    ctx.fillRect(-bw / 2 - 1, halfSize + 12, bw + 2, 7);
    ctx.fillStyle = state.raft.damagedMode ? '#ef4444' : '#38bdf8';
    ctx.fillRect(-bw / 2, halfSize + 13, bw * Math.max(0, state.raft.hp / state.raft.maxHp), 5);
    if (state.raft.damagedMode) {
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fda4af';
      ctx.fillText('¡CASCO AVERIADO! REPARA', 0, halfSize + 32);
    }
  }

  ctx.restore();

  if (state.raft.turretLevel > 0) {
    const nearest = enemies[0];
    const aimAngle = nearest ? Math.atan2(nearest.y - raft.y, nearest.x - raft.x) : raft.angle;
    const turCount = Math.min(4, state.raft.turretLevel);
    for (let i = 0; i < turCount; i++) {
      const offAngle = (i / Math.max(1, turCount)) * Math.PI * 2 + 0.5;
      const tx = raft.x + Math.cos(offAngle) * (halfSize * 0.42);
      const ty = raft.y + Math.sin(offAngle) * (halfSize * 0.42);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(aimAngle);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, -2.5, 14, 5);
      ctx.restore();
    }
  }
}

function drawFarmPlot(
  ctx: CanvasRenderingContext2D,
  plot: FarmPlot,
  wx: number,
  wy: number,
  time: number
): void {
  ctx.save();
  ctx.translate(wx, wy);
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = plot.watered ? '#38bdf8' : '#92400e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-13, -10, 26, 20, 3);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.lineTo(9, -4);
  ctx.moveTo(-9, 3);
  ctx.lineTo(9, 3);
  ctx.stroke();

  if (plot.crop) {
    const def = CROPS_CATALOG.find((c) => c.id === plot.crop);
    const col = def?.color || '#22c55e';
    const pct = Math.max(0.25, Math.min(1, plot.growth / 100));
    const sway = Math.sin(time * 3 + wx) * 1.4;
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(i * 6 + sway * 0.4, -2, 3.8 * pct + 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (plot.growth >= 95) {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-14, -11, 28, 22);
    }
  }
  ctx.restore();
}

function drawCaptiveSprite(
  ctx: CanvasRenderingContext2D,
  cap: CaptiveAnimal,
  wx: number,
  wy: number,
  time: number
): void {
  ctx.save();
  ctx.translate(wx, wy + Math.sin(time * 4 + wx * 0.2) * 1.5);
  ctx.scale(1.22, 1.22);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(1, 3, 7.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const col =
    cap.kind === 'chicken'
      ? '#f8fafc'
      : cap.kind === 'pig'
        ? '#f9a8d4'
        : cap.kind === 'goat'
          ? '#e7e5e4'
          : '#57534e';
  ctx.fillStyle = col;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (cap.kind === 'chicken') {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1, -5, 3.5, 3.5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(6.5, -1.5, 3.5, 3);
  } else if (cap.kind === 'pig') {
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(6.5, -2.5, 3.5, 5);
  } else if (cap.kind === 'goat') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -3);
    ctx.lineTo(1, -7);
    ctx.moveTo(4, 3);
    ctx.lineTo(1, 7);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(6, -4.5, 3.5, 2);
    ctx.fillRect(6, 2.5, 3.5, 2);
  }
  ctx.restore();
}

function drawWoodenCorralFence(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  label: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  // Open-air sunlit straw bedding floor (NO roof!)
  ctx.fillStyle = 'rgba(217, 155, 38, 0.42)';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 4);
  ctx.fill();

  // Hay bale & water trough
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-w / 2 + 5, -h / 2 + 5, 9, 7);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(w / 2 - 14, -h / 2 + 5, 9, 5);

  // Open wooden fence rails around perimeter
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.6;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // Fence corner & mid posts
  ctx.fillStyle = '#fef3c7';
  const posts = [
    [-w / 2, -h / 2],
    [0, -h / 2],
    [w / 2, -h / 2],
    [-w / 2, h / 2],
    [0, h / 2],
    [w / 2, h / 2],
  ];
  for (const [px, py] of posts) {
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '700 8px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(label, 0, h / 2 + 10);
  ctx.restore();
}

function drawRaftFarmAndPens(
  ctx: CanvasRenderingContext2D,
  raft: RaftEntity,
  state: PersistentState,
  islands: IslandEntity[],
  time: number
): void {
  const halfSize = getRaftHalfSize(raft.level);
  const cos = Math.cos(raft.angle);
  const sin = Math.sin(raft.angle);
  const raftLimit = getRaftCorralLimit(raft.level);

  // Portside Garden Deck (clean grid in port open deck)
  const raftPlots = state.farmPlots.filter((p) => p.location === 'raft');
  raftPlots.forEach((plot, idx) => {
    const lx = 4 + (idx % 2) * 28;
    const ly = -halfSize + 24 + Math.floor(idx / 2) * 22;
    const wx = raft.x + lx * cos - ly * sin;
    const wy = raft.y + lx * sin + ly * cos;
    drawFarmPlot(ctx, plot, wx, wy, time);
  });

  // Open-air Starboard Corral on the Raft (completely uncovered, no roof, clear view of animals!)
  const penW = 52 + Math.min(24, (raft.level - 1) * 5);
  const penH = 40 + Math.min(18, (raft.level - 1) * 4);
  const penLx = 4;
  const penLy = halfSize * 0.44;
  const penX = raft.x + penLx * cos - penLy * sin;
  const penY = raft.y + penLx * sin + penLy * cos;

  const raftAnimals = state.captiveAnimals.filter((a) => a.location === 'raft');
  drawWoodenCorralFence(
    ctx,
    penX,
    penY,
    penW,
    penH,
    `Corral ${raftAnimals.length}/${raftLimit}`
  );

  // Captive animals roam visibly inside the open-air raft corral!
  raftAnimals.slice(0, raftLimit).forEach((cap, idx) => {
    const roamX = Math.sin(time * 1.15 + idx * 2.1) * (penW * 0.28);
    const roamY = Math.cos(time * 0.95 + idx * 2.4) * (penH * 0.24);
    drawCaptiveSprite(ctx, cap, penX + roamX, penY + roamY, time);
  });

  // Island Corrals ALWAYS anchored to their actual Island (NEVER on or beside the raft!)
  const islandAnimals = state.captiveAnimals.filter((a) => a.location === 'island');
  const byIsland = new Map<string, CaptiveAnimal[]>();
  for (const cap of islandAnimals) {
    if (!cap.islandId) continue;
    if (!byIsland.has(cap.islandId)) byIsland.set(cap.islandId, []);
    byIsland.get(cap.islandId)!.push(cap);
  }
  // Also show an empty corral next to any island HQ/Shelter so the player can see their island corral!
  for (const st of state.islandStructures) {
    if (st.kind === 'hq' || st.kind === 'shelter') {
      if (!byIsland.has(st.islandId)) byIsland.set(st.islandId, []);
    }
  }
  for (const [islId, list] of byIsland.entries()) {
    const isl = islands.find((x) => x.id === islId);
    const st = state.islandStructures.find((x) => x.islandId === islId);
    if (!isl && !st) continue;
    const baseX = st ? st.x + 56 : isl!.x + 54;
    const baseY = st ? st.y + 34 : isl!.y + 42;
    const capLimit = getIslandCorralLimit(state, islId);
    drawWoodenCorralFence(ctx, baseX, baseY, 76, 56, `Corral Isla ${list.length}/${capLimit}`);
    list.slice(0, capLimit).forEach((cap, idx) => {
      const roamX = Math.sin(time * 1.0 + idx * 1.7) * 24;
      const roamY = Math.cos(time * 0.85 + idx * 2.1) * 16;
      drawCaptiveSprite(ctx, cap, baseX + roamX, baseY + roamY, time);
    });
  }
}

export interface AnimatedNpcOptions {
  x: number;
  y: number;
  angle: number;
  time: number;
  animState: NpcAnimState;
  scale?: number;
  coatColor: string;
  trimColor?: string;
  skinColor?: string;
  hatStyle?: 'tricorn' | 'bandana' | 'straw' | 'cap' | 'hood' | 'none';
  hatColor?: string;
  prop?: 'wrench' | 'spyglass' | 'crate' | 'lantern' | 'cannon_ram' | 'sword' | 'scroll' | 'fish' | 'none';
  label?: string;
  labelColor?: string;
  phaseOffset?: number;
  interactMood?: 'trade' | 'repair' | 'chat' | 'cheer';
  mood?: NpcAttitudeMood;
  aiSpeaking?: boolean;
  aiThinking?: boolean;
  activityHint?: string;
}

function getNpcMoodVisualProfile(mood: NpcAttitudeMood = 'equilibrio'): {
  cadenceMult: number;
  postureTilt: number;
  auraColor: string | null;
  eyeColor: string;
  browSlope: number;
  badgeText?: string;
  badgeColor?: string;
} {
  switch (mood) {
    case 'felicidad':
      return {
        cadenceMult: 1.18,
        postureTilt: 0.04,
        auraColor: 'rgba(52, 211, 153, 0.24)',
        eyeColor: '#0f172a',
        browSlope: -0.22,
        badgeColor: '#34d399',
      };
    case 'orgullo':
      return {
        cadenceMult: 1.08,
        postureTilt: 0.08,
        auraColor: 'rgba(251, 191, 36, 0.26)',
        eyeColor: '#0f172a',
        browSlope: -0.1,
        badgeColor: '#fbbf24',
      };
    case 'soberbia':
      return {
        cadenceMult: 0.96,
        postureTilt: 0.11,
        auraColor: 'rgba(249, 115, 22, 0.28)',
        eyeColor: '#1e1b4b',
        browSlope: 0.25,
        badgeColor: '#fb923c',
      };
    case 'enojo':
      return {
        cadenceMult: 1.24,
        postureTilt: 0.06,
        auraColor: 'rgba(244, 63, 94, 0.34)',
        eyeColor: '#450a0a',
        browSlope: 0.42,
        badgeText: '💢',
        badgeColor: '#fb7185',
      };
    case 'tristeza':
      return {
        cadenceMult: 0.72,
        postureTilt: -0.09,
        auraColor: 'rgba(96, 165, 250, 0.22)',
        eyeColor: '#1e293b',
        browSlope: -0.35,
        badgeText: '💧',
        badgeColor: '#93c5fd',
      };
    case 'cansancio':
      return {
        cadenceMult: 0.68,
        postureTilt: -0.12,
        auraColor: 'rgba(148, 163, 184, 0.20)',
        eyeColor: '#334155',
        browSlope: -0.18,
        badgeText: 'zZ',
        badgeColor: '#cbd5e1',
      };
    case 'lokito':
      return {
        cadenceMult: 1.42,
        postureTilt: 0.05,
        auraColor: 'rgba(192, 132, 252, 0.36)',
        eyeColor: '#581c87',
        browSlope: 0.35,
        badgeText: '⚡',
        badgeColor: '#e879f9',
      };
    default:
      return {
        cadenceMult: 1.0,
        postureTilt: 0,
        auraColor: null,
        eyeColor: '#0f172a',
        browSlope: 0,
      };
  }
}

/**
 * Renderiza el estado animado completo de un NPC (caminando, nadando, interactuando o en reposo),
 * integrando su personalidad emocional y los pulsos visuales del sistema de diálogos con IA.
 */
export function renderNpcAnimationState(ctx: CanvasRenderingContext2D, opts: AnimatedNpcOptions): void {
  const {
    x,
    y,
    angle,
    time,
    animState,
    scale = 0.78,
    coatColor,
    trimColor = '#fbbf24',
    skinColor = '#fde68a',
    hatStyle = 'bandana',
    hatColor = '#1e293b',
    prop = 'none',
    label,
    labelColor = '#f8fafc',
    phaseOffset = 0,
    interactMood = 'chat',
    mood = 'equilibrio',
    aiSpeaking = false,
    aiThinking = false,
    activityHint,
  } = opts;

  const moodProfile = getNpcMoodVisualProfile(mood);
  const t = time * moodProfile.cadenceMult + phaseOffset;
  const isWalking = animState === 'walking';
  const isSwimming = animState === 'swimming';
  const isInteracting = animState === 'interacting';

  const walkCycle = t * 9.6;
  const swimCycle = t * 6.8;
  const interactCycle = t * (aiSpeaking ? 6.4 : 5.0);

  const lokitoJitterX = mood === 'lokito' ? Math.sin(time * 18 + phaseOffset) * 1.1 : 0;
  const lokitoJitterY = mood === 'lokito' ? Math.cos(time * 15 + phaseOffset) * 0.9 : 0;

  const stride = isWalking
    ? Math.sin(walkCycle) * (mood === 'cansancio' || mood === 'tristeza' ? 3.2 : 4.6)
    : isSwimming
      ? Math.sin(swimCycle * 1.4) * 2.4
      : 0;
  const bounce = isWalking
    ? Math.abs(Math.sin(walkCycle)) * (mood === 'felicidad' ? 1.8 : 1.15)
    : isSwimming
      ? Math.sin(t * 3.8) * 1.25
      : isInteracting && aiSpeaking
        ? Math.abs(Math.sin(interactCycle * 0.8)) * 0.9
        : 0;
  const swayAngle = isWalking
    ? Math.sin(walkCycle) * (mood === 'lokito' ? 0.16 : 0.085)
    : isInteracting
      ? Math.sin(interactCycle) * (aiSpeaking ? 0.14 : 0.1)
      : isSwimming
        ? Math.sin(swimCycle) * 0.16
        : Math.sin(t * 2) * 0.03;

  ctx.save();
  ctx.translate(x + lokitoJitterX, y - bounce + lokitoJitterY);
  ctx.scale(scale, scale);

  // Subtle Emotional Personality Aura & AI Dialogue Halo
  if (moodProfile.auraColor) {
    const auraR = 14 + Math.sin(time * 3.5 + phaseOffset) * 1.8;
    const auraGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, auraR);
    auraGrad.addColorStop(0, moodProfile.auraColor);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  if (aiSpeaking || aiThinking) {
    const pulseR = 15 + ((time * 16) % 10);
    const pulseAlpha = Math.max(0.12, 0.72 - ((time * 16) % 10) * 0.06);
    ctx.strokeStyle = aiThinking
      ? `rgba(251, 191, 36, ${pulseAlpha})`
      : `rgba(34, 211, 238, ${pulseAlpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = aiThinking ? 'rgba(251, 191, 36, 0.48)' : 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 14.5, time * 1.6, time * 1.6 + Math.PI * 1.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ground shadow & walking deck scuffs vs Water immersion ripples
  if (isSwimming) {
    const r1 = 12 + ((t * 10) % 9);
    const a1 = Math.max(0.08, 0.56 - ((t * 10) % 9) * 0.05);
    ctx.strokeStyle = `rgba(186, 230, 253, ${a1})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + ((t * 10 + 4.5) % 8), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(14, 165, 233, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 13.5, 10.5, angle, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.beginPath();
    ctx.ellipse(2.5, 4.2, 10.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isWalking) {
      // Subtle walking footstep dust/foam trail behind the NPC
      const stepFade = Math.abs(Math.cos(walkCycle));
      ctx.fillStyle = `rgba(226, 232, 240, ${0.14 + stepFade * 0.16})`;
      ctx.beginPath();
      ctx.arc(-Math.cos(angle) * 10, -Math.sin(angle) * 10 + 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.rotate(angle + swayAngle);

  // Legs / Boots (flutter-kicking when swimming, striding when walking, grounded when interacting)
  if (isSwimming) {
    const kickL = Math.sin(swimCycle * 1.7) * 2.8;
    const kickR = -kickL;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
    ctx.beginPath();
    ctx.ellipse(-9.5 + kickL * 0.45, -3.8, 4.8, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(-9.5 + kickR * 0.45, 3.8, 4.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wake foam bubbles
    ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
    ctx.beginPath();
    ctx.arc(-14 - ((t * 9) % 6), -3 + kickL * 0.35, 1.9, 0, Math.PI * 2);
    ctx.arc(-16 - ((t * 7) % 6), 3 + kickR * 0.35, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const footShift = isInteracting ? Math.sin(interactCycle * 0.5) * 0.9 : stride;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-2 + footShift, -5, 4.7, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(-2 - footShift, 5, 4.7, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms & Expressive State Motion
  if (isSwimming) {
    const strokeL = Math.sin(swimCycle);
    const strokeR = Math.sin(swimCycle + Math.PI);
    const lx = 2.5 + strokeL * 7.5;
    const ly = -9 - Math.cos(swimCycle) * 2.7;
    const rx = 2.5 + strokeR * 7.5;
    const ry = 9 + Math.cos(swimCycle) * 2.7;

    ctx.strokeStyle = coatColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(lx, ly);
    ctx.moveTo(0, 7);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();

    // Splash foam arcs around active crawl hands
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lx + 1, ly, 4.8, -0.75, 0.95);
    ctx.arc(rx + 1, ry, 4.8, -0.95, 0.75);
    ctx.stroke();
  } else {
    const gestureAmp = aiSpeaking ? 5.8 : 4.2;
    const armSwingL = isWalking
      ? -stride * 0.75
      : isInteracting
        ? Math.sin(interactCycle) * gestureAmp
        : Math.sin(t * 2) * 0.8;
    const armSwingR = isWalking
      ? stride * 0.75
      : isInteracting
        ? Math.cos(interactCycle) * gestureAmp + 3.2
        : -Math.sin(t * 2) * 0.8;

    ctx.strokeStyle = coatColor;
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -7.5);
    ctx.lineTo(5 + armSwingL, -9.5);
    ctx.moveTo(0, 7.5);
    ctx.lineTo(5 + armSwingR, 9.5);
    ctx.stroke();

    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(5.5 + armSwingL, -9.5, 3.1, 0, Math.PI * 2);
    ctx.arc(5.5 + armSwingR, 9.5, 3.1, 0, Math.PI * 2);
    ctx.fill();

    // Props / Tools
    if (prop === 'wrench') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(6 + armSwingR, 7.8, 9, 2.6);
      ctx.beginPath();
      ctx.arc(15 + armSwingR, 9.1, 4.2, 0.5, Math.PI * 2 - 0.5);
      ctx.fill();
      if (isInteracting && Math.sin(interactCycle * 2) > 0.35) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(18 + armSwingR, 5);
        ctx.lineTo(22 + armSwingR, 2);
        ctx.moveTo(19 + armSwingR, 11);
        ctx.lineTo(23 + armSwingR, 13);
        ctx.stroke();
      }
    } else if (prop === 'spyglass') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6 + armSwingR, 7.5, 13, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(16 + armSwingR, 7, 4, 4);
    } else if (prop === 'crate') {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.2;
      ctx.fillRect(6, -5.5, 9, 11);
      ctx.strokeRect(6, -5.5, 9, 11);
    } else if (prop === 'lantern') {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(9 + armSwingR, 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.24)';
      ctx.beginPath();
      ctx.arc(9 + armSwingR, 10, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop === 'cannon_ram') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(5 + armSwingR, 7, 15, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(18 + armSwingR, 7, 3, 4);
    } else if (prop === 'sword') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6 + armSwingR, 7.5, 14, 2.8);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6 + armSwingR, 6.2, 2.5, 5.4);
    } else if (prop === 'scroll') {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(7 + armSwingR, 6.5, 7, 5);
    } else if (prop === 'fish') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(12 + armSwingR * 0.5, 6, 5.5, 2.6, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Torso / Coat with Trim Collar & Mood Posture Lean
  const leanX = (isInteracting ? 1.5 : 0) + moodProfile.postureTilt * 8;
  ctx.fillStyle = coatColor;
  ctx.strokeStyle = aiSpeaking ? '#22d3ee' : '#0f172a';
  ctx.lineWidth = aiSpeaking ? 2.1 : 1.8;
  ctx.beginPath();
  ctx.ellipse(leanX, 0, isSwimming ? 6.5 : 7.5, isSwimming ? 9 : 10.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isSwimming) {
    ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.beginPath();
    ctx.ellipse(leanX - 1.5, 0, 5.5, 8.2, 0, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
  }

  // Coat trim / Sash
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(leanX + 1.5, 0, 6.4, -1.1, 1.1);
  ctx.stroke();

  // Head turning subtly with personality & dialogue
  const headTurn = isInteracting
    ? Math.sin(interactCycle * 0.85) * (aiSpeaking ? 0.24 : 0.17)
    : mood === 'lokito'
      ? Math.sin(time * 9 + phaseOffset) * 0.2
      : 0;
  ctx.save();
  ctx.translate(leanX + 1.4, 0);
  ctx.rotate(headTurn);

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(0, 0, 5.8, 0, Math.PI * 2);
  ctx.fill();

  // Expressive eyes & emotional brows
  const eyeR = mood === 'lokito' ? 1.25 : mood === 'cansancio' ? 0.72 : 0.92;
  ctx.fillStyle = moodProfile.eyeColor;
  ctx.beginPath();
  ctx.arc(3.4, -2, eyeR, 0, Math.PI * 2);
  ctx.arc(3.4, 2, mood === 'lokito' ? eyeR * 0.8 : eyeR, 0, Math.PI * 2);
  ctx.fill();

  if (mood !== 'equilibrio') {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(2.4, -3.4 - moodProfile.browSlope);
    ctx.lineTo(4.2, -1.2 + moodProfile.browSlope);
    ctx.moveTo(2.4, 3.4 + moodProfile.browSlope);
    ctx.lineTo(4.2, 1.2 - moodProfile.browSlope);
    ctx.stroke();
  }

  // Headwear / Hair
  if (hatStyle === 'tricorn') {
    ctx.fillStyle = hatColor;
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -7.5);
    ctx.lineTo(8, 0);
    ctx.lineTo(-5, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (hatStyle === 'straw') {
    ctx.fillStyle = hatColor;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-0.5, 0, 7.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(-0.5, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (hatStyle === 'cap') {
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(-0.5, 0, 5.6, Math.PI * 0.35, Math.PI * 1.65);
    ctx.fill();
    ctx.fillRect(1.5, -4, 4.5, 8);
  } else if (hatStyle === 'hood') {
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(-1, 0, 6.4, Math.PI * 0.3, Math.PI * 1.7);
    ctx.fill();
  } else if (hatStyle === 'bandana') {
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(-0.5, 0, 5.6, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();
    const tailWag = Math.sin(t * 7) * 1.8;
    ctx.strokeStyle = hatColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5.5, -1.5);
    ctx.lineTo(-9.5, -3 + tailWag);
    ctx.moveTo(-5.5, 1.5);
    ctx.lineTo(-9.5, 3 + tailWag);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-1.2, 0, 4.8, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();

  // Floating state / personality / AI dialogue indicator
  const bobI = Math.sin(time * 4 + phaseOffset) * 1.5;
  if (aiSpeaking || aiThinking) {
    // AI sound wave badge connecting canvas animation with active AI dialogue
    ctx.save();
    ctx.fillStyle = aiThinking ? 'rgba(120, 53, 15, 0.92)' : 'rgba(8, 47, 73, 0.92)';
    ctx.strokeStyle = aiThinking ? '#fbbf24' : '#22d3ee';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(7, -21 + bobI, 21, 11, 5);
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 7.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = aiThinking ? '#fde047' : '#67e8f9';
    ctx.fillText(aiThinking ? 'IA…' : 'IA💬', 17.5, -13 + bobI);
    ctx.restore();
  } else if (isInteracting) {
    if (interactMood === 'repair') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '800 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚒', 10, -14 + bobI);
    } else if (interactMood === 'trade') {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(9, -12 + bobI, 3.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (interactMood === 'cheer') {
      ctx.fillStyle = '#34d399';
      ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', 9, -13 + bobI);
    } else {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
      for (let d = 0; d < 3; d++) {
        ctx.beginPath();
        ctx.arc(6 + d * 3.5, -13 + Math.sin(t * 5 + d) * 1.2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (moodProfile.badgeText) {
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = moodProfile.badgeColor || '#f8fafc';
    ctx.fillText(moodProfile.badgeText, 11, -13 + bobI);
  }

  if (label) {
    ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = aiSpeaking ? '#67e8f9' : labelColor;
    ctx.fillText(label, 0, -18);
  }

  if (activityHint && aiSpeaking) {
    ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText(activityHint, 0, -28);
  }

  ctx.restore();
}

export function drawAnimatedNpc(ctx: CanvasRenderingContext2D, opts: AnimatedNpcOptions): void {
  renderNpcAnimationState(ctx, opts);
}

function drawCrewOnRaft(
  ctx: CanvasRenderingContext2D,
  raft: RaftEntity,
  state: PersistentState,
  time: number,
  player?: PlayerEntity,
  activeNpcChat?: ActiveNpcChatRenderInfo | null,
  npcLiveStates?: Record<string, NpcLiveVisualState>
): void {
  const activeCrew = state.survivors.filter((s) => s.unlocked);
  const halfSize = getRaftHalfSize(raft.level);
  const deckSpan = Math.min(halfSize * 0.45, 22 + (raft.level - 1) * 5);

  activeCrew.forEach((member, idx) => {
    const def = SURVIVORS_CATALOG.find((c) => c.id === member.id);
    if (!def) return;

    const live = npcLiveStates?.[member.id];
    const npcMood: NpcAttitudeMood =
      live?.mood || state.npcMoods?.[member.id]?.mood || 'equilibrio';
    const isChattingNow = activeNpcChat?.npcId === member.id;
    const isSpeakingAmbient = Boolean(live && live.speakingUntil > time);

    // Resolve animation state from active AI chat, live simulation state, or organic fallback cycle
    const cycle = (time * 0.45 + idx * 2.1) % 7;
    const isDiverEmergency = raft.damagedMode && idx === 0;
    const animState: NpcAnimState = isChattingNow
      ? 'interacting'
      : live?.animState
        ? live.animState
        : isDiverEmergency
          ? 'swimming'
          : cycle > 4.6
            ? 'interacting'
            : 'walking';

    const phase =
      time * (animState === 'interacting' ? 0.14 : 0.72 + idx * 0.14) + idx * 1.4;
    let sx: number;
    let sy: number;
    let facing: number;

    if (animState === 'swimming') {
      const orbitA = time * 0.9 + idx * 1.6;
      sx = raft.x + Math.cos(orbitA) * (halfSize + 15);
      sy = raft.y + Math.sin(orbitA) * (halfSize + 15);
      facing = orbitA + Math.PI * 0.5;
    } else {
      const ox = Math.cos(phase) * deckSpan;
      const oy = Math.sin(phase * 1.3) * (deckSpan * 0.65);
      sx = raft.x + ox;
      sy = raft.y + oy;
      if (isChattingNow && player) {
        facing = Math.atan2(player.y - sy, player.x - sx);
      } else {
        const vx = -Math.sin(phase) * deckSpan;
        const vy = Math.cos(phase * 1.3) * deckSpan * 0.9;
        facing = animState === 'interacting' ? Math.atan2(-oy, -ox) : Math.atan2(vy, vx);
      }
    }

    const hatStyle: AnimatedNpcOptions['hatStyle'] =
      member.id === 'vega' || member.id === 'morgana'
        ? 'tricorn'
        : member.id === 'nerea'
          ? 'hood'
          : member.id === 'pipo'
            ? 'cap'
            : 'bandana';

    const prop: AnimatedNpcOptions['prop'] =
      member.id === 'beto'
        ? 'wrench'
        : member.id === 'pipo'
          ? 'spyglass'
          : member.id === 'kiko'
            ? 'crate'
            : member.id === 'nerea'
              ? 'lantern'
              : member.id === 'morgana'
                ? 'cannon_ram'
                : 'sword';

    const interactMood: AnimatedNpcOptions['interactMood'] = isChattingNow || isSpeakingAmbient
      ? 'chat'
      : member.id === 'beto' || member.id === 'morgana'
        ? 'repair'
        : member.id === 'vega'
          ? 'cheer'
          : member.id === 'kiko'
            ? 'trade'
            : 'chat';

    const baseScale = member.id === 'morgana' ? 0.82 : member.id === 'pipo' ? 0.66 : 0.74;

    renderNpcAnimationState(ctx, {
      x: sx,
      y: sy,
      angle: facing,
      time,
      animState,
      scale: baseScale,
      coatColor: def.color,
      trimColor: member.id === 'vega' ? '#fde047' : '#fbbf24',
      hatStyle,
      hatColor: def.hatColor,
      prop,
      interactMood,
      mood: npcMood,
      aiSpeaking: isChattingNow
        ? Boolean(activeNpcChat?.aiMode)
        : Boolean(isSpeakingAmbient && live?.viaAi),
      aiThinking: Boolean(isChattingNow && activeNpcChat?.aiLoading),
      activityHint: isChattingNow ? live?.activityLabel : undefined,
      label: member.id === 'vega' ? 'Vice-Cap. Vega' : def.name.split(' ')[0],
      labelColor: '#f8fafc',
      phaseOffset: idx * 1.7,
    });
  });

  state.family.children.forEach((child, cIdx) => {
    const childPhase = (time * 0.6 + cIdx * 1.9) % 5;
    const cx = raft.x - 14 + cIdx * 16 + Math.cos(time * 1.4 + cIdx) * 6;
    const cy = raft.y + Math.sin(time * 2.2 + cIdx) * 5;
    renderNpcAnimationState(ctx, {
      x: cx,
      y: cy,
      angle: Math.sin(time * 1.4 + cIdx) >= 0 ? 0.3 : Math.PI - 0.3,
      time,
      animState: childPhase > 3.2 ? 'interacting' : 'walking',
      interactMood: 'cheer',
      mood: 'felicidad',
      scale: child.stage === 'bebé' ? 0.44 : child.stage === 'grumete' ? 0.54 : 0.62,
      coatColor: '#ec4899',
      trimColor: '#fbcfe8',
      hatStyle: child.stage === 'oficial' ? 'cap' : 'bandana',
      hatColor: '#f43f5e',
      label: child.name,
      labelColor: '#fbcfe8',
      phaseOffset: cIdx * 2.3,
    });
  });
}

function drawTopDownPlayer(
  ctx: CanvasRenderingContext2D,
  pl: PlayerEntity,
  state: PersistentState,
  time: number
): void {
  const weapon = WEAPON_MAP[state.hotbar[state.equippedSlot]] || WEAPON_MAP.lanza_madera;
  const isBlinking = pl.invT > 0 && Math.floor(pl.invT * 20) % 2 === 0;
  const moving = Math.hypot(pl.vx, pl.vy) > 12;
  const stride = moving ? Math.sin(pl.gaitPhase) : Math.sin(time * 2.5) * 0.12;
  const relicStats = getRelicTotals(state);
  const titleName = TITLE_MAP[state.activeTitleId]?.name;
  const clanTag = state.clan.founded ? `[${state.clan.tag}] ` : '';
  const isDonorSkin = Boolean(state.donorUnlocked && state.donorSkinEnabled);

  ctx.save();
  ctx.translate(pl.x, pl.y);
  ctx.scale(0.75, 0.75);
  if (isBlinking) ctx.globalAlpha = 0.5;

  if (isDonorSkin) {
    const donorAura = 24 + Math.sin(time * 4) * 2.5;
    const dGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, donorAura);
    dGrad.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
    dGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(0, 0, donorAura, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 19, time * 0.9, time * 0.9 + Math.PI * 1.4);
    ctx.stroke();
  }

  if (relicStats.hasSZS) {
    const aura = 25 + Math.sin(time * 5) * 3;
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, aura);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, aura, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.stealthTimer > 0) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (!pl.swimming) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(3, 4, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const ripple = 16 + Math.sin(time * 7) * 3;
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, ripple, 0, Math.PI * 2);
    ctx.stroke();

    if (moving) {
      ctx.fillStyle = 'rgba(224, 242, 254, 0.5)';
      ctx.beginPath();
      ctx.arc(
        -Math.cos(pl.angle) * 18,
        -Math.sin(pl.angle) * 18 + Math.sin(time * 12) * 3,
        2.8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  if (pl.dashT > 0) {
    ctx.fillStyle = 'rgba(114, 239, 221, 0.35)';
    ctx.beginPath();
    ctx.arc(-Math.cos(pl.angle) * 14, -Math.sin(pl.angle) * 14, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.rotate(pl.angle);

  if (pl.swimming) {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(-10 + stride * 4, -5, 8, 3.5, stride * 0.2, 0, Math.PI * 2);
    ctx.ellipse(-10 - stride * 4, 5, 8, 3.5, -stride * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-3 + stride * 7, -6, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(-3 - stride * 7, 6, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const thrust = pl.atkT > 0 ? 11 : 0;
  const armSwing = pl.swimming ? Math.sin(pl.gaitPhase * 1.4) * 8 : stride * 5;

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(4 - armSwing, -11, 3.4, 0, Math.PI * 2);
  ctx.arc(5 + armSwing * 0.6 + thrust * 0.5, 10, 3.4, 0, Math.PI * 2);
  ctx.fill();

  if (weapon.category === 'lanza') {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4 + thrust, 9);
    ctx.lineTo(27 + thrust, 9);
    ctx.stroke();
    ctx.fillStyle = weapon.rarity === 'legendario' ? '#fbbf24' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(33 + thrust, 9);
    ctx.lineTo(25 + thrust, 5);
    ctx.lineTo(25 + thrust, 13);
    ctx.closePath();
    ctx.fill();
  } else if (weapon.category === 'espada') {
    const swingAngle = pl.atkT > 0 ? -0.6 : 0;
    ctx.save();
    ctx.rotate(swingAngle);
    ctx.fillStyle = weapon.rarity === 'legendario' ? '#fbbf24' : '#e2e8f0';
    ctx.fillRect(6 + thrust * 0.6, 7, 21, 4);
    ctx.restore();
  } else if (weapon.category === 'arco') {
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(8, 0, 12, -1.1, 1.1);
    ctx.stroke();
  } else if (weapon.category === 'fuego') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 5, 16, 5);
    ctx.fillStyle = weapon.rarity === 'legendario' ? '#38bdf8' : '#fbbf24';
    ctx.fillRect(19, 5, 4, 5);
  } else if (weapon.category === 'bomba') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(12, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(14, 5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 9);
    ctx.lineTo(19 + thrust, 9);
    ctx.stroke();
  }

    ctx.save();
    ctx.rotate(stride * 0.14);
    // Shaded Naval Jacket & Shoulders + Belt (Exclusive Donor Admiral Skin vs Standard)
    ctx.fillStyle = isDonorSkin
      ? pl.swimming
        ? '#0e7490'
        : '#1e1b4b'
      : pl.swimming
        ? '#0284c7'
        : '#0f766e';
    ctx.strokeStyle = isDonorSkin ? '#fde047' : '#e2e8f0';
    ctx.lineWidth = isDonorSkin ? 2.4 : 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isDonorSkin) {
      // Golden epaulets & emerald sash
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3.5, -13, 7, 3.5);
      ctx.fillRect(-3.5, 9.5, 7, 3.5);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-4.5, -4, 3, 8);
    } else {
      // Coat lapels & leather belt
      ctx.fillStyle = pl.swimming ? '#0369a1' : '#115e59';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-4, -3, 2.5, 6);
    }
    ctx.restore();

    // Head + Hair/Captain Bandana + Exclusive Donor Gilded Tricorn
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(2, 0, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isDonorSkin ? '#22d3ee' : pl.swimming ? '#38bdf8' : '#0f172a';
    ctx.fillRect(4.5, -3.5, 3.5, 7);
    if (!pl.swimming) {
      if (isDonorSkin) {
        // Gilded Admiral Tricorn Hat + Emerald Gem
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-7, -9);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-7, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(-1, 0, 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, 0, 6.6, Math.PI * 0.55, Math.PI * 1.45);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-5, -4, 4, 8);
      }
    } else {
      ctx.strokeStyle = isDonorSkin ? '#fde047' : '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(4, -7);
      ctx.lineTo(-4, -10);
      ctx.stroke();
    }
    ctx.restore();

    if (titleName || clanTag) {
      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isDonorSkin ? '#fef08a' : '#fde047';
      ctx.fillText(`${isDonorSkin ? '★ ' : ''}${clanTag}${titleName || ''}`, 0, -20);
    }

    ctx.restore();
  }

function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity, time: number): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  const col = e.hitT > 0 ? '#ffffff' : e.color;
  const moveSwing = Math.sin(e.gaitPhase) * 4.5;
  const ang = Math.atan2(e.vy, e.vx);

  if (e.isBandit) {
    if (!e.onLand && !e.boardedRaft) {
      // Sailing on Pirate Boat
      ctx.save();
      ctx.rotate(ang);
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -e.radius);
      ctx.lineTo(moveSwing, -e.radius - 10);
      ctx.moveTo(0, e.radius);
      ctx.lineTo(moveSwing, e.radius + 10);
      ctx.stroke();

      ctx.fillStyle = e.isBoss ? '#450a0a' : '#451a03';
      ctx.strokeStyle = e.isBoss ? '#fbbf24' : '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(e.radius + 14, 0);
      ctx.quadraticCurveTo(0, e.radius + 5, -e.radius - 10, e.radius * 0.72);
      ctx.lineTo(-e.radius - 10, -e.radius * 0.72);
      ctx.quadraticCurveTo(0, -e.radius - 5, e.radius + 14, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = e.isBoss ? '#991b1b' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, -e.radius * 0.85);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, e.radius * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-2 + moveSwing, -5, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(-2 - moveSwing, 5, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.rotate(ang);
    // Shoulders & Pirate Coat
    ctx.fillStyle = col;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * 0.58, e.radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(2, 0, e.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();

    if (e.kind === 'bandit_gunner') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 4, 16, 3.8);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-6, -9);
      ctx.lineTo(9, 0);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();
    } else if (e.isThief) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(5, 5, 10, 2.5);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(2, -4, 3, 8);
    } else if (e.isBoss) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6, 8, 18, 4.5);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Feather plume on Boss tricorn
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-10, -4, 6, 3);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(5, 6, 13, 3);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (e.stolenBag) {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-9, -9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (e.stealProgress > 0 && !e.stolenBag) {
      const pct = Math.min(1, e.stealProgress / 3.0);
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();

      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.fillText(`Robando ${(3 - e.stealProgress).toFixed(1)}s`, 0, -e.radius - 20);
      ctx.restore();
    }
  } else if (e.kind === 'leviathan') {
    // Colossal Island-Sized Abyssal Leviathan (420px+ span)
    ctx.save();
    ctx.rotate(ang);

    // Massive ocean wake & abyssal pressure ring
    const wakeR = e.radius * 1.18 + Math.sin(time * 2.2) * 8;
    const wakeGrad = ctx.createRadialGradient(0, 0, e.radius * 0.4, 0, 0, wakeR);
    wakeGrad.addColorStop(0, 'rgba(8, 145, 178, 0.25)');
    wakeGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = wakeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, wakeR, 0, Math.PI * 2);
    ctx.fill();

    for (let seg = 6; seg >= 0; seg--) {
      const sx = -seg * (e.radius * 0.42);
      const sy = Math.sin(time * 2.4 + seg * 0.7) * 22;
      const sr = e.radius * (1 - seg * 0.11);
      ctx.fillStyle = e.hitT > 0 ? '#ffffff' : seg === 0 ? '#0c4a6e' : col;
      ctx.strokeStyle = e.provoked ? '#f43f5e' : '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Craggy island-like dorsal ridge plates
      ctx.fillStyle = e.provoked ? '#9f1239' : '#155e75';
      ctx.beginPath();
      ctx.moveTo(sx + sr * 0.2, sy - sr * 0.32);
      ctx.lineTo(sx - sr * 0.35, sy);
      ctx.lineTo(sx + sr * 0.2, sy + sr * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    // Colossal Abyssal Eyes & Maw
    ctx.fillStyle = e.provoked ? '#fb7185' : '#fef08a';
    ctx.beginPath();
    ctx.arc(e.radius * 0.56, -e.radius * 0.28, 13, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.56, e.radius * 0.28, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(e.radius * 0.59, -e.radius * 0.28, 5, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.59, e.radius * 0.28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.kind === 'shark') {
    // Realistic Top-Down Shark with Pectoral Fins, Gills & Tail Fin
    const tailWag = Math.sin(time * 10 + e.id) * 6;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = col;
    // Pectoral fins
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-4, -17);
    ctx.lineTo(-6, -5);
    ctx.moveTo(4, 5);
    ctx.lineTo(-4, 17);
    ctx.lineTo(-6, 5);
    ctx.fill();
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(e.radius + 11, 0);
    ctx.quadraticCurveTo(0, e.radius * 0.72, -e.radius - 2, 0);
    ctx.quadraticCurveTo(0, -e.radius * 0.72, e.radius + 11, 0);
    ctx.fill();
    ctx.stroke();
    // Gill slits & Dorsal fin
    ctx.strokeStyle = '#075985';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(4, -8);
    ctx.moveTo(6, 6);
    ctx.lineTo(4, 8);
    ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-6, -11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-e.radius, 0);
    ctx.lineTo(-e.radius - 14, -8 + tailWag);
    ctx.lineTo(-e.radius - 14, 8 + tailWag);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (e.kind === 'kraken') {
    ctx.fillStyle = col;
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 4.2;
    for (let t = 0; t < 8; t++) {
      const a = (t / 8) * Math.PI * 2 + time * 1.5;
      const wave = Math.sin(time * 5 + t) * 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.radius * 0.7, Math.sin(a) * e.radius * 0.7);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.25) * (e.radius + 11) + wave,
        Math.sin(a + 0.25) * (e.radius + 11),
        Math.cos(a + 0.4) * (e.radius + 19),
        Math.sin(a + 0.4) * (e.radius + 19)
      );
      ctx.stroke();
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-6, -4, 3.4, 0, Math.PI * 2);
    ctx.arc(6, -4, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'crab') {
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    for (let l = -1; l <= 1; l += 2) {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(l * 8, k * 5);
        ctx.lineTo(l * (e.radius + 7), k * 7 + moveSwing * k * 0.4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(-12, -11 + Math.sin(time * 8) * 2, 5.2, 0, Math.PI * 2);
    ctx.arc(12, -11 - Math.sin(time * 8) * 2, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius + 2, e.radius - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-4, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(4, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const pulse = 1 + Math.sin(time * 6 + e.id) * 0.14;
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.7)';
    ctx.lineWidth = 2;
    for (let t = 0; t < 5; t++) {
      const a = (t / 5) * Math.PI * 2 + time;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (e.radius + 8), Math.sin(a) * (e.radius + 8));
      ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const barW = e.isLeviathan ? 150 : e.isBoss ? 56 : 34;
  const barY = -e.radius - 14;
  ctx.fillStyle = 'rgba(4, 14, 23, 0.85)';
  ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, 6);
  ctx.fillStyle = e.isBandit ? '#fb7185' : e.isLeviathan ? '#22d3ee' : '#fbbf24';
  ctx.fillRect(-barW / 2, barY, barW * Math.max(0, e.hp / e.maxHp), 4);

  if (e.stolenBag) {
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('¡LADRÓN!', 0, barY - 5);
  } else if (e.isLeviathan) {
    ctx.font = '700 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = e.provoked ? '#fb7185' : '#67e8f9';
    ctx.fillText(
      e.swallowTargetIslandId
        ? '⚠ LEVIATÁN HAMBRIENTO (DEVORANDO ISLA)'
        : e.provoked
          ? '☠ LEVIATÁN ENFURECIDO (SOLO NUCLEAR)'
          : 'LEVIATÁN ABISAL · PACÍFICO (SOLO NUCLEAR)',
      0,
      barY - 6
    );
  } else if (e.isBoss) {
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fda4af';
    ctx.fillText(e.name, 0, barY - 5);
  }

  ctx.restore();
}

function drawDrop(ctx: CanvasRenderingContext2D, drop: FloatingDrop, time: number): void {
  const pulse = Math.sin(time * 4 + drop.bob) * 2.5;
  ctx.save();
  ctx.translate(drop.x, drop.y + pulse);

  ctx.fillStyle = `${drop.color}28`;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  const k = drop.resourceKey;
  if (k === 'mad') {
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-10, -4.5, 20, 9, 2);
    ctx.fill();
    ctx.stroke();
  } else if (k === 'cht') {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? 9 : 6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (k === 'agu') {
    ctx.fillStyle = '#0ea5e9';
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(9, 1, 0, 9);
    ctx.quadraticCurveTo(-9, 1, 0, -10);
    ctx.fill();
    ctx.stroke();
  } else if (k === 'pez') {
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(11, -5);
    ctx.lineTo(11, 5);
    ctx.closePath();
    ctx.fill();
  } else if (k === 'oro') {
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-8, -5, 16, 10, 2);
    ctx.fill();
    ctx.stroke();
  } else if (k === 'car') {
    ctx.fillStyle = '#1c1917';
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (k === 'hie') {
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-8, -4, 16, 8);
    ctx.strokeRect(-8, -4, 16, 8);
  } else if (k === 'tec') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.6;
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-3, -2, 6, 4);
  } else if (k === 'tit') {
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-9, 4);
    ctx.lineTo(-5, -5);
    ctx.lineTo(9, -5);
    ctx.lineTo(5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (k === 'cri') {
    ctx.fillStyle = '#c084fc';
    ctx.strokeStyle = '#f5d0fe';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (k === 'veg') {
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 1, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-2, 2, 3, 0, Math.PI * 2);
    ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = drop.color;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.font = '700 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(drop.label, 0, -14);
  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: ProjectileEntity, time: number): void {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(Math.atan2(proj.vy, proj.vx));

  if (proj.kind === 'nuke') {
    ctx.fillStyle = 'rgba(163, 230, 53, 0.35)';
    ctx.beginPath();
    ctx.arc(-8, 0, 12 + Math.sin(time * 24) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -4.5, 22, 9, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(8, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'bomb') {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7 + Math.sin(time * 18) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (proj.kind === 'arrow' || proj.kind === 'harpoon') {
    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(7, -3.5);
    ctx.lineTo(7, 3.5);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.roundRect(-6, -2.5, 12, 5, 2.5);
    ctx.fill();
  }

  ctx.restore();
}

function drawComicBubble(ctx: CanvasRenderingContext2D, c: ComicBubble): void {
  ctx.save();
  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  const metrics = ctx.measureText(c.text);
  const w = Math.min(265, metrics.width + 18);
  const h = 24;
  const bx = c.x - w / 2;
  const by = c.y - 38;

  ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 1.5));
  ctx.fillStyle = 'rgba(10, 26, 42, 0.94)';
  ctx.strokeStyle = c.color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(c.text, c.x, by + 16, w - 12);
  ctx.restore();
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  rc: TopDownRenderContext
): void {
  const mapSize = 98;
  const pad = 10;
  const mx = canvasWidth - mapSize - pad;
  const my = pad;
  const hasRadar = rc.state.craftedTech.includes('tech_radar');
  const scale = hasRadar ? 0.015 : 0.022;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 17, 28, 0.82)';
  ctx.strokeStyle = hasRadar ? '#22d3ee' : '#284f70';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(mx, my, mapSize, mapSize, 8);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(mx + 2, my + 2, mapSize - 4, mapSize - 4);
  ctx.clip();

  const cx = mx + mapSize / 2;
  const cy = my + mapSize / 2;

  for (const isl of rc.islands) {
    const dx = (isl.x - rc.player.x) * scale;
    const dy = (isl.y - rc.player.y) * scale;
    const rad = Math.max(3, isl.radius * scale);
    ctx.fillStyle =
      rc.state.hqIslandId === isl.id
        ? '#34d399'
        : isl.dangerous
          ? '#e11d48'
          : isl.discovered
            ? '#22c55e'
            : '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2);
    ctx.fill();
    if (isl.pirateRank) {
      ctx.strokeStyle = getPirateRankInfo(isl.pirateRank).color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  const activeMissionMini = rc.state.storyMissions.find(
    (m) => m.status === 'active' && typeof m.markerX === 'number' && typeof m.markerY === 'number'
  );
  if (
    activeMissionMini &&
    typeof activeMissionMini.markerX === 'number' &&
    typeof activeMissionMini.markerY === 'number'
  ) {
    const mdx = (activeMissionMini.markerX - rc.player.x) * scale;
    const mdy = (activeMissionMini.markerY - rc.player.y) * scale;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx + mdx, cy + mdy, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const e of rc.enemies) {
    const dx = (e.x - rc.player.x) * scale;
    const dy = (e.y - rc.player.y) * scale;
    ctx.fillStyle = e.bountyId
      ? '#facc15'
      : e.isLeviathan
        ? '#22d3ee'
        : e.isBandit
          ? '#fb7185'
          : '#f97316';
    if (e.isLeviathan) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, Math.max(5, e.radius * scale), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sz = e.bountyId ? 5 : 3;
      ctx.fillRect(cx + dx - sz / 2, cy + dy - sz / 2, sz, sz);
    }
  }

  if (rc.state.checkpoint) {
    const cpx = (rc.state.checkpoint.x - rc.player.x) * scale;
    const cpy = (rc.state.checkpoint.y - rc.player.y) * scale;
    ctx.fillStyle = '#34d399';
    ctx.fillRect(cx + cpx - 2, cy + cpy - 2, 4, 4);
  }

  const rdx = (rc.raft.x - rc.player.x) * scale;
  const rdy = (rc.raft.y - rc.player.y) * scale;
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(cx + rdx - 3, cy + rdy - 3, 6, 6);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
