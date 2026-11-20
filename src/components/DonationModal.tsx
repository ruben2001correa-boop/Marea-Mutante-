import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Heart,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const BRE_B_KEY = '@3155552964';
export const NEQUI_NUMBER = '3155552964';
export const NEQUI_CARD_RAW = '4525160122517220';
export const NEQUI_CARD_FORMATTED = '4525 1601 2251 7220';
export const GAME_CREATOR_NAME = 'Rubén Darío Correa Cuellar';

interface DonationEntry {
  id: string;
  donorName: string;
  amountCop: number;
  channel: string;
  reference: string;
  message: string;
  verificationStatus?: string;
  createdAt: number;
}

interface PaymentIntentClient {
  id: string;
  code: string;
  donorName: string;
  amountCop: number;
  purpose: 'donation' | 'extra_life';
  method: string;
  status: 'pending' | 'awaiting_review' | 'verified' | 'rejected';
  reference?: string;
  rejectReason?: string;
  createdAt: number;
  expiresAt: number;
}

interface DonationModalProps {
  open: boolean;
  purpose?: 'donation' | 'extra_life';
  playerProfileId?: string;
  defaultDonorName: string;
  donorUnlocked: boolean;
  donorSkinEnabled: boolean;
  onToggleDonorSkin: () => void;
  onClose: () => void;
  onDonationRecorded?: (
    amountCop: number,
    donorName: string,
    verifiedPurpose?: 'donation' | 'extra_life'
  ) => void;
}

const AMOUNT_PRESETS = [5000, 10000, 20000, 50000, 100000];

const PAYMENT_CHANNELS = [
  {
    id: 'Bre-B (@3155552964)',
    label: 'Llave Bre-B',
    hint: 'Desde Nequi, Bancolombia, Daviplata o Nu → Transferir por Llave Bre-B → @3155552964.',
  },
  {
    id: 'Nequi Directo (3155552964)',
    label: 'Nequi 3155552964',
    hint: 'Entra a Nequi → Enviar plata → 3155552964. Incluye el código MM-... en el mensaje.',
  },
  {
    id: 'Tarjeta Nequi (4525...7220)',
    label: 'Tarjeta Nequi',
    hint: 'Transferencia / abono a Tarjeta Nequi 4525 1601 2251 7220 a nombre de Rubén Darío Correa Cuellar.',
  },
  {
    id: 'Pasarela Wompi Colombia',
    label: 'Wompi / PSE / Tarjeta',
    hint: 'Si Wompi está configurado en el servidor, ingresa el ID de transacción Wompi para verificación automática en vivo.',
  },
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
  playerProfileId = '',
  defaultDonorName,
  donorUnlocked,
  donorSkinEnabled,
  onToggleDonorSkin,
  onClose,
  onDonationRecorded,
}: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [customAmount, setCustomAmount] = useState<string>('20000');
  const [selectedChannel, setSelectedChannel] = useState<string>(PAYMENT_CHANNELS[0].id);
  const [donorName, setDonorName] = useState<string>(defaultDonorName || '');
  const [reference, setReference] = useState<string>('');
  const [cardLast4, setCardLast4] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [activeIntent, setActiveIntent] = useState<PaymentIntentClient | null>(null);
  const [verificationModeLabel, setVerificationModeLabel] = useState<string>('');
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean>(false);

  const [donations, setDonations] = useState<DonationEntry[]>([]);
  const [totalCop, setTotalCop] = useState<number>(0);
  const [supporterCount, setSupporterCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Creator Verification Console state
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [creatorPin, setCreatorPin] = useState('');
  const [creatorQueue, setCreatorQueue] = useState<PaymentIntentClient[]>([]);
  const [creatorMsg, setCreatorMsg] = useState<string | null>(null);

  const effectiveAmount = useMemo(() => {
    const parsed = Math.round(Number(customAmount.replace(/[^0-9]/g, '')) || 0);
    return parsed > 0 ? parsed : selectedAmount;
  }, [customAmount, selectedAmount]);

  const activeChannelObj = useMemo(
    () => PAYMENT_CHANNELS.find((c) => c.id === selectedChannel) || PAYMENT_CHANNELS[0],
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
        if (typeof data.verificationMode === 'string') setVerificationModeLabel(data.verificationMode);
        setGatewayConfigured(Boolean(data.gatewayConfigured));
      }
    } catch {
      // Ignore network errors cleanly
    } finally {
      setLoading(false);
    }
  }, []);

  const claimIntentReward = useCallback(
    async (intent: PaymentIntentClient, updatedList?: DonationEntry[], nextTotal?: number, nextCount?: number) => {
      try {
        const cRes = await fetch(`/api/payments/claim/${encodeURIComponent(intent.id)}`, {
          method: 'POST',
        });
        const cData = await cRes.json();
        if (cRes.ok && cData.ok && !cData.alreadyClaimed) {
          if (Array.isArray(updatedList)) setDonations(updatedList);
          if (typeof nextTotal === 'number') setTotalCop(nextTotal);
          if (typeof nextCount === 'number') setSupporterCount(nextCount);
          setSuccessNotice(
            intent.purpose === 'extra_life'
              ? `¡Pago verificado! +1 Vida Extra activada para ${intent.donorName} (${formatCop(intent.amountCop)}).`
              : `¡Pago verificado! Recompensas de Mecenas activadas para ${intent.donorName} (${formatCop(intent.amountCop)}).`
          );
          setInfoNotice(null);
          onDonationRecorded?.(intent.amountCop, intent.donorName, intent.purpose);
        }
      } catch {
        // Ignore claim error
      }
    },
    [onDonationRecorded]
  );

  const checkPendingProfileRewards = useCallback(async () => {
    if (!playerProfileId) return;
    try {
      const res = await fetch(`/api/payments/rewards/${encodeURIComponent(playerProfileId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.pendingRewards) && data.pendingRewards.length > 0) {
        for (const rewardIntent of data.pendingRewards as PaymentIntentClient[]) {
          await claimIntentReward(rewardIntent);
        }
        await fetchDonations();
      }
    } catch {
      // Ignore
    }
  }, [playerProfileId, claimIntentReward, fetchDonations]);

  useEffect(() => {
    if (!open) return;
    setDonorName((prev) => prev || defaultDonorName || 'Capitán Solidario');
    if (purpose === 'extra_life') {
      setSelectedAmount(5000);
      setCustomAmount('5000');
    }
    setErrorMsg(null);
    setInfoNotice(null);
    setSuccessNotice(null);
    fetchDonations();
    checkPendingProfileRewards();
  }, [open, purpose, defaultDonorName, fetchDonations, checkPendingProfileRewards]);

  // Poll status automatically while intent is in awaiting_review
  useEffect(() => {
    if (!open || !activeIntent || activeIntent.status !== 'awaiting_review') return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${encodeURIComponent(activeIntent.id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.intent) setActiveIntent(data.intent);
        if (data.verified && data.grantReward && data.intent) {
          await claimIntentReward(data.intent, data.donations, data.totalCop, data.supporterCount);
        } else if (data.rejected && data.intent) {
          setInfoNotice(null);
          setErrorMsg(data.intent.rejectReason || 'El comprobante fue rechazado.');
        }
      } catch {
        // Ignore transient polling failures
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [open, activeIntent, claimIntentReward]);

  if (!open) return null;

  const copyValue = (id: string, value: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedField(id);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  const handleCreateIntent = async () => {
    setErrorMsg(null);
    setInfoNotice(null);
    setSuccessNotice(null);

    if (effectiveAmount < (purpose === 'extra_life' ? 5000 : 1000)) {
      setErrorMsg(
        purpose === 'extra_life'
          ? 'La Vida Extra requiere mínimo $5.000 COP.'
          : 'El monto mínimo válido es $1.000 COP.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName.trim() || 'Capitán Solidario',
          playerProfileId,
          amountCop: effectiveAmount,
          purpose,
          method: selectedChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo generar la orden de pago.');
        return;
      }
      setActiveIntent(data.intent);
      setInfoNotice(
        `Orden ${data.intent.code} generada. Realiza tu transferencia poniendo "${data.intent.code}" en el mensaje y luego ingresa tu comprobante real abajo.`
      );
    } catch {
      setErrorMsg('Error de conexión al generar la orden.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    let intentToUse = activeIntent;
    if (!intentToUse) {
      setErrorMsg('Primero presiona "Generar Orden de Pago" para crear tu código único MM-...');
      return;
    }

    if (reference.trim().length < 6) {
      setErrorMsg('Ingresa el número real de comprobante o CUS de Nequi/Bre-B (mínimo 6 caracteres).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: intentToUse.id,
          donorName: donorName.trim() || 'Capitán Solidario',
          reference: reference.trim(),
          cardNumberOrLast4: cardLast4.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        setErrorMsg(data.error || 'No se pudo verificar el comprobante.');
        return;
      }

      if (data.intent) setActiveIntent(data.intent);

      if (data.verified && data.grantReward && data.intent) {
        await claimIntentReward(data.intent, data.donations, data.totalCop, data.supporterCount);
        setReference('');
        setCardLast4('');
        setMessage('');
      } else if (data.awaitingReview) {
        setInfoNotice(
          data.message ||
            'Comprobante enviado a revisión. No se otorgarán premios ni Vida Extra hasta confirmar el ingreso real.'
        );
      }
    } catch {
      setErrorMsg('Error de red al verificar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadCreatorQueue = async () => {
    setCreatorMsg(null);
    try {
      const res = await fetch('/api/payments/pending', {
        headers: { 'x-creator-pin': creatorPin.trim() },
      });
      const data = await res.json();
      if (!res.ok) {
        setCreatorMsg(data.error || 'PIN inválido.');
        return;
      }
      setCreatorQueue(data.intents || []);
      setCreatorMsg(`Cargadas ${(data.intents || []).length} órdenes recientes.`);
    } catch {
      setCreatorMsg('Error conectando con el servidor.');
    }
  };

  const handleCreatorDecision = async (intentId: string, action: 'approve' | 'reject') => {
    setCreatorMsg(null);
    try {
      const res = await fetch(`/api/payments/admin/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-creator-pin': creatorPin.trim(),
        },
        body: JSON.stringify({ intentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreatorMsg(data.error || 'No se pudo procesar.');
        return;
      }
      setCreatorMsg(
        action === 'approve'
          ? 'Pago aprobado y recompensa habilitada para el jugador.'
          : 'Comprobante rechazado.'
      );
      await handleLoadCreatorQueue();
      await fetchDonations();
      if (activeIntent && activeIntent.id === intentId && action === 'approve' && data.intent) {
        setActiveIntent(data.intent);
        await claimIntentReward(data.intent, data.donations, data.totalCop, data.supporterCount);
      }
    } catch {
      setCreatorMsg('Error de red.');
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-4xl max-h-[92dvh] rounded-2xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1f33] border-b border-[#1b3c58]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                {purpose === 'extra_life'
                  ? 'Vida Extra Verificada · Nequi / Bre-B'
                  : 'Pagos y Donaciones Verificadas · Nequi / Bre-B'}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                Titular: <b className="text-amber-300">{GAME_CREATOR_NAME}</b> ·{' '}
                <span className="text-emerald-300">{verificationModeLabel || 'Verificación real'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Cerrar donaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Official Credentials (NO QR) + Amount + Channels */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-xl bg-[#0b1f31] border border-emerald-500/35 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cuentas Oficiales Directas (Colombia)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
                  {gatewayConfigured ? 'Wompi API Activa' : 'Nequi / Bre-B Directo'}
                </span>
              </div>

              {/* Bre-B Key + Nequi Phone + Nequi Card (NO QR CODE) */}
              <div className="space-y-2">
                <div className="rounded-lg bg-[#06131f] border border-[#244a6e] p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Llave Bre-B Colombia
                    </div>
                    <div className="font-mono-num text-lg font-extrabold text-amber-300">
                      {BRE_B_KEY}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('breb', BRE_B_KEY)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'breb' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'breb' ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="rounded-lg bg-[#06131f] border border-[#244a6e] p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Número Nequi
                    </div>
                    <div className="font-mono-num text-base font-extrabold text-emerald-300">
                      {NEQUI_NUMBER}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('nequi', NEQUI_NUMBER)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#102940] hover:bg-[#173b5c] border border-[#2a557c] text-sky-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'nequi' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'nequi' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="rounded-lg bg-[#06131f] border border-[#244a6e] p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-sky-300" />
                      <span>Tarjeta Nequi</span>
                    </div>
                    <div className="font-mono-num text-sm sm:text-base font-extrabold text-sky-200">
                      {NEQUI_CARD_FORMATTED}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue('card', NEQUI_CARD_RAW)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#102940] hover:bg-[#173b5c] border border-[#2a557c] text-sky-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'card' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedField === 'card' ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Amount Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Monto a Transferir (COP)</span>
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
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount(String(amt));
                        }}
                        className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-mono-num font-bold border transition-colors cursor-pointer ${
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
                    min={purpose === 'extra_life' ? 5000 : 1000}
                    step={1000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Otro valor"
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-xs font-mono-num text-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-300" />
                  <span>Medio de Pago</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_CHANNELS.map((ch) => {
                    const active = selectedChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedChannel(ch.id)}
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
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
                <div className="rounded-lg bg-[#06131f] border border-[#1d3d5c] p-2.5 text-xs text-slate-300 leading-relaxed">
                  <b className="text-amber-300">Instrucción ({activeChannelObj.label}):</b>{' '}
                  {activeChannelObj.hint}
                </div>
              </div>

              {/* Donor Perks */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-400/40 p-3 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4" />
                    <span>Premios al Verificar el Pago</span>
                  </div>
                  {donorUnlocked && (
                    <button
                      type="button"
                      onClick={onToggleDonorSkin}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                        donorSkinEnabled
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : 'bg-[#081726] border-[#29537a] text-slate-300'
                      }`}
                    >
                      {donorSkinEnabled ? 'Skin Mecenas: ACTIVA' : 'Skin Mecenas: OFF'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-200">
                  {purpose === 'extra_life'
                    ? 'Al verificarse el pago: +1 Vida Extra inmediata + Aspecto Dorado y Título Mecenas.'
                    : 'Al verificarse el pago: Refugio Santuario Dorado, Capitán Dorado y Título Mecenas del Horizonte.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: 2-Step Verification Form + Creator Review Console + Supporters Wall */}
          <div className="lg:col-span-6 space-y-3 flex flex-col">
            <form
              onSubmit={handleVerifyPayment}
              className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verificación Real de Pago</span>
                </div>
                {activeIntent && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-bold ${
                      activeIntent.status === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : activeIntent.status === 'awaiting_review'
                          ? 'bg-amber-500/20 text-amber-200'
                          : activeIntent.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-sky-500/20 text-sky-200'
                    }`}
                  >
                    {activeIntent.code} ·{' '}
                    {activeIntent.status === 'verified'
                      ? 'VERIFICADO'
                      : activeIntent.status === 'awaiting_review'
                        ? 'EN REVISIÓN'
                        : activeIntent.status === 'rejected'
                          ? 'RECHAZADO'
                          : 'PENDIENTE'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tu Nombre o Capitán
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Ej. Capitán Mateo"
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCreateIntent}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs cursor-pointer"
                  >
                    {activeIntent ? `Nueva Orden (${activeIntent.code})` : '1. Generar Orden MM-...'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Comprobante / CUS / ID Wompi *
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. M94827104 o ID Wompi"
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-xs font-mono-num text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Últimos 4 dígitos tarjeta (opc.)
                  </label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="Ej. 7220"
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-xs font-mono-num text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mensaje para {GAME_CREATOR_NAME} (opcional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¡Gran juego! Apoyo al desarrollo..."
                  className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-rose-500/15 border border-rose-500/40 px-3 py-2 text-xs text-rose-200 flex items-start gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoNotice && (
                <div className="rounded-lg bg-amber-500/15 border border-amber-400/45 px-3 py-2 text-xs text-amber-200 flex items-start gap-1.5">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>{infoNotice}</span>
                </div>
              )}

              {successNotice && (
                <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-xs text-emerald-200 flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>{successNotice}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitting || !activeIntent}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors"
                >
                  {submitting
                    ? 'Validando...'
                    : `2. Verificar Comprobante (${formatCop(Math.max(1000, effectiveAmount))})`}
                </button>
                <button
                  type="button"
                  onClick={checkPendingProfileRewards}
                  title="Comprobar si ya te aprobaron pagos anteriores"
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#102940] hover:bg-[#173b5c] border border-[#2a557c] text-sky-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reclamar</span>
                </button>
              </div>
            </form>

            {/* Creator Verification Panel (PIN Protected) */}
            <div className="rounded-xl bg-[#091a2a] border border-[#1f4263] p-3 space-y-2">
              <button
                type="button"
                onClick={() => setCreatorPanelOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-amber-300 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>Panel del Creador (Confirmar transferencias Nequi / Bre-B)</span>
                </span>
                <span>{creatorPanelOpen ? 'Ocultar' : 'Abrir'}</span>
              </button>

              {creatorPanelOpen && (
                <div className="space-y-2 pt-1 border-t border-[#183550]">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={creatorPin}
                      onChange={(e) => setCreatorPin(e.target.value)}
                      placeholder="PIN del creador (CREATOR_VERIFY_PIN)"
                      className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#06131f] border border-[#274f73] text-xs text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleLoadCreatorQueue}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                    >
                      Revisar
                    </button>
                  </div>
                  {creatorMsg && <div className="text-[11px] text-sky-300">{creatorMsg}</div>}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto deck-scroll">
                    {creatorQueue.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-lg bg-[#06131f] border border-[#1b3c58] p-2 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 truncate">
                            {q.code} · {q.donorName} ({formatCop(q.amountCop)})
                          </div>
                          <div className="font-mono-num text-slate-400 truncate">
                            Ref: {q.reference || '—'} · {q.purpose === 'extra_life' ? 'Vida Extra' : 'Donación'} · [{q.status}]
                          </div>
                        </div>
                        {q.status === 'awaiting_review' && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCreatorDecision(q.id, 'approve')}
                              className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreatorDecision(q.id, 'reject')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supporters Wall */}
            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 flex-1 flex flex-col min-h-[170px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#193855]">
                <div>
                  <h3 className="text-xs font-bold text-slate-100">Muro de Apoyos Verificados</h3>
                  <p className="text-[10px] text-slate-400">
                    {supporterCount} {supporterCount === 1 ? 'apoyo verificado' : 'apoyos verificados'}
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-400/35 text-xs font-mono-num font-bold text-emerald-300">
                  Total: {formatCop(totalCop)}
                </div>
              </div>

              <div className="mt-2 flex-1 overflow-y-auto deck-scroll space-y-1.5 max-h-[190px]">
                {loading && donations.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Cargando...</div>
                ) : donations.length === 0 ? (
                  <div className="text-xs text-slate-400 py-5 text-center leading-relaxed">
                    Aún no hay apoyos verificados. ¡Transfiere a Bre-B{' '}
                    <span className="font-mono-num text-emerald-300">{BRE_B_KEY}</span> o Nequi{' '}
                    <span className="font-mono-num text-sky-300">{NEQUI_NUMBER}</span> y valida tu recibo!
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
