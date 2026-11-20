import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  ariaLabel,
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#06131f] border border-[#274f73] hover:border-amber-400/75 text-sm text-slate-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <span className="truncate text-left">{current ? current.label : placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-sky-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto deck-scroll rounded-xl bg-[#071828] border border-[#2b5880] shadow-2xl p-1 space-y-0.5"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  active
                    ? 'bg-amber-400/20 border border-amber-400/50 text-amber-200 font-bold'
                    : 'text-slate-200 hover:bg-[#102d48]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
