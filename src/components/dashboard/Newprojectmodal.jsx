import React, { useState } from 'react';
import Modal from '../common/model';
import InputField from '../common/inputfield';
import TemplateSelector from './TemplateSelector';
import Button from '../common/button';

export default function NewProjectModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('blank');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Project name is required.'); return; }
    onCreate({ name: name.trim(), template });
    setName('');
    setTemplate('blank');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" width="max-w-sm">
      <div className="space-y-4">
        <InputField label="Project name" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="My awesome model" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div>
          <p className="text-xs text-slate-400 mb-2">Template</p>
          <TemplateSelector value={template} onChange={setTemplate} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleCreate} className="flex-1">Create Project</Button>
        </div>
      </div>
    </Modal>
  );
}
