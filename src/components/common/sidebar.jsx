import React from 'react';
import Tooltip from './tooltip';

export default function Sidebar({ items = [], activeId, onSelect, side = 'left' }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1 shrink-0"
      style={{ background: '#0d1117', borderRight: side === 'left' ? '1px solid rgba(99,179,237,0.08)' : 'none', borderLeft: side === 'right' ? '1px solid rgba(99,179,237,0.08)' : 'none', width: 44 }}>
      {items.map(item => (
        <Tooltip key={item.id} text={item.label} position={side === 'left' ? 'right' : 'left'}>
          <button
            onClick={() => onSelect(item.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: activeId === item.id ? 'rgba(99,179,237,0.15)' : 'transparent',
              color: activeId === item.id ? '#63b3ed' : '#475569',
              border: activeId === item.id ? '1px solid rgba(99,179,237,0.3)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (activeId !== item.id) e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { if (activeId !== item.id) e.currentTarget.style.color = '#475569'; }}>
            {item.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
