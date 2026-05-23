import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

const COMMANDS = {
  help:   () => 'Commands: box, sphere, cone, cylinder, clear, help',
  clear:  (_, setLog) => { setLog([]); return null; },
  box:    () => 'Hint: Use the toolbar to add a Box primitive.',
  sphere: () => 'Hint: Use the toolbar to add a Sphere primitive.',
  cone:   () => 'Hint: Use the toolbar to add a Cone primitive.',
  cylinder: () => 'Hint: Use the toolbar to add a Cylinder primitive.',
};

export default function CommandLine() {
  const [input, setInput] = useState('');
  const [log, setLog] = useState([{ type: 'info', text: 'Type "help" for available commands.' }]);
  const [open, setOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const run = e => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    setLog(l => [...l, { type: 'cmd', text: `> ${cmd}` }]);
    const fn = COMMANDS[cmd];
    const result = fn ? fn(cmd, setLog) : `Unknown command: "${cmd}"`;
    if (result) setLog(l => [...l, { type: fn ? 'info' : 'error', text: result }]);
    setInput('');
  };

  return (
    <div style={{ background: '#0a0f1e', borderTop: '1px solid rgba(99,179,237,0.08)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 w-full text-left transition-colors hover:bg-slate-800/50"
        style={{ color: '#475569' }}>
        <Terminal size={12} />
        <span className="text-[11px]">Command Line</span>
      </button>
      {open && (
        <div style={{ height: 120 }} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] space-y-0.5">
            {log.map((l, i) => (
              <div key={i} style={{ color: l.type === 'cmd' ? '#63b3ed' : l.type === 'error' ? '#fc8181' : '#64748b' }}>{l.text}</div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={run} className="flex items-center gap-2 px-3 py-1.5" style={{ borderTop: '1px solid rgba(99,179,237,0.06)' }}>
            <span className="text-[11px] font-mono" style={{ color: '#63b3ed' }}>&gt;</span>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter command…"
              className="flex-1 bg-transparent text-[11px] font-mono text-slate-300 outline-none placeholder:text-slate-700" />
          </form>
        </div>
      )}
    </div>
  );
}
