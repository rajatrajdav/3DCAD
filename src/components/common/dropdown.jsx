import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ label, options = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && <div className="text-xs text-slate-400 mb-1">{label}</div>}
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 hover:border-slate-500 transition-colors">
        <span>{selected?.label ?? 'Select…'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-700 ${o.value === value ? 'text-blue-400' : 'text-slate-200'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
