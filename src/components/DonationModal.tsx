import { Check, CheckCircle2, Copy, Heart, QrCode, ShieldCheck, Smartphone, Sparkles, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const BRE_B_KEY = '@3155552964';
export const GAME_CREATOR_NAME = 'Rubén Darío Correa Cuellar';

interface DonationEntry {
  id: string;
  donorName: string;
  amountCop: number;
  channel: string;
  reference: string;
  message: string;
  createdAt: number;
}

interface DonationModalProps {
  open: boolean;
  purpose?: 'donation' | 'extra_life';
  defaultDonorName: string;
  donorUnlocked: boolean;
  donorSkinEnabled: boolean;
  onToggleDonorSkin: () => void;
  onClose: () => void;
  onDonationRecorded?: (amountCop: number, donorName: string) => void;
}

const AMOUNT_PRESETS = [5000, 10000, 20000, 50000, 100000];

const BRE_B_CHANNELS = [
  { id: 'Nequi (Bre-B)', label: 'Nequi', hint: 'Entra a Nequi → Enviar → Por Llave Bre-B → escribe @3155552964' },
  { id: 'Bancolombia (Bre-B)', label: 'Bancolombia', hint: 'App Bancolombia → Transferir → Llaves Bre-B → @3155552964' },
  { id: 'Daviplata (Bre-B)', label: 'Daviplata', hint: 'Daviplata → Pasar plata → Llave Bre-B → @3155552964' },
  { id: 'Nu Colombia (Bre-B)', label: 'Nu', hint: 'App Nu → Transferir → Bre-B / Llave → @3155552964' },
  { id: 'Otro Banco Bre-B', label: 'Otro Banco', hint: 'Tu app bancaria → Transferencias Bre-B → Llave @3155552964' },
];

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function DonationModal({
  open,
  purpose = 'donation',
  defaultDonorName,
  donorUnlocked,
  donorSkinEnabled,
  onToggleDonorSkin,
  onClose,
  onDonationRecorded,
}: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [customAmount, setCustomAmount] = useState<string>('20000');
  const [selectedChannel, setSelectedChannel] = useState<string>(BRE_B_CHANNELS[0].id);
  const [donorName, setDonorName] = useState<string>(defaultDonorName || '');
  const [reference, setReference] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const [donations, setDonations] = useState<DonationEntry[]>([]);
  const [totalCop, setTotalCop] = useState<number>(0);
  const [supporterCount, setSupporterCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const effectiveAmount = useMemo(() => {
    const parsed = Math.round(Number(customAmount.replace(/[^0-9]/g, '')) || 0);
    return parsed > 0 ? parsed : selectedAmount;
  }, [customAmount, selectedAmount]);

  const activeChannelObj = useMemo(
    () => BRE_B_CHANNELS.find((c) => c.id === selectedChannel) || BRE_B_CHANNELS[0],
    [selectedChannel]
  );

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/donations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.donations)) setDonations(data.donations);
        if (typeof data.totalCop === 'number') setTotalCop(data.totalCop);
        if (typeof data.supporterCount === 'number') setSupporterCount(data.supporterCount);
      }
    } catch {
      // Ignore network errors cleanly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setDonorName((prev) => prev || defaultDonorName || 'Capitán Solidario');
    if (purpose === 'extra_life') {
      setSelectedAmount(5000);
      setCustomAmount('5000');
    }
    setErrorMsg(null);
    setSuccessNotice(null);
    fetchDonations();
  }, [open, purpose, defaultDonorName, fetchDonations]);

  useEffect(() => {
    if (!open) return;
    const qrPayload = `Bre-B Colombia | Llave: ${BRE_B_KEY} | Titular: ${GAME_CREATOR_NAME} | Donacion Marea Mutante: ${formatCop(
      Math.max(1000, effectiveAmount)
    )}`;
    QRCode.toDataURL(qrPayload, {
      width: 220,
      margin: 2,
      color: { dark: '#04121e', light: '#f8fafc' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [open, effectiveAmount]);

  if (!open) return null;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
  };

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(BRE_B_KEY).catch(() => {});
    }
    setCopiedKey(true);
    window.setTimeout(() => setCopiedKey(false), 1800);
  };

  const handleCopySummary = () => {
    const summary = `Donación Marea Mutante (${GAME_CREATOR_NAME}) · Llave Bre-B Colombia: ${BRE_B_KEY} · Monto sugerido: ${formatCop(
      Math.max(1000, effectiveAmount)
    )}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setCopiedSummary(true);
    window.setTimeout(() => setCopiedSummary(false), 1800);
  };

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (effectiveAmount < 1000) {
      setErrorMsg('El monto mínimo para registrar una donación es $1.000 COP.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim() || 'Capitán Solidario',
          amountCop: effectiveAmount,
          channel: selectedChannel,
          reference: reference.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo registrar la donación.');
        return;
      }

      if (Array.isArray(data.donations)) setDonations(data.donations);
      if (typeof data.totalCop === 'number') setTotalCop(data.totalCop);
      if (typeof data.supporterCount === 'number') setSupporterCount(data.supporterCount);

      setReference('');
      setMessage('');
      setSuccessNotice(
        `¡Gracias ${donorName.trim() || 'Capitán'}! Tu apoyo de ${formatCop(effectiveAmount)} vía Bre-B quedó registrado en el Muro de Mecenas.`
      );
      onDonationRecorded?.(effectiveAmount, donorName.trim() || 'Capitán Solidario');
    } catch {
      setErrorMsg('Error de conexión al guardar la donación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1f33] border-b border-[#1b3c58]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-400/40 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-50">
                {purpose === 'extra_life'
                  ? 'Comprar Vida Extra (+1 Vida) · Bre-B Colombia'
                  : 'Sistema de Donaciones · Bre-B Colombia'}
              </h2>
              <p className="text-xs text-slate-300">
                {purpose === 'extra_life' ? (
                  <>
                    Superaste las 5 muertes. Transfiere desde <b className="text-emerald-300">$5.000 COP</b> a{' '}
                    <b className="text-amber-300">{BRE_B_KEY}</b> y registra tu comprobante para recibir{' '}
                    <b className="text-emerald-300">+1 Vida Extra</b> al instante.
                  </>
                ) : (
                  <>
                    Apoya el desarrollo de <b className="text-amber-300">Marea Mutante</b> · Creador:{' '}
                    <b className="text-sky-200">{GAME_CREATOR_NAME}</b>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer"
            aria-label="Cerrar donaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Bre-B Payment Details & QR */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-xl bg-[#0b1f31] border border-emerald-500/35 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Llave Oficial Bre-B (Colombia)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
                  Transferencia Inmediata · $0 Comisión
                </span>
              </div>

              <div className="rounded-lg bg-[#06131f] border border-[#244a6e] p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Llave Bre-B
                  </div>
                  <div className="font-mono-num text-xl sm:text-2xl font-extrabold text-amber-300 tracking-wide">
                    {BRE_B_KEY}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Beneficiario: <span className="text-slate-100 font-semibold">{GAME_CREATOR_NAME}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? '¡Llave copiada!' : 'Copiar Llave'}</span>
                </button>
              </div>

              {/* Amount Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Monto de Donación (COP)</span>
                  <span className="font-mono-num font-bold text-emerald-300">
                    {formatCop(effectiveAmount)}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {AMOUNT_PRESETS.map((amt) => {
                    const active = effectiveAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono-num font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-[#081726] border-[#1f4263] text-slate-300 hover:border-sky-400/60'
                        }`}
                      >
                        ${(amt / 1000).toFixed(0)}k
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-mono-num text-slate-400">COP $</span>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Otro valor en pesos"
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#06131f] border border-[#274f73] text-xs font-mono-num text-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-2.5 py-1.5 rounded bg-[#102940] hover:bg-[#173b5c] border border-[#2a557c] text-[11px] font-semibold text-sky-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Copiado' : 'Copiar datos'}</span>
                  </button>
                </div>
              </div>

              {/* Channel Selector + QR */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-center">
                <div className="sm:col-span-7 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-sky-300" />
                    <span>Tu Banco o Billetera en Colombia</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BRE_B_CHANNELS.map((ch) => {
                      const active = selectedChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedChannel(ch.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer transition-colors ${
                            active
                              ? 'bg-sky-500/25 border-sky-400 text-sky-100'
                              : 'bg-[#071522] border-[#1f4263] text-slate-300 hover:border-sky-400/50'
                          }`}
                        >
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-lg bg-[#06131f] border border-[#1d3d5c] p-2.5 text-[11px] text-slate-300 leading-relaxed">
                    <b className="text-amber-300">Paso a paso ({activeChannelObj.label}):</b>{' '}
                    {activeChannelObj.hint}
                  </div>
                </div>

                <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-lg bg-[#06131f] border border-[#1d3d5c] p-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 mb-1.5">
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>QR Datos Bre-B</span>
                  </div>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Llave Bre-B ${BRE_B_KEY}`}
                      className="w-28 h-28 rounded bg-white p-1"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded bg-[#0c2236] flex items-center justify-center text-[10px] text-slate-400">
                      Generando QR...
                    </div>
                  )}
                  <span className="font-mono-num text-[10px] text-amber-300 mt-1">
                    {BRE_B_KEY}
                  </span>
                </div>
              </div>

              {/* Exclusive Donor In-Game Cosmetics & Title Perks */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-400/40 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Recompensas Exclusivas para Donadores</span>
                  </div>
                  {donorUnlocked ? (
                    <button
                      type="button"
                      onClick={onToggleDonorSkin}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        donorSkinEnabled
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : 'bg-[#081726] border-[#29537a] text-slate-300'
                      }`}
                    >
                      {donorSkinEnabled ? 'Apariencia Mecenas: ACTIVA' : 'Apariencia Mecenas: Desactivada'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-200 font-semibold">
                      Se desbloquea al registrar tu apoyo
                    </span>
                  )}
                </div>
                <ul className="text-[11px] text-slate-200 space-y-1">
                  <li>
                    <b className="text-amber-300">1. Refugio Santuario Dorado:</b> Tu Refugio, Cuartel y toldo del navío lucen acabados dorados, cristales cian y estandartes esmeralda.
                  </li>
                  <li>
                    <b className="text-amber-300">2. Personaje Capitán Dorado:</b> Traje naval índigo y oro con charreteras doradas, tricornio real y aura de mecenas.
                  </li>
                  <li>
                    <b className="text-amber-300">3. Título Exclusivo:</b>{' '}
                    <span className="text-emerald-300 font-semibold">Mecenas del Horizonte</span> (+25 HP, +12% daño y +12% vel. naval).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Confirm Donation Form & Supporters Wall */}
          <div className="lg:col-span-6 space-y-3 flex flex-col">
            <form
              onSubmit={handleSubmitDonation}
              className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Registrar Tu Donación</span>
                </div>
                <span className="text-[10px] text-slate-400">Después de transferir por Bre-B</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Tu Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Ej. Capitán Mateo"
                    className="w-full px-2.5 py-1.5 rounded bg-[#06131f] border border-[#274f73] text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Comprobante / Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. #M4920 o últimos 4 dígitos"
                    className="w-full px-2.5 py-1.5 rounded bg-[#06131f] border border-[#274f73] text-xs font-mono-num text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                  Mensaje para {GAME_CREATOR_NAME} (opcional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¡Gran juego! Sigue mejorándolo..."
                  className="w-full px-2.5 py-1.5 rounded bg-[#06131f] border border-[#274f73] text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {errorMsg && (
                <div className="rounded bg-rose-500/15 border border-rose-500/40 px-2.5 py-1.5 text-[11px] text-rose-200">
                  {errorMsg}
                </div>
              )}

              {successNotice && (
                <div className="rounded bg-emerald-500/15 border border-emerald-400/40 px-2.5 py-1.5 text-[11px] text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span>{successNotice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
              >
                {submitting
                  ? 'Registrando pago...'
                  : purpose === 'extra_life'
                    ? `Confirmar Pago de ${formatCop(Math.max(1000, effectiveAmount))} y Activar +1 Vida Extra`
                    : `Registrar Apoyo de ${formatCop(Math.max(1000, effectiveAmount))} (Bre-B)`}
              </button>
            </form>

            {/* Supporters Wall */}
            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 flex-1 flex flex-col min-h-[190px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#193855]">
                <div>
                  <h3 className="text-xs font-bold text-slate-100">Muro de Donaciones Bre-B</h3>
                  <p className="text-[10px] text-slate-400">
                    {supporterCount} {supporterCount === 1 ? 'apoyo registrado' : 'apoyos registrados'}
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-400/35 text-xs font-mono-num font-bold text-emerald-300">
                  Total: {formatCop(totalCop)}
                </div>
              </div>

              <div className="mt-2 flex-1 overflow-y-auto deck-scroll space-y-1.5 max-h-[210px]">
                {loading && donations.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Cargando apoyos...</div>
                ) : donations.length === 0 ? (
                  <div className="text-xs text-slate-400 py-5 text-center leading-relaxed">
                    Aún no hay donaciones registradas en el muro. ¡Sé el primero en apoyar a{' '}
                    <span className="text-amber-300 font-semibold">{GAME_CREATOR_NAME}</span> vía Bre-B{' '}
                    <span className="font-mono-num text-emerald-300">{BRE_B_KEY}</span>!
                  </div>
                ) : (
                  donations.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg bg-[#071522] border border-[#1c3d5b] px-2.5 py-2 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {d.donorName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[9px] text-sky-200">
                            {d.channel}
                          </span>
                          {d.reference && (
                            <span className="text-[9px] font-mono-num text-slate-400">
                              Ref: {d.reference}
                            </span>
                          )}
                        </div>
                        {d.message && (
                          <p className="text-[11px] text-slate-300 mt-0.5 break-words">
                            “{d.message}”
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-num text-xs font-bold text-emerald-300">
                          {formatCop(d.amountCop)}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {new Date(d.createdAt).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
