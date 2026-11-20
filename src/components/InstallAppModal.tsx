import {
  CheckCircle2,
  Download,
  ExternalLink,
  FolderGit2,
  Share,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallAppButton({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          void install();
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] cursor-pointer shadow-sm transition-colors whitespace-nowrap"
        title="Instalar Marea Mutante como aplicación en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenGuide}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-semibold text-[11px] cursor-pointer transition-colors whitespace-nowrap"
      title={isIOS ? 'Instalar en iPhone / iPad' : 'Instalar en Android o compilar .APK'}
    >
      <Smartphone className="w-3.5 h-3.5 text-sky-300" />
      <span>{isIOS ? 'Instalar iOS' : 'Android / APK'}</span>
    </button>
  );
}

export function InstallAppModal({ open, onClose }: InstallAppModalProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [installedJustNow, setInstalledJustNow] = useState(false);

  if (!open) return null;

  const handleDirectInstall = async () => {
    const ok = await install();
    if (ok) {
      setInstalledJustNow(true);
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="w-full max-w-2xl max-h-[92vh] rounded-xl bg-[#071625] border border-sky-400/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1f33] border-b border-[#1b3c58]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/45 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-50">
                Instalar Marea Mutante en Android / Móvil (.APK & App)
              </h2>
              <p className="text-[11px] text-sky-300">
                Instalación directa en tu teléfono + Proyecto Android Capacitor listo para compilar .APK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer"
            aria-label="Cerrar instalación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-3.5 text-xs text-slate-200">
          {/* Option 1: Direct Install on Android / Desktop */}
          <div className="rounded-xl bg-[#0b1f31] border border-emerald-400/45 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <Download className="w-4 h-4" />
                <span>Opción 1: Instalar ahora mismo en Android (Sin espera)</span>
              </div>
              {(isInstalled || installedJustNow) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-bold text-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Instalada
                </span>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">
              La app ya está configurada como <b className="text-slate-100">PWA instalable en pantalla completa</b>{' '}
              (con su ícono oficial y soporte sin conexión). En Android se instala como aplicación nativa
              generando un paquete WebAPK verificado por Chrome sin necesidad de habilitar orígenes desconocidos.
            </p>

            {isInstallable && !installedJustNow ? (
              <button
                type="button"
                onClick={() => {
                  void handleDirectInstall();
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Marea Mutante en este dispositivo</span>
              </button>
            ) : isIOS ? (
              <div className="rounded-lg bg-[#071522] border border-[#1d3e5e] p-3 space-y-1.5">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" />
                  <span>Pasos en iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Abre esta página en <b>Safari</b>.</li>
                  <li>Pulsa el botón <b>Compartir</b> en la barra inferior.</li>
                  <li>Selecciona <b>Añadir a pantalla de inicio</b> y confirma.</li>
                </ol>
              </div>
            ) : (
              <div className="rounded-lg bg-[#071522] border border-[#1d3e5e] p-3 space-y-1.5">
                <div className="font-bold text-sky-300">
                  {isAndroid
                    ? 'Pasos rápidos en Chrome (Android):'
                    : 'Cómo instalarla en tu celular Android:'}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Abre la URL de la app en <b>Google Chrome</b> desde tu teléfono Android (si estás
                    dentro de una vista previa embebida, ábrela en pestaña nueva).
                  </li>
                  <li>
                    Toca el menú <b>⋮</b> arriba a la derecha y pulsa{' '}
                    <b className="text-emerald-300">Instalar aplicación</b> (o{' '}
                    <b>Añadir a pantalla principal</b>).
                  </li>
                  <li>Acepta y aparecerá el ícono de <b>Marea Mutante</b> en tu menú de apps.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Option 2: Real APK Compilation via Capacitor */}
          <div className="rounded-xl bg-[#0b1f31] border border-amber-400/45 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <FolderGit2 className="w-4 h-4" />
              <span>Opción 2: Generar archivo binario .APK instalable (Capacitor Android)</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Este entorno web no incluye el SDK de Android ni Gradle para compilar binarios directamente en
              línea, pero ya dejé configurado todo el proyecto nativo Android en la carpeta{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#05121e] text-amber-200">/android</code> y el flujo
              automático en{' '}
              <code className="px-1.5 py-0.5 rounded bg-[#05121e] text-amber-200">
                .github/workflows/build-apk.yml
              </code>
              .
            </p>

            <div className="rounded-lg bg-[#05121e] border border-[#1d3e5e] p-3 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Forma más rápida (GitHub Actions — sin instalar Android Studio):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Sube/exporta este proyecto a un repositorio en GitHub.</li>
                <li>
                  Ve a la pestaña <b>Actions → Build Android APK</b> (se ejecuta automático o con{' '}
                  <i>Run workflow</i>).
                </li>
                <li>
                  Descarga el archivo <b className="text-amber-300">MareaMutante-debug.apk</b> en la
                  sección <i>Artifacts</i> e instálalo en tu Android.
                </li>
              </ol>
            </div>

            <div className="rounded-lg bg-[#05121e] border border-[#1d3e5e] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Terminal className="w-3.5 h-3.5 text-emerald-300" />
                <span>Compilar manualmente en tu PC (Android Studio / Java 17):</span>
              </div>
              <pre className="text-[11px] font-mono-num text-emerald-300 overflow-x-auto leading-relaxed">
{`npm install
npm run android:sync
cd android && ./gradlew assembleDebug`}
              </pre>
              <div className="text-[10px] text-slate-400">
                Salida del APK: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-[#0a1f33] border-t border-[#1b3c58] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
