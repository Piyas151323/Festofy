import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  List,
  Type,
  AlignLeft,
  CheckSquare,
  Radio,
  Mail,
  Phone,
  Link2
} from 'lucide-react';
import { EventFormField, FormFieldType } from '../../types';

interface FormFieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: EventFormField) => void;
  initialField?: EventFormField | null;
}

const FIELD_TYPE_OPTIONS: {
  type: FormFieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  hasOptions: boolean;
}[] = [
  {
    type: 'text',
    label: 'Short Text',
    description: 'Single-line answer (e.g. Roll number, GitHub username)',
    icon: Type,
    hasOptions: false
  },
  {
    type: 'textarea',
    label: 'Paragraph / Long Text',
    description: 'Multi-line detailed answer (e.g. Project abstract, Experience)',
    icon: AlignLeft,
    hasOptions: false
  },
  {
    type: 'select',
    label: 'Dropdown (Select)',
    description: 'Single choice from a dropdown menu',
    icon: List,
    hasOptions: true
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    description: 'Single choice displayed as radio options',
    icon: Radio,
    hasOptions: true
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    description: 'Multiple selection choices or agreement confirmation',
    icon: CheckSquare,
    hasOptions: true
  },
  {
    type: 'email',
    label: 'Email Address',
    description: 'Validated student or parent email address',
    icon: Mail,
    hasOptions: false
  },
  {
    type: 'phone',
    label: 'Phone Number',
    description: 'Validated phone or emergency contact number',
    icon: Phone,
    hasOptions: false
  },
  {
    type: 'url',
    label: 'Website / URL',
    description: 'Validated web link, portfolio, or repo URL',
    icon: Link2,
    hasOptions: false
  }
];

export const FormFieldEditorModal: React.FC<FormFieldEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialField
}) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FormFieldType>('text');
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialField) {
      setLabel(initialField.label || '');
      setType(initialField.type || 'text');
      setRequired(Boolean(initialField.required));
      setPlaceholder(initialField.placeholder || '');
      setHelpText(initialField.helpText || '');
      setOptions(initialField.options ? [...initialField.options] : []);
    } else {
      setLabel('');
      setType('text');
      setRequired(false);
      setPlaceholder('');
      setHelpText('');
      setOptions([]);
    }
    setNewOptionInput('');
    setError(null);
  }, [initialField, isOpen]);

  if (!isOpen) return null;

  const currentTypeConfig = FIELD_TYPE_OPTIONS.find((t) => t.type === type) || FIELD_TYPE_OPTIONS[0];

  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      setError(`Option "${trimmed}" already exists.`);
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setNewOptionInput('');
    setError(null);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddPresetOptions = (preset: string[]) => {
    const combined = Array.from(new Set([...options, ...preset]));
    setOptions(combined);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setError('Question label / title is required.');
      return;
    }

    if (currentTypeConfig.hasOptions && options.length === 0) {
      setError(`Please add at least one choice option for ${currentTypeConfig.label}.`);
      return;
    }

    const field: EventFormField = {
      id: initialField?.id || `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: cleanLabel,
      type,
      required,
      ...(placeholder.trim() ? { placeholder: placeholder.trim() } : {}),
      ...(helpText.trim() ? { helpText: helpText.trim() } : {}),
      ...(currentTypeConfig.hasOptions && options.length > 0 ? { options: [...options] } : {})
    };

    onSave(field);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-[#14161a] border border-[#2e3442] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#242730] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff4f1a]/15 text-[#ff4f1a] flex items-center justify-center">
              <currentTypeConfig.icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-white">
                {initialField ? 'Edit Question Field' : 'Add Question Field'}
              </h3>
              <p className="text-[11px] text-[#9da3b4]">
                Configure field type, options, and validation rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Label */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Question Label / Prompt *</span>
              <span className="text-[10px] text-zinc-500 font-normal">What participants see</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. GitHub Repository URL, T-Shirt Size, Track Preference"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              autoFocus
            />
          </div>

          {/* Field Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Question Response Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIELD_TYPE_OPTIONS.map((item) => {
                const isSelected = type === item.type;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setType(item.type);
                      if (error) setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                      isSelected
                        ? 'bg-[#1e222b] border-[#ff4f1a] text-white shadow-sm'
                        : 'bg-[#191b20] border-[#242730] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#ff4f1a]' : 'text-zinc-400'}`} />
                      {isSelected && <Check className="w-3 h-3 text-[#ff4f1a]" />}
                    </div>
                    <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 pt-0.5">{currentTypeConfig.description}</p>
          </div>

          {/* Choices / Options for select, radio, checkbox */}
          {currentTypeConfig.hasOptions && (
            <div className="p-3.5 rounded-xl bg-[#191b20] border border-[#2e3442] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200">
                  Choice Options ({options.length}) *
                </label>
                {/* Presets */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPresetOptions(['Yes', 'No'])}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#14161a] border border-[#2e3442] text-zinc-300 hover:text-white"
                  >
                    Yes/No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetOptions(['S', 'M', 'L', 'XL', 'XXL'])}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#14161a] border border-[#2e3442] text-zinc-300 hover:text-white"
                  >
                    Sizes
                  </button>
                </div>
              </div>

              {/* Add Option Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Add an option choice (e.g. Beginner, Option A)"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff4f1a]"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOptionInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Options List */}
              {options.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#14161a] border border-[#242730] text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                        <span className="truncate">{opt}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5"
                        title="Remove option"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-400/90 italic">
                  No choices added yet. Add at least one option for participants to select.
                </p>
              )}
            </div>
          )}

          {/* Placeholder / Help text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Placeholder Text</label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g. Enter full project title..."
                className="w-full px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Help / Subtext</label>
              <input
                type="text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="e.g. Maximum 200 characters"
                className="w-full px-3 py-2 rounded-xl bg-[#191b20] border border-[#2e3442] text-xs text-white placeholder-[#656c80] focus:outline-none focus:border-[#ff4f1a]"
              />
            </div>
          </div>

          {/* Required Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#191b20] border border-[#242730] text-xs text-zinc-300 cursor-pointer hover:border-zinc-600 transition-colors">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-[#ff4f1a] focus:ring-0 accent-[#ff4f1a]"
              />
              <div className="flex-1">
                <span className="font-semibold text-white">Mandatory Response</span>
                <p className="text-[11px] text-zinc-400">
                  Participants must complete this question to finish registration.
                </p>
              </div>
            </label>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242730]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 bg-[#191b20] border border-[#2e3442] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-heading text-xs font-bold text-white bg-[#ff4f1a] hover:bg-[#ff6838] transition-all shadow-md shadow-[#ff4f1a]/20 cursor-pointer"
            >
              {initialField ? 'Update Question' : 'Add to Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
