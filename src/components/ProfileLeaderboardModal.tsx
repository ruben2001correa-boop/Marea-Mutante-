import {
  Anchor,
  Award,
  BookOpen,
  Check,
  Compass,
  Copy,
  Crown,
  Eye,
  Flame,
  Globe,
  Heart,
  RefreshCw,
  Search,
  Sparkles,
  Swords,
  Trophy,
  UploadCloud,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { computeSurvivalScore } from '../game/constants';
import { COUNTRY_OPTIONS } from '../game/socialAndKingdoms';
import type { LeaderboardEntry, PersistentState } from '../game/types';
import { CustomSelect } from './CustomSelect';
import { BRE_B_KEY, GAME_CREATOR_NAME } from './DonationModal';
import { PullToRefresh } from './PullToRefresh';

interface ProfileLeaderboardModalProps {
  open: boolean;
  state: PersistentState;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  isOnline: boolean;
  lastSyncedAt: number | null;
  pendingSync: boolean;
  onClose: () => void;
  onSaveProfile: (name: string, country: string) => void;
  onRefreshLeaderboard: () => Promise<void> | void;
  onOpenCredits?: () => void;
}

function formatAgo(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  return `hace ${Math.floor(hr / 24)}d`;
}

function getFlameClass(flameTier?: number): string {
  if (!flameTier || flameTier <= 0) return 'text-slate-100';
  if (flameTier === 1) return 'name-flame-tier-1';
  if (flameTier === 2) return 'name-flame-tier-2';
  return 'name-flame-tier-3';
}

export function ProfileLeaderboardModal({
  open,
  state,
  leaderboard,
  loading,
  isOnline,
  lastSyncedAt,
  pendingSync,
  onClose,
  onSaveProfile,
  onRefreshLeaderboard,
  onOpenCredits,
}: ProfileLeaderboardModalProps) {
  const [nameInput, setNameInput] = useState(state.playerProfile.name);
  const [countryInput, setCountryInput] = useState(state.playerProfile.country);
  const [onlyActive, setOnlyActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeView, setActiveView] = useState<'profile' | 'credits'>('profile');
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  const prevOpenRef = useRef(false);

  // Sync inputs ONLY when modal transitions from closed -> open so typing or picking a country is NEVER wiped
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setNameInput(state.playerProfile.name);
      setCountryInput(state.playerProfile.country);
      setActiveView('profile');
      setSavedToast(false);
      void onRefreshLeaderboard();
    }
    prevOpenRef.current = open;
  }, [open, state.playerProfile.name, state.playerProfile.country, onRefreshLeaderboard]);

  const currentScore = computeSurvivalScore(state);
  const maxScore = Math.max(state.playerProfile.maxScore, currentScore);

  const myIndex = useMemo(
    () => leaderboard.findIndex((p) => p.id === state.playerProfile.id),
    [leaderboard, state.playerProfile.id]
  );
  const abovePlayer = myIndex > 0 ? leaderboard[myIndex - 1] : null;
  const ptsToClimb = abovePlayer ? Math.max(1, abovePlayer.maxScore - maxScore + 1) : 0;

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return leaderboard.filter((entry) => {
      if (onlyActive && !entry.activeNow) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.country.toLowerCase().includes(q) ||
        entry.clanTag.toLowerCase().includes(q) ||
        (entry.titleName || '').toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, onlyActive, searchTerm]);

  const inspectedEntry = useMemo(
    () => leaderboard.find((p) => p.id === inspectedId) || null,
    [leaderboard, inspectedId]
  );

  if (!open) return null;

  const activeCount = leaderboard.filter((p) => p.activeNow).length;
  const top3 = leaderboard.slice(0, 3);

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(state.playerProfile.id).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleSaveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = nameInput.trim().slice(0, 22) || 'Capitán Náufrago';
    const cleanCountry = countryInput || 'CO';
    setNameInput(cleanName);
    onSaveProfile(cleanName, cleanCountry);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2600);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-5xl max-h-[92dvh] rounded-2xl bg-[#071625] border border-[#254b6e] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#0a1e30] border-b border-[#1b3c58]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                  Perfil Gamer y Clasificación Mundial
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                    isOnline
                      ? pendingSync
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                        : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>
                    {isOnline
                      ? pendingSync
                        ? 'Sincronizando...'
                        : lastSyncedAt
                          ? `Al día (${formatAgo(lastSyncedAt)})`
                          : 'Conectado'
                      : 'Sin internet'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono-num truncate">
                ID: {state.playerProfile.id} · Récord: {maxScore.toLocaleString()} pts
                {myIndex >= 0 ? ` · Puesto #${myIndex + 1} de ${leaderboard.length}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-[#06131f] border border-[#1d3e5d] p-1">
              <button
                type="button"
                onClick={() => setActiveView('profile')}
                className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeView === 'profile'
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Perfil y Ranking
              </button>
              <button
                type="button"
                onClick={() => setActiveView('credits')}
                className={`min-h-[38px] inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeView === 'credits'
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-400/50'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Créditos</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
              aria-label="Cerrar perfil y clasificación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeView === 'credits' ? (
          <div className="flex-1 overflow-y-auto deck-scroll p-4 sm:p-6 space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-[#0e2740] via-[#0a1d30] to-[#081624] border border-amber-400/60 p-5 text-center shadow-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-400/15 border border-amber-400/45 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autor y Creador del Juego</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300">
                {GAME_CREATOR_NAME}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-xl mx-auto leading-relaxed">
                Obra original creada por <b className="text-amber-200">{GAME_CREATOR_NAME}</b>:
                narrativa de <span className="text-sky-300 font-semibold">El Océano de las Cenizas Saladas</span>,
                construcción imperial AoE, buques de guerra nucleares, fragmentos divinos y combates contra
                piratas y leviatanes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <BookOpen className="w-4 h-4" />
                  <span>Historia y Guion</span>
                </div>
                <div className="text-xs font-bold text-slate-100">{GAME_CREATOR_NAME}</div>
                <p className="text-[11px] text-slate-400">
                  Cinemática de inicio nadando a la deriva, encuentro con la Vice-Capitana Vega, misiones morales y diálogos vivos.
                </p>
              </div>
              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Compass className="w-4 h-4" />
                  <span>Diseño y Programación</span>
                </div>
                <div className="text-xs font-bold text-slate-100">{GAME_CREATOR_NAME}</div>
                <p className="text-[11px] text-slate-400">
                  Construcción de pueblos/imperios, buque nuclear, forja con NPCs especializados y donaciones Bre-B ({BRE_B_KEY}).
                </p>
              </div>
            </div>

            {onOpenCredits && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCredits();
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Abrir Pantalla Completa de Créditos
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto deck-scroll p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Player Profile & Motivation Card */}
            <div className="lg:col-span-5 space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-[#102b44] to-[#081928] border border-amber-400/55 p-3.5 space-y-2 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                    <Crown className="w-4 h-4" />
                    <span>
                      {myIndex >= 0
                        ? `Tu Puesto Mundial: #${myIndex + 1}`
                        : 'Clasifícate en el Ranking Mundial'}
                    </span>
                  </span>
                  <span className="font-mono-num text-[11px] font-bold text-sky-300">
                    {maxScore.toLocaleString()} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">
                  {myIndex === 0
                    ? '¡Eres el #1 del océano! Tus hazañas encienden las llamas máximas de tu nombre.'
                    : abovePlayer
                      ? `Te faltan ${ptsToClimb.toLocaleString()} pts para superar a ${abovePlayer.name} (#${myIndex}).`
                      : 'Guarda tu Nombre Gamer y País para inscribirte y subir puestos en el ranking mundial.'}
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSaveSubmit()}
                  className="w-full min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{loading ? 'Sincronizando...' : 'Clasificarme Ahora con Mi Nombre'}</span>
                </button>
              </div>

              <form
                onSubmit={handleSaveSubmit}
                className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <User className="w-4 h-4" />
                    <span>Identidad Gamer del Sobreviviente</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#071522] border border-[#24496b] text-[10px] font-mono-num text-sky-300 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{state.playerProfile.id}</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Nombre Gamer
                  </label>
                  <input
                    type="text"
                    maxLength={22}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Ej. ElCorsarioX"
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-sky-300" />
                    <span>País / Bandera</span>
                  </label>
                  <CustomSelect
                    value={countryInput}
                    ariaLabel="Seleccionar país"
                    onChange={(val) => setCountryInput(val)}
                    options={COUNTRY_OPTIONS.map((c) => ({
                      value: c.code,
                      label: `${c.code} — ${c.name}`,
                    }))}
                  />
                </div>

                {savedToast && (
                  <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/50 px-3 py-2 text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Perfil gamer guardado y enviado a la clasificación.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  Guardar Nombre Gamer y Sincronizar
                </button>
              </form>

              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#071522] border border-[#18344d] p-2">
                  <div className="text-[10px] text-slate-400">Puntuación Actual</div>
                  <div className="font-mono-num text-sm font-extrabold text-sky-300 mt-0.5">
                    {currentScore.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-[#071522] border border-[#18344d] p-2">
                  <div className="text-[10px] text-slate-400">Máx. Sobrevivir</div>
                  <div className="font-mono-num text-sm font-extrabold text-amber-300 mt-0.5">
                    {maxScore.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-[#071522] border border-[#18344d] p-2">
                  <div className="text-[10px] text-slate-400">Logros / Títulos</div>
                  <div className="font-mono-num text-xs font-bold text-amber-300 mt-0.5">
                    {state.achievementsUnlocked.length} logros · {state.unlockedTitles.length} tít.
                  </div>
                </div>
                <div className="rounded-lg bg-[#071522] border border-[#18344d] p-2">
                  <div className="text-[10px] text-slate-400">Recompensa</div>
                  <div className="font-mono-num text-xs font-bold text-rose-300 mt-0.5">
                    {(state.bounty / 1000000).toFixed(1)}M B
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Observable World Leaderboard */}
            <div className="lg:col-span-7 flex flex-col min-h-0 space-y-2.5">
              {top3.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {top3.map((leader, idx) => (
                    <button
                      key={leader.id}
                      type="button"
                      onClick={() => setInspectedId(leader.id)}
                      className={`text-left rounded-xl p-2.5 border transition-colors cursor-pointer ${
                        idx === 0
                          ? 'bg-amber-500/15 border-amber-400/65 hover:bg-amber-500/25'
                          : idx === 1
                            ? 'bg-slate-400/10 border-slate-300/45 hover:bg-slate-400/20'
                            : 'bg-orange-600/15 border-orange-400/45 hover:bg-orange-600/25'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-extrabold">
                        <span className={idx === 0 ? 'text-amber-300' : idx === 1 ? 'text-slate-200' : 'text-orange-300'}>
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : '🥉 #3'}
                        </span>
                        <span className="font-mono-num text-sky-300">{leader.country}</span>
                      </div>
                      <div className={`text-xs font-extrabold truncate mt-0.5 flex items-center gap-1 ${getFlameClass(leader.flameTier)}`}>
                        {(leader.flameTier || 0) > 0 && <Flame className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="truncate">
                          {leader.clanTag ? `[${leader.clanTag}] ` : ''}
                          {leader.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {leader.titleName || 'Náufrago'} · {leader.achievementsCount ?? 0}🏆
                      </div>
                      <div className="font-mono-num text-xs font-extrabold text-amber-300 mt-1">
                        {leader.maxScore.toLocaleString()} pts
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Clasificación ({leaderboard.length} · {activeCount} en línea)</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar capitán, país..."
                      className="min-h-[40px] pl-8 pr-2.5 py-1 rounded-lg bg-[#081726] border border-[#214566] text-xs text-slate-100 w-[165px] focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOnlyActive((v) => !v)}
                    className={`min-h-[40px] px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                      onlyActive
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-[#0d2235] border-[#214566] text-slate-300'
                    }`}
                  >
                    {onlyActive ? 'En línea' : 'Todos'}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void onRefreshLeaderboard()}
                    className="min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#102940] hover:bg-[#173a5a] border border-[#254d73] text-xs font-bold text-sky-200 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {inspectedEntry && (
                <div className="rounded-xl bg-[#0c2338] border border-cyan-400/55 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Eye className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs sm:text-sm font-extrabold truncate ${getFlameClass(inspectedEntry.flameTier)}`}>
                            {inspectedEntry.clanTag ? `[${inspectedEntry.clanTag}] ` : ''}
                            {inspectedEntry.name}
                          </span>
                          {(inspectedEntry.flameTier || 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] font-bold text-amber-200">
                              <Flame className="w-2.5 h-2.5" /> Llama Nv.{inspectedEntry.flameTier}
                            </span>
                          )}
                          {inspectedEntry.donorUnlocked && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-[9px] font-bold text-rose-200">
                              <Heart className="w-2.5 h-2.5" /> Mecenas
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              inspectedEntry.activeNow
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700/60 text-slate-300'
                            }`}
                          >
                            {inspectedEntry.activeNow
                              ? 'En línea ahora'
                              : `Visto ${formatAgo(inspectedEntry.lastSeen)}`}
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-200">
                          Título: <b>{inspectedEntry.titleName || 'Náufrago'}</b> · País: {inspectedEntry.country} · {inspectedEntry.achievementsCount ?? 0} logros
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedId(null)}
                      className="min-w-[36px] min-h-[36px] rounded-lg bg-[#143452] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded bg-[#071625] px-2 py-1 border border-[#1d3f5e]">
                      <span className="text-slate-400 block text-[9px]">Navío</span>
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        <Anchor className="w-3 h-3" /> {inspectedEntry.shipClass || 'Balsa'}
                      </span>
                    </div>
                    <div className="rounded bg-[#071625] px-2 py-1 border border-[#1d3f5e]">
                      <span className="text-slate-400 block text-[9px]">Máx / Actual</span>
                      <span className="font-mono-num font-bold text-amber-300">
                        {inspectedEntry.maxScore.toLocaleString()} / {inspectedEntry.currentScore.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded bg-[#071625] px-2 py-1 border border-[#1d3f5e]">
                      <span className="text-slate-400 block text-[9px]">Logros / Títulos</span>
                      <span className="font-mono-num font-bold text-sky-300">
                        {inspectedEntry.achievementsCount ?? 0}🏆 · {inspectedEntry.titlesCount ?? 1}🎖️
                      </span>
                    </div>
                    <div className="rounded bg-[#071625] px-2 py-1 border border-[#1d3f5e]">
                      <span className="text-slate-400 block text-[9px]">Bajas / Islas</span>
                      <span className="font-mono-num font-bold text-rose-300 flex items-center gap-1">
                        <Swords className="w-3 h-3" /> {inspectedEntry.kills ?? 0} · {inspectedEntry.islandsVisited ?? 0} isl.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table with Pull-to-Refresh */}
              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#081726] border-b border-[#193752] text-[10px] font-bold uppercase text-slate-400">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Capitán · Llamas & Logros</div>
                  <div className="col-span-2 text-center">País</div>
                  <div className="col-span-2 text-right">Día/Nv</div>
                  <div className="col-span-2 text-right">Máx. Pts</div>
                </div>

                <PullToRefresh onRefresh={onRefreshLeaderboard} className="max-h-[320px]">
                  <div className="divide-y divide-[#15314a]">
                    {visibleRows.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {leaderboard.length === 0
                          ? 'Sincronizando capitanes activos en el servidor...'
                          : 'No hay capitanes que coincidan con ese filtro.'}
                      </div>
                    ) : (
                      visibleRows.map((entry) => {
                        const rank = leaderboard.findIndex((p) => p.id === entry.id) + 1;
                        const isSelf = entry.id === state.playerProfile.id;
                        const isSelected = inspectedId === entry.id;
                        const flame = entry.flameTier || 0;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setInspectedId(isSelected ? null : entry.id)}
                            className={`w-full min-h-[48px] text-left grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-cyan-500/20'
                                : isSelf
                                  ? 'bg-amber-400/10 hover:bg-amber-400/20'
                                  : 'hover:bg-[#112c45]'
                            }`}
                          >
                            <div className="col-span-1 font-mono-num font-bold text-amber-300">
                              {rank}
                            </div>
                            <div className="col-span-5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    entry.activeNow ? 'bg-emerald-400' : 'bg-slate-500'
                                  }`}
                                  title={entry.activeNow ? 'En línea ahora' : `Visto ${formatAgo(entry.lastSeen)}`}
                                />
                                {flame > 0 && (
                                  <Flame
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      flame >= 3
                                        ? 'text-cyan-300'
                                        : flame === 2
                                          ? 'text-orange-400'
                                          : 'text-amber-300'
                                    }`}
                                  />
                                )}
                                <span className={`font-extrabold truncate ${getFlameClass(flame)}`}>
                                  {entry.clanTag ? `[${entry.clanTag}] ` : ''}
                                  {entry.name}
                                </span>
                                {entry.donorUnlocked && (
                                  <Heart className="w-3 h-3 text-rose-400 shrink-0" />
                                )}
                              </div>
                              <div className="font-mono-num text-[10px] text-slate-400 pl-3.5 truncate">
                                {entry.titleName || 'Náufrago'} · {entry.achievementsCount ?? 0}🏆 · {entry.titlesCount ?? 1}🎖️
                              </div>
                            </div>
                            <div className="col-span-2 text-center font-mono-num text-[11px] font-bold text-sky-300">
                              {entry.country}
                            </div>
                            <div className="col-span-2 text-right font-mono-num text-[11px] text-slate-300">
                              D{entry.dayCount} · Nv.{entry.level}
                            </div>
                            <div className="col-span-2 text-right font-mono-num font-extrabold text-amber-300">
                              {entry.maxScore.toLocaleString()}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PullToRefresh>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
