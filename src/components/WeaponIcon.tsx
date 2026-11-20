import type { WeaponCategory } from '../game/types';

interface WeaponIconProps {
  weaponId?: string;
  category?: WeaponCategory;
  className?: string;
}

export function WeaponIcon({ weaponId, category, className = 'w-5 h-5' }: WeaponIconProps) {
  if (weaponId === 'tridente_abisal') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M5 19L16 8" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 5l6 6M15 4l3 1-1 3M19 9l1 3-3-1M12 7l-1 3 3-1" stroke="#38bdf8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (weaponId === 'botiquin_marino') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <rect x="4" y="6" width="16" height="13" rx="2.5" fill="#dc2626" stroke="#fecaca" strokeWidth="1.4" />
        <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" stroke="#f8fafc" strokeWidth="1.5" />
        <path d="M12 9.5v6M9 12.5h6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (weaponId === 'hacha_tala') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M5 19L15 9" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M13 5c3.5 0 6 2 6 5.5-2.2.8-4.5.3-6.5-1.5L13 5z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.2" />
      </svg>
    );
  }

  if (weaponId === 'pico_minero') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M5 19L15 9" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M9 5c3.8.5 7 3.7 8.5 8.5" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  switch (category) {
    case 'lanza':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M4 20L16 8" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 6l6-2-2 6-4-4z" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="1.2" />
        </svg>
      );
    case 'espada':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M5 19l3-3m-1.5-1.5l3 3" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 15.5L19 5l.5 3.5-8.5 8.5-2.5-1.5z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.1" />
        </svg>
      );
    case 'arco':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M7 4c6 3.5 6 12.5 0 16" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M7 4v16" stroke="#cbd5e1" strokeWidth="1.1" />
          <path d="M5 12h14m0 0l-3-2.5M19 12l-3 2.5" stroke="#fde047" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'fuego':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M4 11h14v3.5H9.5l-2 4.5H4.5l1.5-5H4V11z" fill="#94a3b8" stroke="#e2e8f0" strokeWidth="1.2" />
          <rect x="17" y="10.5" width="3.5" height="3" rx="0.8" fill="#fbbf24" />
        </svg>
      );
    case 'bomba':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="11" cy="14" r="6" fill="#334155" stroke="#94a3b8" strokeWidth="1.4" />
          <path d="M14.5 9.5L17 7" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18.5" cy="5.5" r="1.8" fill="#f97316" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="5" stroke="#64748b" strokeWidth="1.8" strokeDasharray="3 2" />
        </svg>
      );
  }
}
