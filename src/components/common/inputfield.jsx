import React from 'react';

export default function InputField({ label, type = 'text', value, onChange, placeholder, required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
      />
    </div>
  );
}
