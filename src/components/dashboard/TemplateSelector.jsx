import React from 'react';
import { Box, Circle, Triangle, Layers } from 'lucide-react';

const TEMPLATES = [
  { id: 'blank',        label: 'Blank',         icon: <Box size={22} />,      desc: 'Start from scratch' },
  { id: 'mechanical',   label: 'Mechanical',    icon: <Layers size={22} />,   desc: 'Gears, brackets, housings' },
  { id: 'architecture', label: 'Architecture',  icon: <Triangle size={22} />, desc: 'Buildings & structures' },
  { id: 'organic',      label: 'Organic',       icon: <Circle size={22} />,   desc: 'Smooth freeform shapes' },
];

export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TEMPLATES.map(t => (
        <button key={t.id} type="button" onClick={() => onChange(t.id)}
          className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-all"
          style={{
            background: value === t.id ? 'rgba(99,179,237,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${value === t.id ? 'rgba(99,179,237,0.5)' : 'rgba(255,255,255,0.07)'}`,
            color: value === t.id ? '#63b3ed' : '#64748b',
          }}>
          {t.icon}
          <div>
            <div className="text-xs font-semibold" style={{ color: value === t.id ? '#63b3ed' : '#cbd5e1' }}>{t.label}</div>
            <div className="text-[10px] text-slate-500">{t.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
