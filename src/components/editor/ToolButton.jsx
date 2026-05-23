import React from 'react';
import Tooltip from '../common/tooltip';

export default function ToolButton({ icon, label, active, onClick, disabled }) {
  return (
    <Tooltip text={label} position="right">
      <button onClick={onClick} disabled={disabled}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: active ? 'rgba(99,179,237,0.15)' : 'transparent',
          color: active ? '#63b3ed' : '#475569',
          border: active ? '1px solid rgba(99,179,237,0.3)' : '1px solid transparent',
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!active && !disabled) e.currentTarget.style.color = '#94a3b8'; }}
        onMouseLeave={e => { if (!active && !disabled) e.currentTarget.style.color = '#475569'; }}>
        {icon}
      </button>
    </Tooltip>
  );
}
