import { Check, Gamepad2, Globe, MonitorSmartphone, RotateCcw, Sliders, Volume2, VolumeX, X } from 'lucide-react';
import { DEFAULT_GAME_SETTINGS } from '../game/constants';
import { UPCOMING_LANGUAGES, t, type SupportedLanguage } from '../game/i18n';
import type { GameSettings } from '../game/types';
import { CustomSelect } from './CustomSelect';

interface SettingsModalProps {
  open: boolean;
  sound: boolean;
  language: SupportedLanguage;
  settings: GameSettings;
  gamepadConnected?: boolean;
  onClose: () => void;
  onToggleSound: () => void;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onChangeSettings: (next: Partial<GameSettings>) => void;
  onResetSettings: () => void;
}

export function SettingsModal({
  open,
  sound,
  language,
  settings,
  gamepadConnected = false,
  onClose,
  onToggleSound,
  onChangeLanguage,
  onChangeSettings,
  onResetSettings,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] rounded-2xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1e31] border-b border-[#1c3d5b]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/45 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-50">
                {t(language, 'settings')}
              </h2>
              <p className="text-xs text-slate-300">
                Ajusta controles, tamaño visual, orientación e idioma a tu gusto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuraciones"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-4">
          {/* Audio & Gamepad Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onToggleSound}
              className="min-h-[48px] rounded-xl bg-[#0b1f31] border border-[#1f4263] hover:border-amber-400/60 px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {sound ? (
                  <Volume2 className="w-5 h-5 text-amber-300" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-100">Audio y Efectos</div>
                  <div className="text-xs text-slate-400">
                    {sound ? 'Sonido activado' : 'Silenciado'}
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  sound ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/60 text-slate-300'
                }`}
              >
                {sound ? 'ON' : 'OFF'}
              </span>
            </button>

            <div className="min-h-[48px] rounded-xl bg-[#0b1f31] border border-[#1f4263] px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Gamepad2
                  className={`w-5 h-5 ${gamepadConnected ? 'text-emerald-300' : 'text-slate-400'}`}
                />
                <div>
                  <div className="text-sm font-bold text-slate-100">Control Bluetooth / USB</div>
                  <div className="text-xs text-slate-400">
                    {gamepadConnected
                      ? 'Mando detectado y activo'
                      : 'Conecta un control para jugar al instante'}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  gamepadConnected
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-[#071522] text-slate-400'
                }`}
              >
                {gamepadConnected ? 'ACTIVO' : 'LISTO'}
              </span>
            </div>
          </div>

          {/* Languages */}
          <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Globe className="w-4 h-4" />
              <span>{t(language, 'languages')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onChangeLanguage('es')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-bold flex items-center justify-between cursor-pointer ${
                  language === 'es'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-[#071522] border-[#1f4263] text-slate-200 hover:border-sky-400/50'
                }`}
              >
                <span>🇪🇸 Español</span>
                {language === 'es' && <Check className="w-4 h-4 text-amber-300" />}
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-bold flex items-center justify-between cursor-pointer ${
                  language === 'en'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-[#071522] border-[#1f4263] text-slate-200 hover:border-sky-400/50'
                }`}
              >
                <span>🇺🇸 English</span>
                {language === 'en' && <Check className="w-4 h-4 text-amber-300" />}
              </button>
            </div>

            <div className="pt-1">
              <div className="text-xs font-semibold text-slate-400 mb-1.5">
                Idiomas adicionales en desarrollo:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {UPCOMING_LANGUAGES.map((ul) => (
                  <span
                    key={ul.code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071522] border border-[#183550] text-xs text-slate-300"
                  >
                    <span>{ul.label}</span>
                    <span className="text-[10px] font-bold text-amber-300">
                      · {ul.statusLabel[language]}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sliders & Mobile Orientation / Twin Stick */}
          <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-sky-300">
                <MonitorSmartphone className="w-4 h-4" />
                <span>Tamaño de Controles y Pantalla</span>
              </div>
              <button
                type="button"
                onClick={onResetSettings}
                className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#081726] hover:bg-[#112c45] border border-[#244c70] text-xs font-semibold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200 font-semibold">{t(language, 'hudScale')}</span>
                  <span className="font-mono-num text-amber-300 font-bold">
                    {Math.round(settings.hudScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.25}
                  step={0.05}
                  value={settings.hudScale}
                  onChange={(e) => onChangeSettings({ hudScale: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200 font-semibold">{t(language, 'joystickScale')}</span>
                  <span className="font-mono-num text-amber-300 font-bold">
                    {Math.round(settings.joystickScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.45}
                  step={0.05}
                  value={settings.joystickScale}
                  onChange={(e) => onChangeSettings({ joystickScale: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200 font-semibold">{t(language, 'actionScale')}</span>
                  <span className="font-mono-num text-amber-300 font-bold">
                    {Math.round(settings.actionBtnScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.85}
                  max={1.45}
                  step={0.05}
                  value={settings.actionBtnScale}
                  onChange={(e) => onChangeSettings({ actionBtnScale: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-200 font-semibold">{t(language, 'joystickOpacity')}</span>
                  <span className="font-mono-num text-amber-300 font-bold">
                    {Math.round(settings.joystickOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.35}
                  max={1}
                  step={0.05}
                  value={settings.joystickOpacity}
                  onChange={(e) => onChangeSettings({ joystickOpacity: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-200">
                {t(language, 'orientation')}
              </label>
              <CustomSelect
                value={settings.orientationPref}
                ariaLabel={t(language, 'orientation')}
                onChange={(val) =>
                  onChangeSettings({
                    orientationPref:
                      val === 'landscape' || val === 'portrait' ? val : 'auto',
                  })
                }
                options={[
                  { value: 'auto', label: t(language, 'orientationAuto') },
                  { value: 'landscape', label: t(language, 'orientationLandscape') },
                  { value: 'portrait', label: t(language, 'orientationPortrait') },
                ]}
              />
            </div>

            <button
              type="button"
              onClick={() => onChangeSettings({ twinStickMobile: !settings.twinStickMobile })}
              className="w-full min-h-[44px] px-3 py-2.5 rounded-xl bg-[#071522] border border-[#22476a] hover:border-cyan-400/60 flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-bold text-slate-100">{t(language, 'twinStick')}</div>
                <div className="text-[11px] text-slate-400">
                  Muestra un segundo joystick derecho para apuntar libremente mientras caminas en móvil
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                  settings.twinStickMobile
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.twinStickMobile ? 'ACTIVO' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-[#0a1e31] border-t border-[#1c3d5b] flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Predeterminado: {Math.round(DEFAULT_GAME_SETTINGS.joystickScale * 100)}%
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
