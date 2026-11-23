export type SupportedLanguage = 'es' | 'en';

export interface UpcomingLanguageOption {
  code: string;
  label: string;
  statusLabel: Record<SupportedLanguage, string>;
}

export const UPCOMING_LANGUAGES: UpcomingLanguageOption[] = [
  { code: 'pt', label: 'Português', statusLabel: { es: 'Próximamente', en: 'Coming Soon' } },
  { code: 'fr', label: 'Français', statusLabel: { es: 'Próximamente', en: 'Coming Soon' } },
  { code: 'it', label: 'Italiano', statusLabel: { es: 'Próximamente', en: 'Coming Soon' } },
  { code: 'de', label: 'Deutsch', statusLabel: { es: 'Próximamente', en: 'Coming Soon' } },
  { code: 'ja', label: '日本語', statusLabel: { es: 'Próximamente', en: 'Coming Soon' } },
];

const DICTIONARY: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    gameTitle: 'Marea Mutante',
    subtitle: 'El Océano de las Cenizas Saladas · Menú de Ultratumba',
    underworldMenu: 'Menú de Ultratumba',
    newGame: 'Nueva Partida',
    continueGame: 'Continuar Partida',
    saveGame: 'Guardar Partida',
    resumeGame: 'Reanudar Partida',
    settings: 'Configuraciones',
    account: 'Cuenta de Usuario',
    languages: 'Idiomas',
    donations: 'Donaciones Bre-B / Nequi',
    credits: 'Créditos',
    installApp: 'Instalar App / APK',
    comingSoon: 'Próximamente',
    languageEs: 'Español (Activo)',
    languageEn: 'English',
    hudScale: 'Escala del HUD',
    joystickScale: 'Tamaño del Joystick',
    joystickOpacity: 'Opacidad de Controles',
    actionScale: 'Tamaño Botones de Acción',
    orientation: 'Orientación de Pantalla',
    orientationAuto: 'Automática (Girar Horizontal / Vertical)',
    orientationLandscape: 'Preferir Horizontal',
    orientationPortrait: 'Preferir Vertical',
    twinStick: 'Doble Joystick Táctil (Mover + Apuntar)',
    saveSuccess: '¡Partida guardada en el diario de a bordo!',
    deleteAccount: 'Eliminar cuenta',
    gamepadConnected: 'Control Bluetooth conectado',
    fullscreen: 'Pantalla Completa',
    exitFullscreen: 'Salir Pantalla Completa',
    autoFullscreen: 'Pantalla Completa Automática (Ocultar barra móvil)',
  },
  en: {
    gameTitle: 'Mutant Tide',
    subtitle: 'Ocean of Salted Ashes · Underworld Menu',
    underworldMenu: 'Underworld Menu',
    newGame: 'New Game',
    continueGame: 'Continue Game',
    saveGame: 'Save Game',
    resumeGame: 'Resume Game',
    settings: 'Settings',
    account: 'User Account',
    languages: 'Languages',
    donations: 'Donations Bre-B / Nequi',
    credits: 'Credits',
    installApp: 'Install App / APK',
    comingSoon: 'Coming Soon',
    languageEs: 'Español',
    languageEn: 'English (Active)',
    hudScale: 'HUD Scale',
    joystickScale: 'Joystick Size',
    joystickOpacity: 'Controls Opacity',
    actionScale: 'Action Buttons Size',
    orientation: 'Screen Orientation',
    orientationAuto: 'Automatic (Portrait ↔ Landscape)',
    orientationLandscape: 'Prefer Landscape',
    orientationPortrait: 'Prefer Portrait',
    twinStick: 'Twin-Stick Touch (Move + Aim)',
    saveSuccess: 'Game saved to captain logbook!',
    deleteAccount: 'Delete Account',
    gamepadConnected: 'Bluetooth Controller Connected',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    autoFullscreen: 'Auto Fullscreen (Hide Mobile Nav Bar)',
  },
};

export function t(lang: SupportedLanguage | undefined, key: string): string {
  const safeLang: SupportedLanguage = lang === 'en' ? 'en' : 'es';
  return DICTIONARY[safeLang][key] || DICTIONARY.es[key] || key;
}
