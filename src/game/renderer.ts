import { getIslandCorralLimit, getRaftCorralLimit, getRaftHalfSize, getRelicTotals } from './constants';
import { SITUATIONAL_META } from './needsAndPsychology';
import { SURVIVORS_CATALOG } from './destinyTree';
import { ROMANCE_CANDIDATES, CROPS_CATALOG, TITLE_MAP } from './socialAndKingdoms';
import { WEAPON_MAP } from './weapons';
import { getIslandFactionControl, getPirateRankInfo, MYSTERY_MAP } from './worldGen';
import type {
  ActiveNpcChatRenderInfo,
  AnimalEntity,
  CaptiveAnimal,
  ComicBubble,
  CompoundWallSegment,
  EnemyEntity,
  ExplosionFx,
  FarmPlot,
  FloatingDrop,
  FloatingPopup,
  IntroCutsceneState,
  IslandEntity,
  IslandStructure,
  IslandUnit,
  NpcAnimState,
  NpcAttitudeMood,
  NpcLiveVisualState,
  PersistentState,
  PlayerEntity,
  ProjectileEntity,
  RaftEntity,
  RandomEventState,
  RescueBoatEntity,
  SlashFx,
  SplashFx,
  WeatherType,
  WorldNpcEntity,
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
  worldNpcs?: WorldNpcEntity[];
  nearbyWorldNpcId?: string | null;
  compoundWalls?: CompoundWallSegment[];
  rescueBoats?: RescueBoatEntity[];
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

  // Fortified compound perimeter walls & gates around villages and pirate camps
  if (rc.compoundWalls) {
    for (const wall of rc.compoundWalls) {
      if (wall.destroyed) continue;
      if (Math.abs(wall.x - camX) > width * 0.7 || Math.abs(wall.y - camY) > height * 0.7) continue;
      drawCompoundWall(ctx, wall, rc.islands, rc.state, time);
    }
  }

  for (const st of rc.state.islandStructures) {
    if (Math.abs(st.x - camX) > width * 0.7 || Math.abs(st.y - camY) > height * 0.7) continue;
    drawIslandStructure(ctx, st, rc.enemies, time, isDonorSkin);
  }

  // Natural Portón Forja del Alba landmark on the starter island (always on land, never open ocean)
  const starterIsl = rc.islands.find((i) => i.id === 'isl_1_0');
  if (starterIsl) {
    const gx = starterIsl.x - starterIsl.radius * 0.34;
    const gy = starterIsl.y + starterIsl.radius * 0.12;
    if (Math.abs(gx - camX) <= width * 0.75 && Math.abs(gy - camY) <= height * 0.75) {
      drawStarterForgeBarge(ctx, gx, gy, time);
    }
  }

  // Interactive World NPCs (Armeros, Forjadores, Mercaderes, Alquimistas, Cartógrafos, Chatarreros)
  if (rc.worldNpcs) {
    for (const wNpc of rc.worldNpcs) {
      if (Math.abs(wNpc.x - camX) > width * 0.7 || Math.abs(wNpc.y - camY) > height * 0.7) continue;
      drawWorldNpc(ctx, wNpc, time, rc.nearbyWorldNpcId === wNpc.id);
    }
  }

  // AoE Island Units (villagers, guards, patrol ships)
  for (const unit of rc.state.islandUnits || []) {
    if (Math.abs(unit.x - camX) > width * 0.7 || Math.abs(unit.y - camY) > height * 0.7) continue;
    drawIslandUnit(ctx, unit, time);
  }

  // Active Story Mission Event Scene & Distress Beacon
  const hideMissionMarkersForIntro =
    Boolean(rc.introCutscene?.active) && rc.introCutscene?.phase !== 'meet_vega';
  const activeMission = !hideMissionMarkersForIntro
    ? rc.state.storyMissions.find(
        (m) => m.status === 'active' && typeof m.markerX === 'number' && typeof m.markerY === 'number'
      )
    : undefined;
  if (activeMission && typeof activeMission.markerX === 'number' && typeof activeMission.markerY === 'number') {
    drawMissionEventScene(
      ctx,
      activeMission.markerX,
      activeMission.markerY,
      activeMission.eventKind || 'convoy_buoy',
      time
    );
  }

  // Saved Checkpoint Beacon on Island/World
  if (rc.state.checkpoint && rc.state.checkpoint.islandId) {
    const cp = rc.state.checkpoint;
    if (Math.abs(cp.x - camX) <= width * 0.65 && Math.abs(cp.y - camY) <= height * 0.65) {
      drawCheckpointBeacon(ctx, cp.x, cp.y, time);
    }
  }

  // Custom Player Waypoint Beacon (Magenta #e879f9)
  if (rc.state.customWaypoint) {
    const wp = rc.state.customWaypoint;
    if (Math.abs(wp.x - camX) <= width * 0.72 && Math.abs(wp.y - camY) <= height * 0.72) {
      const pulse = 22 + Math.sin(time * 5.2) * 5;
      ctx.save();
      ctx.translate(wp.x, wp.y);
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
      ctx.fillStyle = 'rgba(217, 70, 239, 0.16)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e879f9';
      ctx.strokeStyle = '#4a044e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(-8, -8);
      ctx.arc(0, -10, 8, Math.PI, 0);
      ctx.lineTo(0, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fdf4ff';
      ctx.beginPath();
      ctx.arc(0, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '800 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f5d0fe';
      ctx.fillText(`📍 ${wp.label}`, 0, -24);
      ctx.restore();
    }
  }

  // Island Farm Plots & Island Captive Pens
  for (const plot of rc.state.farmPlots) {
    if (plot.location !== 'island') continue;
    if (Math.abs(plot.x - camX) > width * 0.65 || Math.abs(plot.y - camY) > height * 0.65) continue;
    drawFarmPlot(ctx, plot, plot.x, plot.y, time);
  }

  // Children out on map expeditions (traveling along route)
  for (const child of rc.state.family.children) {
    const m = child.activeMission;
    if (!m) continue;
    const progress = m.totalSec > 0 ? 1 - Math.max(0, m.remainingSec) / m.totalSec : 0.5;
    const ex = rc.raft.x + (m.targetX - rc.raft.x) * progress;
    const ey = rc.raft.y + (m.targetY - rc.raft.y) * progress;
    if (Math.abs(ex - camX) <= width * 0.7 && Math.abs(ey - camY) <= height * 0.7) {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbcfe8';
      ctx.fillText(`⛵ ${child.name} → ${m.targetName}`, 0, -16);
      ctx.restore();
    }
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

  // 7. Parked Pirate Boats (from Boarding Pirates) & Rescue Lifeboats
  for (const enemy of rc.enemies) {
    if (enemy.parkedBoat) {
      drawParkedPirateBoat(ctx, enemy.parkedBoat.x, enemy.parkedBoat.y, enemy.parkedBoat.angle, enemy.isBoss, time);
    }
  }
  for (const boat of rc.rescueBoats || []) {
    drawRescueBoat(ctx, boat, time);
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

  // 9. Territorial Boss Zones + Skinned & Shaped Enemies + 3s Steal Timer Ring
  for (const enemy of rc.enemies) {
    if (
      typeof enemy.homeX === 'number' &&
      typeof enemy.homeY === 'number' &&
      typeof enemy.territoryRadius === 'number' &&
      !enemy.bountyId &&
      !enemy.storyMissionId
    ) {
      const distPlayerToZone = Math.hypot(rc.player.x - enemy.homeX, rc.player.y - enemy.homeY);
      if (distPlayerToZone <= enemy.territoryRadius + 460) {
        const inside = distPlayerToZone <= enemy.territoryRadius;
        ctx.save();
        ctx.strokeStyle = inside ? 'rgba(244, 63, 94, 0.45)' : 'rgba(251, 113, 133, 0.24)';
        ctx.fillStyle = inside ? 'rgba(244, 63, 94, 0.05)' : 'rgba(244, 63, 94, 0.02)';
        ctx.lineWidth = inside ? 2.4 : 1.6;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.arc(enemy.homeX, enemy.homeY, enemy.territoryRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }
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

  // Off-screen Custom Waypoint Directional Compass Arrow (Distinct Magenta #e879f9)
  if (rc.state.customWaypoint) {
    const wp = rc.state.customWaypoint;
    const dxW = wp.x - rc.player.x;
    const dyW = wp.y - rc.player.y;
    const distW = Math.hypot(dxW, dyW);
    if (distW > 125) {
      const angW = Math.atan2(dyW, dxW);
      const radW = Math.min(width, height) * 0.37;
      const wpx = width / 2 + Math.cos(angW) * radW;
      const wpy = height / 2 + Math.sin(angW) * radW;
      ctx.save();
      ctx.translate(wpx, wpy);
      ctx.save();
      ctx.rotate(angW);
      ctx.fillStyle = '#e879f9';
      ctx.strokeStyle = '#4a044e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.font = '800 10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f5d0fe';
      ctx.fillText(`📍 ${wp.label} (${Math.round(distW / 10)}m)`, 0, -15);
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
    zombie: { shore: '#9ca3af', wetSand: '#6b7280', inner: '#1e3a2f', innerHi: '#3f6212', ring: 'rgba(132, 204, 22, 0.28)' },
  }[isl.biome];

  const isHQ = state.hqIslandId === isl.id;

  ctx.save();
  ctx.translate(isl.x, isl.y);

  // Outer shallow surf & animated foam ring
  ctx.fillStyle = isl.isSafeZone
    ? 'rgba(16, 185, 129, 0.24)'
    : isHQ
      ? 'rgba(52, 211, 153, 0.28)'
      : palette.ring;
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

  ctx.strokeStyle = isl.isSafeZone
    ? 'rgba(110, 231, 183, 0.72)'
    : 'rgba(224, 242, 254, 0.38)';
  ctx.lineWidth = isl.isSafeZone ? 3.2 : 2.5;
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

  if (isl.isSafeZone) {
    ctx.save();
    ctx.strokeStyle = 'rgba(236, 253, 245, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, isl.radius + 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const hasActiveMarinaCheckpoint = isl.nodes.some(
    (n) => n.kind === 'marine_checkpoint' && !n.depleted
  );
  if (
    (isl.factionControl === 'marina_gov' || hasActiveMarinaCheckpoint) &&
    hasActiveMarinaCheckpoint
  ) {
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.65)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, isl.radius * 0.66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

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
  ctx.strokeStyle = isl.isSafeZone
    ? '#34d399'
    : isHQ
      ? '#34d399'
      : 'rgba(255,255,255,0.28)';
  ctx.lineWidth = isl.isSafeZone || isHQ ? 3.5 : 2;
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
    if (node.depleted && node.kind !== 'mystery_monolith') continue;
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
    } else if (node.kind === 'radio_tower') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-11, 16);
      ctx.lineTo(0, -24);
      ctx.lineTo(11, 16);
      ctx.moveTo(-7, 2);
      ctx.lineTo(7, 2);
      ctx.stroke();
      const waveR = 10 + ((time * 18) % 20);
      ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - waveR / 30)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -24, waveR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, -24, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('TORRE DE RADIO', 0, -34);
    } else if (node.kind === 'zombie_grave') {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#374151';
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-11, -14, 22, 24, [10, 10, 2, 2]);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(-1.5, -9, 3, 12);
      ctx.fillRect(-5, -5, 10, 2.5);
      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#bef264';
      ctx.fillText('☣ FOSA ZOMBI', 0, -20);
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
    } else if (node.kind === 'mystery_monolith') {
      const mDef = node.mysteryId ? MYSTERY_MAP[node.mysteryId] : undefined;
      const glowColor = mDef?.color || '#22d3ee';
      const active = !node.depleted;
      if (active) {
        const pulse = 0.55 + 0.45 * Math.sin(time * 3.8);
        ctx.fillStyle = `${glowColor}33`;
        ctx.beginPath();
        ctx.arc(0, 0, 24 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = active ? '#0f172a' : '#1e293b';
      ctx.strokeStyle = active ? glowColor : '#475569';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, 14);
      ctx.lineTo(-7, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(7, -18);
      ctx.lineTo(10, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Carved ancient glyph lines
      ctx.strokeStyle = active ? glowColor : '#64748b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(0, 7);
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, -5);
      ctx.moveTo(-4, 2);
      ctx.lineTo(4, 2);
      ctx.stroke();
      ctx.font = '800 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? glowColor : '#94a3b8';
      ctx.fillText(active ? `🗿 ${mDef?.shortTag || 'Misterio'}` : '🗿 Descifrado', 0, -30);
    } else if (node.kind === 'easter_egg') {
      const mDef = node.mysteryId ? MYSTERY_MAP[node.mysteryId] : undefined;
      const glowColor = mDef?.color || '#fde047';
      const pulse = 0.65 + 0.35 * Math.sin(time * 5.4);
      ctx.fillStyle = `${glowColor}40`;
      ctx.beginPath();
      ctx.arc(0, 0, 19 + pulse * 3, 0, Math.PI * 2);
      ctx.fill();
      // Pedestal + ornate egg/relic capsule
      ctx.fillStyle = '#422006';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-10, 4, 20, 8, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = glowColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -3, 8, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(-2, -6);
      ctx.lineTo(2, -1);
      ctx.lineTo(6, -4);
      ctx.stroke();
      ctx.font = '800 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`🥚 ${mDef?.shortTag || 'Secreto'}`, 0, -21);
    } else if (node.kind === 'marine_checkpoint') {
      // Puesto de Control de La Marina
      ctx.fillStyle = '#0f2942';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-24, -18, 48, 36, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-16, -10, 32, 20);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-16, -3, 32, 6);

      // Flagpole + Marina Flag
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, -34);
      ctx.stroke();
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(18, -28 + Math.sin(time * 5) * 1.8);
      ctx.lineTo(0, -22);
      ctx.closePath();
      ctx.fill();

      ctx.font = '800 9px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('⚓ PUESTO MARINA', 0, -38);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  const hasCulture = Boolean(isl.cultureName);
  const boxH = hasCulture ? 32 : 20;
  const boxY = isl.y - isl.radius - (hasCulture ? 38 : 28);
  ctx.fillStyle = 'rgba(5, 17, 28, 0.9)';
  ctx.fillRect(isl.x - 142, boxY, 284, boxH);
  if (hasCulture && isl.cultureColor) {
    ctx.strokeStyle = `${isl.cultureColor}66`;
    ctx.lineWidth = 1;
    ctx.strokeRect(isl.x - 142, boxY, 284, boxH);
  }
  const hasActiveMarina =
    isl.factionControl === 'marina_gov' ||
    isl.nodes.some((n) => n.kind === 'marine_checkpoint' && !n.depleted);
  ctx.font = '700 13px "Outfit", sans-serif';
  const rankCol = isl.pirateRank ? getPirateRankInfo(isl.pirateRank).color : '#fda4af';
  ctx.fillStyle = isl.isSafeZone
    ? '#34d399'
    : isHQ
      ? '#6ee7b7'
      : hasActiveMarina
        ? '#60a5fa'
        : isl.biome === 'zombie'
          ? '#a3e635'
          : isl.pirateRank
            ? rankCol
            : isl.dangerous
              ? '#fda4af'
              : isl.discovered
                ? '#fde68a'
                : '#7dd3fc';
  const moodTag =
    isl.discovered && isl.villagerPersonality === 'hostile'
      ? ' · ⚔ Hostil'
      : isl.discovered && isl.villagerPersonality === 'foolish'
        ? ' · 🤪 Mensos'
        : '';
  const tag = isl.isSafeZone
    ? `${isl.name} [🕊 ZONA SEGURA · PAZ]`
    : isHQ
      ? `${isl.name} [CUARTEL]`
      : hasActiveMarina
        ? `${isl.name} [⚓ MARINA / GOB]`
        : isl.biome === 'zombie'
          ? `${isl.name} [☣ ZOMBIS]`
          : isl.pirateRank
            ? `${isl.name} [🏴‍☠️ PIRATA ${isl.pirateRank}]`
            : isl.biome === 'pirata'
              ? `${isl.name} [🏴‍☠️ ISLA PIRATA]`
              : isl.dangerous
                ? `${isl.name} (Peligro${moodTag})`
                : `${isl.name}${moodTag}`;
  const mainY = hasCulture ? isl.y - isl.radius - 23 : isl.y - isl.radius - 13;
  ctx.fillText(isl.discovered ? tag : `${tag} ?`, isl.x, mainY);
  if (hasCulture) {
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.fillStyle = isl.cultureColor || '#93c5fd';
    ctx.fillText(
      `${isl.cultureEmblem || '🧭'} Cultura ${isl.cultureName}`,
      isl.x,
      isl.y - isl.radius - 10
    );
  }
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
      // South Doorway (Puerta única de entrada)
      ctx.fillStyle = '#071522';
      ctx.fillRect(-10, 12, 20, 9);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-12, 12, 3, 9);
      ctx.fillRect(9, 12, 3, 9);
      ctx.fillStyle = `rgba(251, 146, 60, ${0.55 + Math.sin(time * 8) * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 26, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 8px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('PUERTA', 0, 19);

      ctx.font = '700 10px "Outfit", sans-serif';
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
    ctx.fillStyle = '#071522';
    ctx.fillRect(-11, 17, 22, 10);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-13, 17, 3, 10);
    ctx.fillRect(10, 17, 3, 10);
    ctx.font = '700 8px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('PUERTA', 0, 25);
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText(isDonorSkin ? '★ CUARTEL MECENAS' : 'CUARTEL', 0, 38);
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

    // South Blast Door
    ctx.fillStyle = '#020617';
    ctx.fillRect(-11, 15, 22, 9);
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(-13, 15, 3, 9);
    ctx.fillRect(10, 15, 3, 9);
    ctx.font = '700 8px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bef264';
    ctx.fillText('PUERTA', 0, 23);

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

    // South Entrance Archway on Settlement (Pueblo / Reino / Imperio)
    const doorY = tier >= 3 ? 32 : tier === 2 ? 24 : 20;
    ctx.fillStyle = '#071522';
    ctx.fillRect(-12, doorY, 24, 10);
    ctx.fillStyle = bannerCol;
    ctx.fillRect(-14, doorY, 3, 10);
    ctx.fillRect(11, doorY, 3, 10);
    ctx.font = '700 8px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('PUERTA', 0, doorY + 8);

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
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, -3, 18, 6);
    ctx.restore();
  } else if (st.kind === 'wall') {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-22, -13, 44, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.fillRect(-18, -10, 10, 6);
    ctx.fillRect(-4, -10, 8, 6);
    ctx.fillRect(8, -10, 10, 6);
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`MURO Nv.${st.level}`, 0, -18);
  } else if (st.kind === 'house') {
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-16, -13, 32, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-19, -11);
    ctx.lineTo(0, -23);
    ctx.lineTo(19, -11);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('CASA', 0, -26);
  } else if (st.kind === 'mill') {
    ctx.fillStyle = '#57534e';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.rotate(time * 2.1);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.moveTo(0, -22);
    ctx.lineTo(0, 22);
    ctx.stroke();
    ctx.restore();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('MOLINO', 0, -24);
  } else if (st.kind === 'barracks') {
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-22, -18, 44, 36, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-14, -10, 28, 8);
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fda4af';
    ctx.fillText('CUARTEL MILITAR', 0, -23);
  } else if (st.kind === 'blacksmith') {
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-19, -15, 38, 30, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(251, 146, 60, ${0.65 + Math.sin(time * 7) * 0.25})`;
    ctx.beginPath();
    ctx.arc(-6, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(4, -5, 10, 10);
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fdba74';
    ctx.fillText('HERRERÍA', 0, -20);
  } else if (st.kind === 'watchtower') {
    ctx.save();
    ctx.rotate(time * 1.1);
    const beam = ctx.createLinearGradient(0, 0, 55, 0);
    beam.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    beam.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(55, -16);
    ctx.lineTo(55, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('ATALAYA', 0, -22);
  } else if (st.kind === 'market') {
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, -16, 44, 32, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-18, -12, 12, 10);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-6, -12, 12, 10);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(6, -12, 12, 10);
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('MERCADO', 0, -21);
  } else if (st.kind === 'patrol_dock') {
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -14, 48, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-14, -6, 28, 12);
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('ASTILLERO PATRULLA', 0, -20);
  } else if (st.kind === 'radio_antenna') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const rPulse = 16 + ((time * 24) % 24);
    ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - rPulse / 40)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, rPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('ANTENA RADIO', 0, -20);
  } else if (st.kind === 'distillery') {
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 28, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(-6, 0, 6, 0, Math.PI * 2);
    ctx.arc(7, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fcd34d';
    ctx.fillText('DESTILERÍA', 0, -20);
  } else if (st.kind === 'nuclear_lab') {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-24, -19, 48, 38, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(34, 211, 238, ${0.5 + Math.sin(time * 5) * 0.25})`;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('⚛ LAB. NUCLEAR', 0, -24);
  } else if (st.kind === 'nuclear_reactor') {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(163, 230, 53, ${0.65 + Math.sin(time * 7) * 0.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 8.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#bef264';
    ctx.fillText('☢ REACTOR NUCLEAR', 0, -28);
  } else if (st.kind === 'forge_gate') {
    drawStarterForgeBarge(ctx, 0, 0, time, st.customName || '⚒ PORTÓN FORJA DEL ALBA');
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.rotate(time * 2.4);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();
  }

  // Structure HP Bar if damaged
  if (typeof st.hp === 'number' && typeof st.maxHp === 'number' && st.maxHp > 0 && st.hp < st.maxHp) {
    const pct = Math.max(0, Math.min(1, st.hp / st.maxHp));
    ctx.fillStyle = 'rgba(4, 14, 23, 0.88)';
    ctx.fillRect(-20, 22, 40, 5);
    ctx.fillStyle = pct > 0.4 ? '#34d399' : '#fb7185';
    ctx.fillRect(-19, 23, 38 * pct, 3);
  }

  ctx.restore();
}

function drawCompoundWall(
  ctx: CanvasRenderingContext2D,
  wall: CompoundWallSegment,
  islands: IslandEntity[],
  state: PersistentState,
  time: number
): void {
  const isl = islands.find((i) => i.id === wall.islandId);
  const k = wall.kind === 'village' && isl?.kingdomId
    ? state.kingdoms.find((kg) => kg.id === isl.kingdomId)
    : undefined;
  const isPermissiveVillage =
    wall.kind === 'village' &&
    isl?.villagerPersonality !== 'hostile' &&
    !k?.atWar &&
    (k?.relation ?? 0) > -25;

  ctx.save();
  ctx.translate(wall.x, wall.y);
  ctx.rotate(wall.angle);

  if (wall.isGate && isPermissiveVillage) {
    // Open welcoming wooden/stone gate archway
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.fillRect(-wall.width / 2, -wall.height / 2, 8, wall.height);
    ctx.fillRect(wall.width / 2 - 8, -wall.height / 2, 8, wall.height);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(-wall.width / 2 + 8, 0);
    ctx.lineTo(wall.width / 2 - 8, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-wall.angle);
    ctx.font = '700 9px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('PUERTA ABIERTA', 0, -14);
  } else {
    // Solid heavily fortified wall or locked gate
    const isPirate = wall.kind === 'pirate_camp';
    ctx.fillStyle = wall.isGate ? '#1f2937' : isPirate ? '#450a0a' : '#475569';
    ctx.strokeStyle = wall.isGate
      ? '#fbbf24'
      : isPirate
        ? '#f43f5e'
        : isPermissiveVillage
          ? '#94a3b8'
          : '#fb7185';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-wall.width / 2, -wall.height / 2, wall.width, wall.height, 3);
    ctx.fill();
    ctx.stroke();

    // Battlement studs / spikes
    ctx.fillStyle = wall.isGate ? '#fbbf24' : '#cbd5e1';
    for (let sx = -wall.width / 2 + 5; sx <= wall.width / 2 - 5; sx += 9) {
      ctx.fillRect(sx - 1.5, -wall.height / 2 - 1.5, 3, 3);
    }

    if (wall.hp < wall.maxHp) {
      ctx.rotate(-wall.angle);
      const pct = Math.max(0, wall.hp / wall.maxHp);
      ctx.fillStyle = 'rgba(4, 14, 23, 0.9)';
      ctx.fillRect(-18, -15, 36, 5);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(-17, -14, 34 * pct, 3);
    } else if (wall.isGate && !isPermissiveVillage) {
      ctx.rotate(-wall.angle);
      const pulse = 0.75 + 0.25 * Math.sin(time * 4);
      ctx.font = '700 8.5px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(253, 164, 175, ${pulse})`;
      ctx.fillText('⚔ MURO SELLADO (ROMPER)', 0, -14);
    }
  }
  ctx.restore();
}

function drawStarterForgeBarge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  label = '⚒ PORTÓN FORJA DEL ALBA'
): void {
  ctx.save();
  ctx.translate(x, y);
  // Stone foundation pillars & archway on island ground
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.roundRect(-36, -24, 18, 42, 4);
  ctx.roundRect(18, -24, 18, 42, 4);
  ctx.fill();
  ctx.stroke();

  // Top lintel arch
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-40, -32, 80, 14, 5);
  ctx.fill();
  ctx.stroke();

  // Glowing dawnforge rune threshold inside gate
  const glow = 0.55 + Math.sin(time * 5) * 0.25;
  ctx.fillStyle = `rgba(251, 146, 60, ${glow * 0.45})`;
  ctx.fillRect(-18, -18, 36, 36);
  ctx.strokeStyle = `rgba(56, 248, 226, ${glow})`;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-14, -14, 28, 28);

  // Side anvil glow
  ctx.fillStyle = `rgba(251, 146, 60, ${glow})`;
  ctx.beginPath();
  ctx.arc(-27, -2, 5, 0, Math.PI * 2);
  ctx.arc(27, -2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '800 9px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(label, 0, -39);
  ctx.restore();
}

function drawWorldNpc(
  ctx: CanvasRenderingContext2D,
  npc: WorldNpcEntity,
  time: number,
  isNearby: boolean
): void {
  const badgeMap: Record<WorldNpcEntity['role'], string> = {
    armero: '⚒ Armero',
    forjador: '✧ Forjador',
    mercader: '⚖ Mercader',
    alquimista: '⚗ Alquimista',
    cartografo: '🧭 Cartógrafo',
    chatarrero: '⚙ Chatarrero',
  };
  ctx.save();
  if (isNearby) {
    const r = 24 + Math.sin(time * 6) * 3;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawAnimatedNpc(ctx, {
    x: npc.x,
    y: npc.y,
    angle: Math.PI * 0.5 + Math.sin(time * 0.8) * 0.25,
    time,
    animState: 'interacting',
    interactMood: npc.role === 'armero' || npc.role === 'forjador' ? 'repair' : 'trade',
    mood: 'equilibrio',
    scale: 0.84,
    coatColor: npc.color,
    trimColor: '#fde68a',
    hatStyle: npc.role === 'forjador' ? 'hood' : npc.role === 'cartografo' ? 'tricorn' : 'cap',
    hatColor: npc.hatColor,
    prop: npc.role === 'armero' || npc.role === 'forjador' ? 'wrench' : 'crate',
    label: `${npc.name} (${badgeMap[npc.role]})`,
    labelColor: isNearby ? '#fde047' : '#e0f2fe',
    phaseOffset: npc.x * 0.01,
  });
  if (isNearby) {
    ctx.font = '800 9.5px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('[G] / Tocar · Hablar y Forjar', npc.x, npc.y + 26);
  }
  ctx.restore();
}

function drawIslandUnit(
  ctx: CanvasRenderingContext2D,
  unit: IslandUnit,
  time: number
): void {
  ctx.save();
  ctx.translate(unit.x, unit.y);
  const ang = Math.atan2(unit.vy, unit.vx) || 0;
  if (unit.kind === 'patrol_ship') {
    ctx.rotate(ang);
    ctx.fillStyle = '#0c4a6e';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(0, 10, -14, 7);
    ctx.lineTo(-14, -7);
    ctx.quadraticCurveTo(0, -10, 16, 0);
    ctx.fill();
    ctx.stroke();
  } else {
    const isGuard = unit.kind === 'guard';
    const isFarmer = unit.kind === 'farmer';
    drawAnimatedNpc(ctx, {
      x: 0,
      y: 0,
      angle: ang,
      time,
      animState: Math.hypot(unit.vx, unit.vy) > 6 ? 'walking' : 'idle',
      scale: 0.66,
      coatColor: isGuard ? '#dc2626' : isFarmer ? '#10b981' : '#0284c7',
      trimColor: isGuard ? '#fde047' : isFarmer ? '#d1fae5' : '#bae6fd',
      hatStyle: isGuard ? 'cap' : 'straw',
      hatColor: isGuard ? '#7f1d1d' : isFarmer ? '#fde68a' : '#eab308',
      prop: isGuard ? 'sword' : isFarmer ? 'hoe' : 'crate',
      label: unit.role,
      labelColor: isGuard ? '#fecaca' : isFarmer ? '#6ee7b7' : '#bae6fd',
    });
  }
  ctx.restore();
}

function drawMissionEventScene(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  eventKind: string,
  time: number
): void {
  const pulse = 32 + Math.sin(time * 4.5) * 7;
  const colorMap: Record<string, { ring: string; core: string; label: string }> = {
    convoy_buoy: { ring: '#22d3ee', core: '#fbbf24', label: '📡 EVENTO: BOYA CONVOY' },
    pirate_blockade: { ring: '#f43f5e', core: '#fb7185', label: '☠ EVENTO: BLOQUEO PIRATA' },
    zombie_nest: { ring: '#84cc16', core: '#a3e635', label: '☣ EVENTO: NIDO ZOMBI' },
    hacker_relay: { ring: '#22d3ee', core: '#a78bfa', label: '⚡ EVENTO: NODO HACKER' },
    siege_village: { ring: '#f59e0b', core: '#fde047', label: '🛡 EVENTO: ASEDIO EN CURSO' },
    leviathan_lair: { ring: '#0ea5e9', core: '#67e8f9', label: '🐉 EVENTO: GUARIDA ABISAL' },
    wreck_field: { ring: '#fb923c', core: '#fed7aa', label: '⚓ EVENTO: PECIOS Y CARGA' },
  };
  const meta = colorMap[eventKind] || colorMap.convoy_buoy;

  ctx.save();
  ctx.translate(mx, my);
  ctx.strokeStyle = meta.ring;
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Event-specific floating debris / relay / buoys around marker
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + time * 0.45;
    const rx = Math.cos(a) * 24;
    const ry = Math.sin(a) * 24;
    ctx.fillStyle = eventKind === 'zombie_nest' ? '#365314' : '#451a03';
    ctx.strokeStyle = meta.core;
    ctx.lineWidth = 1.4;
    ctx.fillRect(rx - 5, ry - 4, 10, 8);
    ctx.strokeRect(rx - 5, ry - 4, 10, 8);
  }

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = meta.core;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = Math.sin(time * 6) > 0 ? meta.ring : meta.core;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '800 10px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = meta.core;
  ctx.fillText(meta.label, 0, -20);
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

function drawRescueBoat(
  ctx: CanvasRenderingContext2D,
  boat: RescueBoatEntity,
  time: number
): void {
  ctx.save();
  ctx.translate(boat.x, boat.y + Math.sin(time * 4) * 2.2);

  // Water wake behind boat
  ctx.save();
  ctx.rotate(boat.angle);
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.lineTo(-42 - (Math.sin(time * 8) + 1) * 6, -12);
  ctx.moveTo(-24, 4);
  ctx.lineTo(-42 - (Math.sin(time * 8) + 1) * 6, 12);
  ctx.stroke();

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(2, 5, 27, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // High-visibility Orange & White Rescue Lifeboat Hull
  ctx.fillStyle = '#ea580c';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.quadraticCurveTo(4, 18, -24, 13);
  ctx.lineTo(-24, -13);
  ctx.quadraticCurveTo(4, -18, 28, 0);
  ctx.fill();
  ctx.stroke();

  // Inner deck & orange lifebuoy ring on bow
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 17, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(15, 0, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  // Rescued NPCs / Villagers sitting aboard
  const maxShown = Math.min(6, boat.passengers.length);
  for (let i = 0; i < maxShown; i++) {
    const p = boat.passengers[i];
    const px = -12 + (i % 3) * 8;
    const py = i < 3 ? -4.5 : 4.5;
    ctx.fillStyle = p.color || '#38bdf8';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(px, py, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (p.hatColor) {
      ctx.fillStyle = p.hatColor;
      ctx.beginPath();
      ctx.arc(px, py - 1.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Label above rescue lifeboat
  ctx.font = '800 10px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(6, 21, 34, 0.86)';
  ctx.fillRect(-76, -34, 152, 16);
  ctx.fillStyle = '#fdba74';
  ctx.fillText(`🛟 Salvavidas (${boat.passengers.length}) → ${boat.targetIslandName}`, 0, -22);
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

  if (isWarship) {
    // LEVEL 7+ (Buque de Guerra Nuclear Moderno): Stealth titanium hull, reactor core, modern bridge & radar, VLS & hydro-jets!
    const hullLenBonus = 54 + Math.min(24, (lv - 7) * 8);
    const beam = halfSize + 10;

    // Deep water angular stealth shadow
    ctx.fillStyle = 'rgba(2, 10, 18, 0.56)';
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus + 6, 7);
    ctx.lineTo(halfSize * 0.45, beam + 6);
    ctx.lineTo(-halfSize * 0.65, beam + 2);
    ctx.lineTo(-halfSize - 18, halfSize * 0.72 + 6);
    ctx.lineTo(-halfSize - 18, -halfSize * 0.72 + 6);
    ctx.lineTo(-halfSize * 0.65, -beam + 2);
    ctx.lineTo(halfSize * 0.45, -beam + 2);
    ctx.closePath();
    ctx.fill();

    // Twin Hydro-Jet Stern Ion Plumes
    const thrustPulse = 14 + Math.sin(time * 22) * 4 + (Math.hypot(raft.vx, raft.vy) > 15 ? 12 : 0);
    for (const jy of [-halfSize * 0.34, halfSize * 0.34]) {
      const grad = ctx.createLinearGradient(-halfSize - 14, jy, -halfSize - 14 - thrustPulse, jy);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.85)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-halfSize - 14, jy - 6);
      ctx.lineTo(-halfSize - 14 - thrustPulse, jy);
      ctx.lineTo(-halfSize - 14, jy + 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-halfSize - 20, jy - 6, 8, 12);
      ctx.strokeRect(-halfSize - 20, jy - 6, 8, 12);
    }

    // Main Faceted Stealth Titanium Hull
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = state.raft.damagedMode
      ? '#ef4444'
      : state.warshipNuclearShield
        ? '#a3e635'
        : '#38bdf8';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus, 0);
    ctx.lineTo(halfSize * 0.45, beam);
    ctx.lineTo(-halfSize * 0.65, beam - 4);
    ctx.lineTo(-halfSize - 15, halfSize * 0.7);
    ctx.lineTo(-halfSize - 15, -halfSize * 0.7);
    ctx.lineTo(-halfSize * 0.65, -beam + 4);
    ctx.lineTo(halfSize * 0.45, -beam);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner Recessed Steel Combat Deck
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus - 16, 0);
    ctx.lineTo(halfSize * 0.38, beam - 11);
    ctx.lineTo(-halfSize * 0.6, beam - 14);
    ctx.lineTo(-halfSize - 6, halfSize * 0.56);
    ctx.lineTo(-halfSize - 6, -halfSize * 0.56);
    ctx.lineTo(-halfSize * 0.6, -beam + 14);
    ctx.lineTo(halfSize * 0.38, -beam + 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tactical Flight-Deck Seam Lines & Bow Runway Stripes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.2;
    for (let dx = -halfSize + 10; dx <= halfSize + 18; dx += 22) {
      ctx.beginPath();
      ctx.moveTo(dx, -beam + 16);
      ctx.lineTo(dx, beam - 16);
      ctx.stroke();
    }
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(halfSize * 0.25, 0);
    ctx.lineTo(halfSize + hullLenBonus - 28, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Forward VLS (Vertical Launch System) Missile Cells Array on Bow
    const vlsX = halfSize * 0.48;
    const missileLv = state.raft.missileLevel || 0;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = missileLv > 0 ? '#fb923c' : '#475569';
    ctx.lineWidth = 1.6;
    ctx.fillRect(vlsX, -18, 28, 36);
    ctx.strokeRect(vlsX, -18, 28, 36);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = missileLv > 0 && (r + c) % 2 === 0 ? '#f97316' : '#334155';
        ctx.fillRect(vlsX + 3 + r * 8, -14 + c * 8, 5, 5);
      }
    }

    // Bow Dual-Railgun Stabilizer Nose Tip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(halfSize + hullLenBonus - 18, -4, 18, 3);
    ctx.fillRect(halfSize + hullLenBonus - 18, 1, 18, 3);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(halfSize + hullLenBonus - 4, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Cherenkov Nuclear Reactor Core (Aft-Center)
    const coreX = -halfSize * 0.56;
    const corePulse = 0.72 + Math.sin(time * 5.2) * 0.28;
    const coreGrad = ctx.createRadialGradient(coreX, 0, 2, coreX, 0, 24);
    coreGrad.addColorStop(0, `rgba(163, 230, 53, ${0.85 * corePulse})`);
    coreGrad.addColorStop(0.55, `rgba(34, 211, 238, ${0.42 * corePulse})`);
    coreGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(coreX, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coreX, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(coreX, 0, 5.5 * corePulse + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Modern Stealth Superstructure & Armored Glass Bridge + Rotating Radar (Stern)
    const bridgeX = -halfSize - 6;
    const bridgeH = halfSize * 0.82;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bridgeX, -bridgeH / 2, 30, bridgeH, 5);
    ctx.fill();
    ctx.stroke();

    // Tinted Armored Glass Bridge Windows
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(bridgeX + 19, -bridgeH * 0.34, 7, bridgeH * 0.68);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(bridgeX + 21, -bridgeH * 0.28, 3, bridgeH * 0.56);

    // Spinning Tactical Phased-Array Radar Antenna on Bridge Roof
    ctx.save();
    ctx.translate(bridgeX + 10, 0);
    ctx.rotate(time * 2.4);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-10, -2.2, 20, 4.4);
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (isSloop) {
    // LEVEL 2 (Balandra Armada): Clear transition from square raft into a real pointed wooden boat!
    ctx.fillStyle = 'rgba(2, 10, 18, 0.45)';
    ctx.beginPath();
    ctx.moveTo(halfSize + 24, 5);
    ctx.quadraticCurveTo(halfSize * 0.35, halfSize + 6, -halfSize - 4, halfSize * 0.86 + 5);
    ctx.lineTo(-halfSize - 4, -halfSize * 0.86 + 5);
    ctx.quadraticCurveTo(halfSize * 0.35, -halfSize - 1, halfSize + 24, 5);
    ctx.fill();

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
    // LEVELS 3 -> 6 (Goleta -> Bergantín -> Fragata -> Navío Blindado)
    const hullLenBonus = isLiner ? 38 : isFrigate ? 34 : isBrig ? 30 : 26;

    ctx.fillStyle = 'rgba(2, 10, 18, 0.5)';
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus + 4, 6);
    ctx.quadraticCurveTo(halfSize * 0.25, halfSize + 10, -halfSize - 12, halfSize * 0.86 + 6);
    ctx.lineTo(-halfSize - 12, -halfSize * 0.86 + 6);
    ctx.quadraticCurveTo(halfSize * 0.25, -halfSize - 4, halfSize + hullLenBonus + 4, 6);
    ctx.fill();

    ctx.fillStyle = isLiner
      ? '#475569'
      : isFrigate
        ? '#6b3719'
        : isBrig
          ? '#7c451e'
          : '#8d5027';
    ctx.strokeStyle = state.raft.damagedMode
      ? '#ef4444'
      : isLiner
        ? '#e2e8f0'
        : isFrigate
          ? '#94a3b8'
          : isBrig
            ? '#f59e0b'
            : '#cbd5e1';
    ctx.lineWidth = isLiner ? 4 : isFrigate ? 3.5 : 3;
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus, 0);
    ctx.quadraticCurveTo(halfSize * 0.22, halfSize + 6, -halfSize - 12, halfSize * 0.84);
    ctx.lineTo(-halfSize - 12, -halfSize * 0.84);
    ctx.quadraticCurveTo(halfSize * 0.22, -halfSize - 6, halfSize + hullLenBonus, 0);
    ctx.fill();
    ctx.stroke();

    if (isFrigate) {
      ctx.strokeStyle = isLiner ? '#cbd5e1' : '#64748b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-halfSize + 10, -halfSize * 0.72);
      ctx.quadraticCurveTo(halfSize * 0.2, -halfSize * 0.85, halfSize + hullLenBonus - 16, -6);
      ctx.moveTo(-halfSize + 10, halfSize * 0.72);
      ctx.quadraticCurveTo(halfSize * 0.2, halfSize * 0.85, halfSize + hullLenBonus - 16, 6);
      ctx.stroke();
    }

    ctx.fillStyle = isLiner ? '#334155' : '#9c5e2f';
    ctx.beginPath();
    ctx.moveTo(halfSize + hullLenBonus - 14, 0);
    ctx.quadraticCurveTo(halfSize * 0.2, halfSize * 0.78, -halfSize - 2, halfSize * 0.72);
    ctx.lineTo(-halfSize - 2, -halfSize * 0.72);
    ctx.quadraticCurveTo(halfSize * 0.2, -halfSize * 0.78, halfSize + hullLenBonus - 14, 0);
    ctx.fill();

    ctx.strokeStyle = isLiner ? 'rgba(148, 163, 184, 0.35)' : 'rgba(40, 18, 5, 0.45)';
    ctx.lineWidth = 1.4;
    for (let py = -halfSize * 0.64; py <= halfSize * 0.64; py += 12) {
      ctx.beginPath();
      ctx.moveTo(-halfSize + 4, py);
      ctx.lineTo(halfSize + 2, py);
      ctx.stroke();
    }

    if (isBrig && !isLiner) {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(halfSize + hullLenBonus - 8, 0);
      ctx.lineTo(halfSize + hullLenBonus + 24, 0);
      ctx.stroke();
    }

    if (isLiner) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(halfSize + hullLenBonus + 2, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isFrigate) {
      const cannonXs = isLiner
        ? [-halfSize * 0.3, 0, halfSize * 0.3]
        : [-halfSize * 0.15, halfSize * 0.25];
      for (const cx of cannonXs) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 4, -halfSize * 0.84 - 5, 8, 9);
        ctx.fillRect(cx - 4, halfSize * 0.84 - 4, 8, 9);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 2.5, -halfSize * 0.84 - 6, 5, 2);
        ctx.fillRect(cx - 2.5, halfSize * 0.84 + 4, 5, 2);
      }
    }

    const roofW = isFrigate ? 28 : 24;
    const roofH = halfSize * 0.78;
    ctx.fillStyle = isLiner ? '#1e293b' : '#451a03';
    ctx.strokeStyle = isLiner ? '#38bdf8' : '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfSize - 6, -roofH / 2, roofW, roofH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isLiner ? '#475569' : '#78350f';
    ctx.fillRect(-halfSize, -roofH / 2 + 5, roofW - 12, roofH - 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-halfSize + 10, -7, 10, 14);

    if (!isLiner) {
      const sailXs = isBrig ? [-halfSize * 0.1, halfSize * 0.32] : [halfSize * 0.14];
      sailXs.forEach((sx) => {
        const span = halfSize * 0.66;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, -span - 4);
        ctx.lineTo(sx, span + 4);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = isFrigate ? '#fbbf24' : '#cbd5e1';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sx + 4, -span);
        ctx.quadraticCurveTo(sx + 18, 0, sx + 4, span);
        ctx.lineTo(sx - 3, span);
        ctx.quadraticCurveTo(sx + 10, 0, sx - 3, -span);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    }
  } else {
    // LEVEL 1 (Balsa de Náufrago): Detailed lashed timber raft WITH pre-upgrade canopy/roof!
    ctx.fillStyle = 'rgba(2, 10, 18, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-halfSize + 4, -halfSize + 4, halfSize * 2, halfSize * 2, 10);
    ctx.fill();

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

      ctx.fillStyle = 'rgba(69, 26, 3, 0.45)';
      ctx.beginPath();
      ctx.ellipse((i % 3 - 1) * 18, ly + logW * 0.5, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

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

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.2;
    for (const cx of [-halfSize + 10, halfSize - 14]) {
      for (const cy of [-halfSize + 10, halfSize - 14]) {
        ctx.strokeRect(cx, cy, 5, 5);
      }
    }

    const roofX = -halfSize + 10;
    const roofY = -halfSize + 10;
    const roofW = 28;
    const roofH = 22;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(roofX + 3, roofY + 4, roofW, roofH);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(roofX, roofY, 4, 4);
    ctx.fillRect(roofX + roofW - 4, roofY, 4, 4);
    ctx.fillRect(roofX, roofY + roofH - 4, 4, 4);
    ctx.fillRect(roofX + roofW - 4, roofY + roofH - 4, 4, 4);
    const donorCanopy = Boolean(state.donorUnlocked && state.donorSkinEnabled);
    ctx.fillStyle = donorCanopy ? '#047857' : '#d97706';
    ctx.strokeStyle = donorCanopy ? '#fde047' : '#fef3c7';
    ctx.lineWidth = donorCanopy ? 1.8 : 1.4;
    ctx.beginPath();
    ctx.roundRect(roofX, roofY, roofW, roofH, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = donorCanopy ? '#f59e0b' : '#b45309';
    ctx.fillRect(roofX + 5, roofY + 2, 5, roofH - 4);
    ctx.fillRect(roofX + 16, roofY + 2, 5, roofH - 4);
    ctx.strokeStyle = donorCanopy ? '#fef08a' : '#fde68a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(roofX, roofY + roofH / 2);
    ctx.lineTo(roofX + roofW, roofY + roofH / 2);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(roofX + roofW + 2, roofY + roofH - 2, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Storage Crate (center-aft)
  ctx.fillStyle = isWarship ? '#334155' : '#b45309';
  ctx.strokeStyle = isWarship ? '#38bdf8' : '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-halfSize * 0.25, -14, 15, 15);
  ctx.strokeRect(-halfSize * 0.25, -14, 15, 15);

  // Helm Wheel / Modern Bridge Console (Bow)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = isWarship ? '#22d3ee' : '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(halfSize - 18, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = isWarship ? '#22d3ee' : '#94a3b8';
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
  if (state.raft.engineLevel >= 1 && !isWarship) {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-halfSize - 10, -9, 10, 18);
    ctx.strokeRect(-halfSize - 10, -9, 10, 18);
  }
  if (state.shipRadioBuilt) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfSize * 0.45, -halfSize * 0.65);
    ctx.lineTo(-halfSize * 0.45, -halfSize * 0.65 - 14);
    ctx.stroke();
    ctx.fillStyle = Math.sin(time * 8) > 0 ? '#22d3ee' : '#fde047';
    ctx.beginPath();
    ctx.arc(-halfSize * 0.45, -halfSize * 0.65 - 15, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if ((state.raft.shieldLevel || 0) > 0) {
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.42 + Math.sin(time * 5) * 0.18})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.ellipse(0, 0, halfSize + (isWarship ? 34 : 18), halfSize + 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (state.warshipNuclearShield) {
    ctx.strokeStyle = `rgba(163, 230, 53, ${0.45 + Math.sin(time * 4) * 0.2})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, halfSize + (isWarship ? 42 : 24), halfSize + 16, 0, 0, Math.PI * 2);
    ctx.stroke();
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

  // Up to 8 Naval Turrets (Dual-Barrel Railguns on Modern Warship Lv.7+, Naval Cannons on Lv.1-6)
  if (state.raft.turretLevel > 0) {
    const nearest = enemies.find((e) => !e.isLeviathan) || enemies[0];
    const aimAngle = nearest ? Math.atan2(nearest.y - raft.y, nearest.x - raft.x) : raft.angle;
    const turCount = Math.min(8, state.raft.turretLevel);
    const cosR = Math.cos(raft.angle);
    const sinR = Math.sin(raft.angle);
    const hardpoints: Array<[number, number]> = [
      [halfSize * 0.42, -halfSize * 0.44],
      [halfSize * 0.42, halfSize * 0.44],
      [-halfSize * 0.15, -halfSize * 0.56],
      [-halfSize * 0.15, halfSize * 0.56],
      [halfSize * 0.72, 0],
      [-halfSize * 0.55, -halfSize * 0.5],
      [-halfSize * 0.55, halfSize * 0.5],
      [-halfSize * 0.75, 0],
    ];
    for (let i = 0; i < turCount; i++) {
      const [lx, ly] = hardpoints[i];
      const tx = raft.x + lx * cosR - ly * sinR;
      const ty = raft.y + lx * sinR + ly * cosR;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(aimAngle);
      ctx.fillStyle = isWarship ? '#1e293b' : '#334155';
      ctx.strokeStyle = isWarship ? '#22d3ee' : '#94a3b8';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, isWarship ? 8 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (isWarship) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(1, -3.4, 15, 2.2);
        ctx.fillRect(1, 1.2, 15, 2.2);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, -2.5, 14, 5);
      }
      ctx.restore();
    }
  }

  // Orbiting Defense Drones
  const droneCount = Math.min(3, state.raft.droneLevel || 0);
  if (droneCount > 0) {
    const orbitR = halfSize + (isWarship ? 48 : 30);
    for (let d = 0; d < droneCount; d++) {
      const da = time * 2.1 + (d * Math.PI * 2) / droneCount;
      const dx = raft.x + Math.cos(da) * orbitR;
      const dy = raft.y + Math.sin(da) * orbitR;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(time * 4);
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
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
  prop?: 'wrench' | 'spyglass' | 'crate' | 'lantern' | 'cannon_ram' | 'sword' | 'scroll' | 'fish' | 'hoe' | 'none';
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
    } else if (prop === 'hoe') {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4 + armSwingR, 7.5, 16, 2.2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(17 + armSwingR, 4, 2.5, 7);
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

    if (live?.foragingIsland && Number.isFinite(live.x) && Number.isFinite(live.y)) {
      sx = live.x;
      sy = live.y;
      facing = player ? Math.atan2(player.y - sy, player.x - sx) : Math.sin(time + idx);
    } else if (animState === 'swimming') {
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
      activityHint: isChattingNow || live?.foragingIsland ? live?.activityLabel : undefined,
      label: member.id === 'vega' ? 'Vice-Cap. Vega' : def.name.split(' ')[0],
      labelColor: live?.foragingIsland ? '#fde047' : '#f8fafc',
      phaseOffset: idx * 1.7,
    });
  });

  // Visible Spouse sprite on deck or HQ
  if (state.family.partnerId) {
    const partnerDef = ROMANCE_CANDIDATES.find((c) => c.id === state.family.partnerId);
    if (partnerDef) {
      const spAngle = time * 0.45 + 1.1;
      const sx = raft.x + Math.cos(spAngle) * (deckSpan * 0.75);
      const sy = raft.y + Math.sin(spAngle) * (deckSpan * 0.55);
      renderNpcAnimationState(ctx, {
        x: sx,
        y: sy,
        angle: spAngle + Math.PI * 0.4,
        time,
        animState: 'interacting',
        interactMood: 'cheer',
        mood: 'felicidad',
        scale: 0.72,
        coatColor: partnerDef.color,
        trimColor: '#fda4af',
        hatStyle: 'bandana',
        hatColor: '#f43f5e',
        label: `♥ ${partnerDef.name.split(' ')[0]}`,
        labelColor: '#fda4af',
        phaseOffset: 5.2,
      });
    }
  }

  state.family.children.forEach((child, cIdx) => {
    if (child.activeMission) return;
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

  const sitState = state.vitals?.situationalState || 'normal';
  const sitMeta = SITUATIONAL_META[sitState];
  if (sitState !== 'normal') {
    const pulseR = (sitState === 'berserker' ? 27 : 23) + Math.sin(time * (sitState === 'berserker' ? 9 : 6)) * 3.5;
    const sGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, pulseR);
    sGrad.addColorStop(0, `${sitMeta.color}55`);
    sGrad.addColorStop(1, `${sitMeta.color}00`);
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${sitMeta.color}aa`;
    ctx.lineWidth = sitState === 'berserker' ? 2.2 : 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 20, time * 2.2, time * 2.2 + Math.PI * 1.35);
    ctx.stroke();

    if (sitState === 'berserker') {
      for (let sp = 0; sp < 4; sp++) {
        const ang = time * 4 + sp * (Math.PI * 0.5);
        ctx.fillStyle = sp % 2 === 0 ? '#fb7185' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 22, Math.sin(ang) * 22, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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

    if (sitState !== 'normal') {
      ctx.font = '800 8.5px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = sitMeta.color;
      ctx.fillText(`${sitMeta.icon} ${sitMeta.shortLabel.toUpperCase()}`, 0, -30);
    }

    ctx.restore();
  }

function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity, time: number): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  const col = e.hitT > 0 ? '#ffffff' : e.color;
  const moveSwing = Math.sin(e.gaitPhase) * 4.5;
  const ang = Math.atan2(e.vy, e.vx);

  if (e.kind === 'marine_patrol' || e.kind === 'marine_captain' || e.kind === 'gov_agent') {
    const isGov = e.kind === 'gov_agent';
    const isCapt = e.kind === 'marine_captain';
    if (!e.onLand && !e.boardedRaft) {
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = isGov ? '#090d16' : '#f8fafc';
      ctx.strokeStyle = isGov ? '#fbbf24' : '#2563eb';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(e.radius + 16, 0);
      ctx.quadraticCurveTo(0, e.radius + 6, -e.radius - 12, e.radius * 0.76);
      ctx.lineTo(-e.radius - 12, -e.radius * 0.76);
      ctx.quadraticCurveTo(0, -e.radius - 6, e.radius + 16, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isGov ? '#1e293b' : '#3b82f6';
      ctx.fillRect(-4, -e.radius * 0.65, 8, e.radius * 1.3);
      ctx.restore();
    }
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = e.hitT > 0 ? '#ffffff' : isGov ? '#111827' : '#f8fafc';
    ctx.strokeStyle = isGov ? '#fbbf24' : '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * 0.62, e.radius * 0.84, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (isCapt || isGov) {
      ctx.fillStyle = isGov ? '#fbbf24' : '#facc15';
      ctx.fillRect(-3, -e.radius * 0.85, 6, 4);
      ctx.fillRect(-3, e.radius * 0.85 - 4, 6, 4);
    }
    ctx.fillStyle = isGov ? '#f8fafc' : '#1e3a8a';
    ctx.beginPath();
    ctx.arc(3, 0, e.radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.isBandit) {
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
  } else if (e.isLeviathan) {
    // 3-Stage Leviathans: baby (peaceful bioluminescent), adult (aggressive predator), elder (1080px+ primordial horror!)
    const stage = e.leviathanStage || (e.radius >= 600 ? 'elder' : e.radius >= 280 ? 'adult' : 'baby');
    ctx.save();
    ctx.rotate(ang);

    const wakeR = e.radius * 1.18 + Math.sin(time * 2.2) * (stage === 'elder' ? 18 : 8);
    const wakeGrad = ctx.createRadialGradient(0, 0, e.radius * 0.35, 0, 0, wakeR);
    wakeGrad.addColorStop(
      0,
      stage === 'elder'
        ? 'rgba(153, 27, 27, 0.32)'
        : stage === 'baby'
          ? 'rgba(56, 189, 248, 0.22)'
          : 'rgba(8, 145, 178, 0.26)'
    );
    wakeGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = wakeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, wakeR, 0, Math.PI * 2);
    ctx.fill();

    const segCount = stage === 'elder' ? 9 : stage === 'adult' ? 7 : 5;
    for (let seg = segCount - 1; seg >= 0; seg--) {
      const sx = -seg * (e.radius * 0.42);
      const sy = Math.sin(time * 2.4 + seg * 0.7) * (stage === 'elder' ? 42 : 18);
      const sr = e.radius * (1 - seg * (0.65 / segCount));
      ctx.fillStyle =
        e.hitT > 0
          ? '#ffffff'
          : seg === 0
            ? stage === 'elder'
              ? '#31102f'
              : stage === 'baby'
                ? '#0284c7'
                : '#0c4a6e'
            : col;
      ctx.strokeStyle = e.provoked
        ? '#f43f5e'
        : stage === 'elder'
          ? '#fb7185'
          : stage === 'baby'
            ? '#7dd3fc'
            : '#22d3ee';
      ctx.lineWidth = stage === 'elder' ? 7 : stage === 'baby' ? 2.5 : 4;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Elder primordial spines or adult dorsal plates
      if (stage !== 'baby') {
        ctx.fillStyle = e.provoked || stage === 'elder' ? '#9f1239' : '#155e75';
        ctx.beginPath();
        ctx.moveTo(sx + sr * 0.22, sy - sr * 0.36);
        ctx.lineTo(sx - sr * 0.45, sy);
        ctx.lineTo(sx + sr * 0.22, sy + sr * 0.36);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Abyssal Eyes (Gentle round eyes for baby vs fierce glowing slit eyes for adult/elder)
    const eyeR = stage === 'elder' ? 26 : stage === 'adult' ? 13 : 8;
    ctx.fillStyle = stage === 'baby' && !e.provoked ? '#e0f2fe' : stage === 'elder' ? '#f43f5e' : '#fef08a';
    ctx.beginPath();
    ctx.arc(e.radius * 0.56, -e.radius * 0.28, eyeR, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.56, e.radius * 0.28, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(e.radius * 0.59, -e.radius * 0.28, eyeR * 0.42, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.59, e.radius * 0.28, eyeR * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.isZombie) {
    // Mutated Plague Zombies (walker, brute, spitter)
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(132, 204, 22, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.strokeStyle = '#3f6212';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, e.radius * 0.72, e.radius * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Outstretched arms
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(4, -e.radius * 0.78, 12, 4);
    ctx.fillRect(4, e.radius * 0.78 - 4, 12, 4);
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.arc(e.radius * 0.35, -3.5, 2.4, 0, Math.PI * 2);
    ctx.arc(e.radius * 0.35, 3.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.isHacker) {
    // Cyber Corsairs & Jammers with glowing antenna dish & circuit boat
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(e.radius + 12, 0);
    ctx.lineTo(-e.radius, e.radius * 0.75);
    ctx.lineTo(-e.radius, -e.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = Math.sin(time * 16) > 0 ? '#a78bfa' : '#22d3ee';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-4, 0, e.radius + 6, -0.7, 0.7);
    ctx.stroke();
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
  } else if (e.kind.startsWith('abysmal_')) {
    // 11 Abyssal Semi-Bosses & Abyssal Bosses
    const abyssPulse = 1 + Math.sin(time * 5 + e.id) * 0.08;
    const isBoss = e.isBoss;
    const auraR = e.radius * (isBoss ? 1.55 : 1.32);
    const aGrad = ctx.createRadialGradient(0, 0, e.radius * 0.25, 0, 0, auraR);
    aGrad.addColorStop(0, isBoss ? 'rgba(192, 38, 211, 0.34)' : 'rgba(6, 182, 212, 0.28)');
    aGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = aGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.rotate(ang);
    if (e.kind === 'abysmal_eel') {
      // Serpentina eléctrica con arcos voltaicos
      for (let s = 4; s >= 0; s--) {
        const sx = -s * 12;
        const sy = Math.sin(time * 8 + s * 0.8 + e.id) * 9;
        const sr = e.radius * (1 - s * 0.14);
        ctx.fillStyle = e.hitT > 0 ? '#ffffff' : s === 0 ? '#0e7490' : '#083344';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(18, -4);
      ctx.lineTo(13, 6);
      ctx.stroke();
    } else if (e.kind === 'abysmal_knight' || e.kind === 'abysmal_warden') {
      // Caballero Coralino Ahogado / Centinela Óseo Abismal
      const isWarden = e.kind === 'abysmal_warden';
      ctx.fillStyle = col;
      ctx.strokeStyle = isWarden ? '#e2e8f0' : '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-e.radius * 0.72, -e.radius * 0.88, e.radius * 1.44, e.radius * 1.76, 8);
      ctx.fill();
      ctx.stroke();
      // Shoulder spikes / horn helm
      ctx.fillStyle = isWarden ? '#cbd5e1' : '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(2, -e.radius * 0.9);
      ctx.lineTo(14, -e.radius * 1.25);
      ctx.lineTo(-4, -e.radius * 0.55);
      ctx.moveTo(2, e.radius * 0.9);
      ctx.lineTo(14, e.radius * 1.25);
      ctx.lineTo(-4, e.radius * 0.55);
      ctx.fill();
      // Abyssal trident / glaive
      ctx.fillStyle = isWarden ? '#f8fafc' : '#22d3ee';
      ctx.fillRect(6, 7, e.radius + 14, 4);
      ctx.fillStyle = isWarden ? '#fb7185' : '#5eead4';
      ctx.beginPath();
      ctx.arc(4, -5, 3, 0, Math.PI * 2);
      ctx.arc(4, 5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_siren') {
      // Sirena de la Fosa Negra con halo sónico
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + Math.sin(time * 9) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 10 + (time * 18) % 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius * 0.85, e.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(-e.radius * 0.7, 0);
      ctx.lineTo(-e.radius - 14, -11);
      ctx.lineTo(-e.radius - 14, 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.arc(5, -4, 2.8, 0, Math.PI * 2);
      ctx.arc(5, 4, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_angler') {
      // Rape Abismal Devorador con señuelo bioluminiscente frontal
      ctx.fillStyle = col;
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius, e.radius * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Mandíbulas con colmillos
      ctx.fillStyle = '#f8fafc';
      for (let f = -2; f <= 2; f++) {
        ctx.beginPath();
        ctx.moveTo(e.radius * 0.65, f * 5 - 2);
        ctx.lineTo(e.radius + 8, f * 5);
        ctx.lineTo(e.radius * 0.65, f * 5 + 2);
        ctx.fill();
      }
      // Antena luminosa
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(e.radius * 0.8, -14, e.radius + 14, -4);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(e.radius + 15, -4, 5 * abyssPulse, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_golem') {
      // Coloso de Magma Submarino
      ctx.fillStyle = '#292524';
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = i % 2 === 0 ? e.radius : e.radius * 0.84;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.lineTo(12, 10);
      ctx.moveTo(-10, 12);
      ctx.lineTo(10, -12);
      ctx.stroke();
    } else if (e.kind === 'abysmal_empress') {
      // BOSS: Emperatriz Medusoide del Vacío
      for (let t = 0; t < 10; t++) {
        const a = (t / 10) * Math.PI * 2 + time * 1.1;
        ctx.strokeStyle = t % 2 === 0 ? '#e879f9' : '#22d3ee';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.3) * (e.radius + 14),
          Math.sin(a + 0.3) * (e.radius + 14),
          Math.cos(a - 0.15) * (e.radius + 26),
          Math.sin(a - 0.15) * (e.radius + 26)
        );
        ctx.stroke();
      }
      ctx.fillStyle = col;
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * abyssPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(6, 0, e.radius * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_behemoth') {
      // BOSS: Behemot Triturador de Quillas
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius * 1.08, e.radius * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Placas acorazadas y cuernos de ariete
      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.moveTo(e.radius * 0.65, -18);
      ctx.lineTo(e.radius + 20, -10);
      ctx.lineTo(e.radius * 0.65, -2);
      ctx.moveTo(e.radius * 0.65, 18);
      ctx.lineTo(e.radius + 20, 10);
      ctx.lineTo(e.radius * 0.65, 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(14, -10, 4.5, 0, Math.PI * 2);
      ctx.arc(14, 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_necromancer') {
      // BOSS: Archiliche de las Cenizas
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 10, time, time + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b0764';
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, -2, e.radius + 16, 4);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(e.radius + 22, 0, 6.5 * abyssPulse, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'abysmal_hydra') {
      // BOSS: Hidra de las Tres Fosas (3 cabezas serpentinas)
      for (const offset of [-18, 0, 18]) {
        const sway = Math.sin(time * 5 + offset) * 6;
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.quadraticCurveTo(e.radius * 0.45, offset + sway, e.radius + 10, offset);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = '#bef264';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.radius + 12, offset, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = col;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-4, 0, e.radius * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // BOSS FINAL ABISMAL: Soberano del Ojo Abisal
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 1.4;
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (e.radius + 10), Math.sin(a) * (e.radius + 10), 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius * abyssPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(2, 0, e.radius * 0.48, e.radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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

  // Crowd Control State Visual Overlays (Devil Fruit Ice Freeze / Shock Stun / Gravity Slow)
  if ((e.freezeTimer || 0) > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(103, 232, 249, 0.36)';
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.2;
      const rx = Math.cos(a) * (e.radius + 7);
      const ry = Math.sin(a) * (e.radius + 7);
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if ((e.slowTimer || 0) > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 9, time * 2, time * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if ((e.stunTimer || 0) > 0) {
    ctx.save();
    ctx.fillStyle = '#fde047';
    for (let s = 0; s < 3; s++) {
      const sa = time * 6 + (s * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * (e.radius * 0.75), -e.radius - 4 + Math.sin(sa) * 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const barW = e.isLeviathan ? (e.leviathanStage === 'elder' ? 240 : 140) : e.isBoss ? 72 : e.isSemiBoss ? 52 : 34;
  const barY = -e.radius - 14;
  ctx.fillStyle = 'rgba(4, 14, 23, 0.85)';
  ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, 6);
  ctx.fillStyle = e.kind.startsWith('abysmal_')
    ? e.isBoss
      ? '#e879f9'
      : '#22d3ee'
    : e.isBandit
      ? '#fb7185'
      : e.isZombie
        ? '#a3e635'
        : e.isHacker
          ? '#22d3ee'
          : e.isLeviathan
            ? e.leviathanStage === 'elder'
              ? '#f43f5e'
              : '#22d3ee'
            : '#fbbf24';
  ctx.fillRect(-barW / 2, barY, barW * Math.max(0, e.hp / e.maxHp), 4);

  if (e.stolenBag) {
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('¡LADRÓN!', 0, barY - 5);
  } else if (e.isLeviathan) {
    const stage = e.leviathanStage || (e.radius >= 600 ? 'elder' : e.radius >= 280 ? 'adult' : 'baby');
    ctx.font = stage === 'elder' ? '800 13px "Outfit", sans-serif' : '700 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = e.provoked || stage === 'elder' ? '#fb7185' : stage === 'baby' ? '#7dd3fc' : '#67e8f9';
    ctx.fillText(
      e.swallowTargetIslandId
        ? '⚠ LEVIATÁN DEVORANDO ISLA'
        : stage === 'elder'
          ? '☠ HORROR ANCIANO ABISAL (BUQUE NUCLEAR REQUERIDO)'
          : stage === 'baby' && !e.provoked
            ? 'LEVIATÁN CRÍA · PACÍFICO'
            : e.provoked
              ? '☠ LEVIATÁN ADULTO ENFURECIDO'
              : 'LEVIATÁN ADULTO · HOSTIL',
      0,
      barY - 6
    );
  } else if (
    e.isBoss ||
    e.isSemiBoss ||
    e.isHacker ||
    e.kind === 'marine_patrol' ||
    e.kind === 'marine_captain' ||
    e.kind === 'gov_agent'
  ) {
    ctx.font = e.isBoss ? '800 11px "Outfit", sans-serif' : '700 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle =
      e.kind === 'gov_agent'
        ? '#fde68a'
        : e.kind === 'marine_patrol' || e.kind === 'marine_captain'
          ? '#93c5fd'
          : e.kind.startsWith('abysmal_')
            ? e.isBoss
              ? '#f0abfc'
              : '#67e8f9'
            : e.isHacker
              ? '#67e8f9'
              : '#fda4af';
    ctx.fillText(
      e.kind.startsWith('abysmal_')
        ? `${e.isBoss ? '☠ BOSS ABISMAL' : '◆ SEMI-BOSS'} · ${e.name}`
        : e.name,
      0,
      barY - 5
    );
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
  } else if (drop.kind === 'devil_fruit') {
    const dfKind = drop.devilFruitKind || 'onda';
    const auraColor =
      dfKind === 'hielo'
        ? 'rgba(56, 189, 248, 0.72)'
        : dfKind === 'gravedad'
          ? 'rgba(168, 85, 247, 0.75)'
          : 'rgba(251, 146, 60, 0.75)';
    const bodyColor =
      dfKind === 'hielo' ? '#0ea5e9' : dfKind === 'gravedad' ? '#7e22ce' : '#ea580c';
    const rimColor =
      dfKind === 'hielo' ? '#e0f2fe' : dfKind === 'gravedad' ? '#f5d0fe' : '#fde047';

    const auraR = 16 + Math.sin(time * 7) * 3;
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, auraR);
    grad.addColorStop(0, auraColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 1, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (dfKind === 'hielo') {
      ctx.moveTo(-4, 1);
      ctx.lineTo(4, 1);
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 5);
    } else {
      ctx.arc(0, 1, 4.5, 0.2, Math.PI * 1.65);
    }
    ctx.stroke();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(4, -12, 7, -10);
    ctx.stroke();
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
  ctx.fillStyle = drop.kind === 'devil_fruit' ? '#f5d0fe' : '#f8fafc';
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
  } else if (proj.kind === 'missile') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(-9, 0, 3.5 + Math.sin(time * 28) * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-7, -3, 15, 6, 2);
    ctx.fill();
    ctx.stroke();
  } else if (proj.kind === 'magic') {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 10 + Math.sin(time * 20) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
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
    const rad = Math.max(3.5, isl.radius * scale);
    const control = getIslandFactionControl(isl);
    ctx.fillStyle =
      rc.state.hqIslandId === isl.id
        ? '#34d399'
        : control === 'neutral_safe'
          ? '#10b981'
          : control === 'marina_gov'
            ? '#2563eb'
            : control === 'pirate' || isl.dangerous
              ? '#e11d48'
              : isl.discovered
                ? '#84cc16'
                : '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2);
    ctx.fill();
    if (control === 'neutral_safe') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + dx - 2.2, cy + dy);
      ctx.lineTo(cx + dx + 2.2, cy + dy);
      ctx.moveTo(cx + dx, cy + dy - 2.2);
      ctx.lineTo(cx + dx, cy + dy + 2.2);
      ctx.stroke();
    } else if (control === 'marina_gov') {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    } else if (isl.pirateRank) {
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

  for (const boat of rc.rescueBoats || []) {
    const bdx = (boat.x - rc.player.x) * scale;
    const bdy = (boat.y - rc.player.y) * scale;
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + bdx, cy + bdy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
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

  if (rc.state.customWaypoint) {
    const wdx = (rc.state.customWaypoint.x - rc.player.x) * scale;
    const wdy = (rc.state.customWaypoint.y - rc.player.y) * scale;
    const maxOffset = mapSize / 2 - 7;
    const mag = Math.hypot(wdx, wdy);
    const px = cx + (mag > maxOffset ? (wdx / mag) * maxOffset : wdx);
    const py = cy + (mag > maxOffset ? (wdy / mag) * maxOffset : wdy);
    ctx.fillStyle = '#e879f9';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py - 5);
    ctx.lineTo(px + 4, py);
    ctx.lineTo(px, py + 5);
    ctx.lineTo(px - 4, py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
