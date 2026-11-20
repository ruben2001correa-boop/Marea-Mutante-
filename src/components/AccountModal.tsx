import { CloudDownload, CloudUpload, LogIn, LogOut, ShieldAlert, Trash2, UserCheck, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { COUNTRY_OPTIONS } from '../game/socialAndKingdoms';
import type { PersistentState } from '../game/types';
import { CustomSelect } from './CustomSelect';

const TOKEN_KEY = 'marea_mutante_auth_token_v1';

export interface AccountInfo {
  id: string;
  username: string;
  playerProfileId: string;
  captainName: string;
  country: string;
  avatarColor: string;
  motto: string;
  bio: string;
  hasCloudSave: boolean;
  cloudSavedAt: number | null;
}

interface AccountModalProps {
  open: boolean;
  state: PersistentState;
  onClose: () => void;
  onSyncAccountProfile: (captainName: string, country: string, profileId?: string) => void;
  onLoadCloudSave: (saveData: Record<string, unknown>) => void;
  onNotify?: (text: string, color?: string) => void;
}

export function AccountModal({
  open,
  state,
  onClose,
  onSyncAccountProfile,
  onLoadCloudSave,
  onNotify,
}: AccountModalProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captainName, setCaptainName] = useState(state.playerProfile.name);
  const [country, setCountry] = useState(state.playerProfile.country);
  const [motto, setMotto] = useState('Sobreviviente de las Cenizas Saladas');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState('#38bdf8');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Sesión expirada');
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data?.account) return;
        const acc: AccountInfo = data.account;
        setAccount(acc);
        setCaptainName(acc.captainName);
        setCountry(acc.country);
        setMotto(acc.motto || '');
        setBio(acc.bio || '');
        setAvatarColor(acc.avatarColor || '#38bdf8');
      })
      .catch(() => {
        if (cancelled) return;
        setAccount(null);
        setToken('');
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          // Ignore
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token]);

  if (!open) return null;

  const saveToken = (next: string) => {
    setToken(next);
    try {
      if (next) localStorage.setItem(TOKEN_KEY, next);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setLoading(true);
    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const bodyPayload =
        authMode === 'register'
          ? {
              username,
              password,
              captainName: captainName.trim() || state.playerProfile.name,
              country,
              playerProfileId: state.playerProfile.id,
              initialSave: state,
            }
          : { username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo autenticar.');
        return;
      }
      saveToken(data.token);
      setAccount(data.account);
      setCaptainName(data.account.captainName);
      setCountry(data.account.country);
      setMotto(data.account.motto || '');
      setBio(data.account.bio || '');
      setAvatarColor(data.account.avatarColor || '#38bdf8');
      onSyncAccountProfile(
        data.account.captainName,
        data.account.country,
        data.account.playerProfileId
      );
      setStatusMsg(
        authMode === 'register'
          ? '¡Cuenta creada y vinculada con tu partida!'
          : '¡Sesión iniciada correctamente!'
      );
      setPassword('');
    } catch {
      setErrorMsg('Error de conexión con el servidor de cuentas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ captainName, country, avatarColor, motto, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo guardar el perfil.');
        return;
      }
      setAccount(data.account);
      onSyncAccountProfile(data.account.captainName, data.account.country, data.account.playerProfileId);
      setStatusMsg('Perfil de cuenta actualizado y sincronizado.');
      onNotify?.('Perfil de cuenta guardado', '#34d399');
    } catch {
      setErrorMsg('No se pudo conectar al guardar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloudSave = async () => {
    if (!token) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/save-cloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ saveData: state }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error guardando en la nube.');
        return;
      }
      setAccount(data.account);
      setStatusMsg('¡Partida respaldada en la nube con éxito!');
      onNotify?.('Partida guardada en la nube', '#38bdf8');
    } catch {
      setErrorMsg('Error de red al guardar en la nube.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloudLoad = async () => {
    if (!token) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/load-cloud', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.saveData) {
        setErrorMsg(data.error || 'No hay partida en la nube.');
        return;
      }
      onLoadCloudSave(data.saveData);
      setStatusMsg('¡Partida cargada desde la nube!');
      onNotify?.('Partida de la nube restaurada', '#34d399');
    } catch {
      setErrorMsg('Error de red al cargar desde la nube.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    saveToken('');
    setAccount(null);
    setConfirmDelete(false);
    setStatusMsg('Sesión cerrada.');
  };

  const handleDeleteAccount = async () => {
    if (!token || deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR') return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo eliminar la cuenta.');
        return;
      }
      saveToken('');
      setAccount(null);
      setConfirmDelete(false);
      setDeleteConfirmText('');
      setStatusMsg('Tu cuenta y tu registro en la clasificación han sido eliminados permanentemente.');
      onNotify?.('Cuenta eliminada correctamente', '#fb7185');
    } catch {
      setErrorMsg('Error de conexión al eliminar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const AVATAR_COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#c084fc', '#fb923c'];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-xl max-h-[92dvh] rounded-2xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1e31] border-b border-[#1c3d5b]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl border border-sky-400/50 flex items-center justify-center"
              style={{ backgroundColor: `${account?.avatarColor || avatarColor}25` }}
            >
              <UserCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-50">
                Cuenta del Capitán
              </h2>
              <p className="text-xs text-slate-300">
                {account
                  ? `@${account.username} · ID ${account.playerProfileId}`
                  : 'Inicia sesión o regístrate para respaldar tu progreso en la nube'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cuenta"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-500/50 px-3.5 py-2.5 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}
          {statusMsg && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/50 px-3.5 py-2.5 text-xs text-emerald-200">
              {statusMsg}
            </div>
          )}

          {!account ? (
            <form
              onSubmit={handleAuthSubmit}
              className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-1.5 bg-[#06131f] p-1 rounded-xl border border-[#1d3e5c]">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">Usuario</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={24}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="capitan_mareamutante"
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">
                      Nombre de Capitán en Ranking
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-200">País</label>
                    <CustomSelect
                      value={country}
                      ariaLabel="País"
                      onChange={setCountry}
                      options={COUNTRY_OPTIONS.map((c) => ({
                        value: c.code,
                        label: `${c.code} — ${c.name}`,
                      }))}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                {loading
                  ? 'Procesando...'
                  : authMode === 'register'
                    ? 'Registrar Cuenta y Sincronizar'
                    : 'Entrar a Mi Cuenta'}
              </button>
            </form>
          ) : (
            <>
              {/* Profile Card */}
              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-amber-300">Perfil Personalizado</span>
                  <div className="flex items-center gap-1.5">
                    {AVATAR_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        aria-label={`Color ${col}`}
                        onClick={() => setAvatarColor(col)}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                          avatarColor === col ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Nombre de Capitán
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">País</label>
                    <CustomSelect
                      value={country}
                      ariaLabel="País"
                      onChange={setCountry}
                      options={COUNTRY_OPTIONS.map((c) => ({
                        value: c.code,
                        label: `${c.code} — ${c.name}`,
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Lema Naval</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Biografía</label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Cuenta tus hazañas en Marea Mutante..."
                    className="w-full px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-sm text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveProfile}
                  className="w-full min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-sm cursor-pointer"
                >
                  Guardar Cambios de Perfil
                </button>
              </div>

              {/* Cloud Save / Load */}
              <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-300">Respaldo en la Nube</span>
                  <span className="text-slate-400 font-mono-num">
                    {account.cloudSavedAt
                      ? `Último: ${new Date(account.cloudSavedAt).toLocaleString('es-CO')}`
                      : 'Sin respaldo aún'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCloudSave}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Guardar en Nube</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading || !account.hasCloudSave}
                    onClick={handleCloudLoad}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>Cargar de Nube</span>
                  </button>
                </div>
              </div>

              {/* Logout + Mandatory Account Deletion */}
              <div className="rounded-xl bg-[#101824] border border-rose-500/35 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#132d45] hover:bg-[#193d5d] text-slate-100 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete((v) => !v)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/50 text-rose-200 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>

                {confirmDelete && (
                  <div className="rounded-xl bg-rose-950/50 border border-rose-500/60 p-3 space-y-2.5">
                    <div className="flex items-start gap-2 text-xs text-rose-200">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        Esta acción eliminará permanentemente tu cuenta, sesiones, respaldo en la nube y
                        posición en la clasificación mundial. Escribe <b>ELIMINAR</b> para confirmar:
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="ELIMINAR"
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-rose-400/60 text-sm text-slate-100 uppercase"
                      />
                      <button
                        type="button"
                        disabled={loading || deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR'}
                        onClick={handleDeleteAccount}
                        className="min-h-[44px] px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-extrabold cursor-pointer"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
