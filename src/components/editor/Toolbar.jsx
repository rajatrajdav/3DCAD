import React from 'react';
import ToolButton from './ToolButton';
import { MousePointer2, Move, RotateCw, Maximize2, Box, Circle, Triangle, Minus, Plus, Copy, Trash2, Undo2, Redo2 } from 'lucide-react';

const GROUPS = [
  {
    label: 'Transform',
    tools: [
      { id: 'select',    icon: <MousePointer2 size={15} />, label: 'Select (Q)' },
      { id: 'move',      icon: <Move size={15} />,          label: 'Move (W)' },
      { id: 'rotate',    icon: <RotateCw size={15} />,      label: 'Rotate (E)' },
      { id: 'scale',     icon: <Maximize2 size={15} />,     label: 'Scale (R)' },
    ],
  },
  {
    label: 'Primitives',
    tools: [
      { id: 'box',       icon: <Box size={15} />,           label: 'Box' },
      { id: 'sphere',    icon: <Circle size={15} />,        label: 'Sphere' },
      { id: 'cone',      icon: <Triangle size={15} />,      label: 'Cone' },
      { id: 'cylinder',  icon: <Minus size={15} />,         label: 'Cylinder' },
    ],
  },
  {
    label: 'Boolean',
    tools: [
      { id: 'union',     icon: <Plus size={15} />,          label: 'Union' },
      { id: 'subtract',  icon: <Minus size={15} />,         label: 'Subtract' },
    ],
  },
  {
    label: 'Edit',
    tools: [
      { id: 'duplicate', icon: <Copy size={15} />,          label: 'Duplicate (Ctrl+D)' },
      { id: 'delete',    icon: <Trash2 size={15} />,        label: 'Delete (Del)' },
    ],
  },
];

export default function Toolbar({ activeTool, onToolChange, onUndo, onRedo, canUndo, canRedo }) {
  return (
    <div className="flex flex-col gap-3 py-3 px-1 shrink-0 overflow-y-auto"
      style={{ background: '#0d1117', borderRight: '1px solid rgba(99,179,237,0.08)', width: 44 }}>
      {/* Undo/Redo */}
      <div className="flex flex-col items-center gap-1">
        <ToolButton icon={<Undo2 size={15} />} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
        <ToolButton icon={<Redo2 size={15} />} label="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />
      </div>
      <div className="w-6 h-px mx-auto" style={{ background: 'rgba(99,179,237,0.1)' }} />
      {GROUPS.map((g, gi) => (
        <div key={g.label} className="flex flex-col items-center gap-1">
          {g.tools.map(t => (
            <ToolButton key={t.id} icon={t.icon} label={t.label} active={activeTool === t.id} onClick={() => onToolChange(t.id)} />
          ))}
          {gi < GROUPS.length - 1 && <div className="w-6 h-px mx-auto mt-1" style={{ background: 'rgba(99,179,237,0.1)' }} />}
        </div>
      ))}
    </div>
  );
}
