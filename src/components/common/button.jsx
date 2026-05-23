import React from 'react';

export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus:outline-none';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-400 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
    ghost: 'bg-transparent hover:bg-slate-700 text-slate-300',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    outline: 'bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-500/10',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {children}
    </button>
  );
}
