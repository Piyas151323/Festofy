import React, { useState } from 'react';
import { Eye, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventFormField } from '../../types';
import { DynamicFormField } from './DynamicFormField';

interface LiveFormPreviewProps {
  fields: EventFormField[];
  title?: string;
  className?: string;
}

export const LiveFormPreview: React.FC<LiveFormPreviewProps> = ({
  fields,
  title = 'Student Form Preview',
  className = ''
}) => {
  const [testResponses, setTestResponses] = useState<Record<string, any>>({});
  const [testErrors, setTestErrors] = useState<Record<string, string>>({});
  const [hasValidated, setHasValidated] = useState(false);

  const handleFieldChange = (fieldId: string, val: any) => {
    setTestResponses((prev) => ({
      ...prev,
      [fieldId]: val
    }));
    if (testErrors[fieldId]) {
      setTestErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleTestValidate = () => {
    const errors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required) {
        const val = testResponses[f.id];
        if (val === undefined || val === null || val === '') {
          errors[f.id] = `${f.label} is required.`;
        } else if (f.type === 'checkbox' && Array.isArray(val) && val.length === 0) {
          errors[f.id] = `Please select at least one option.`;
        } else if (f.type === 'checkbox' && typeof val === 'boolean' && !val) {
          errors[f.id] = `Confirmation required.`;
        }
      }
    });
    setTestErrors(errors);
    setHasValidated(true);
  };

  const handleReset = () => {
    setTestResponses({});
    setTestErrors({});
    setHasValidated(false);
  };

  if (fields.length === 0) {
    return (
      <div className={`p-8 rounded-2xl bg-[#14161a] border border-[#242730] text-center space-y-2 ${className}`}>
        <Eye className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="font-heading text-sm font-semibold text-white">No Questions in Form</h4>
        <p className="text-xs text-[#9da3b4] max-w-sm mx-auto">
          Add custom questions or choose a saved template to preview how students will answer them.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-[#14161a] border border-[#2e3442] overflow-hidden ${className}`}>
      {/* Preview Banner */}
      <div className="px-5 py-3 bg-[#191b20] border-b border-[#242730] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-heading text-xs font-bold text-white tracking-wide uppercase">
            {title}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14161a] text-zinc-400 border border-[#2e3442]">
            {fields.length} {fields.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestValidate}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Simulate student validation check"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Test Validation</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset test values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Form Body */}
      <div className="p-5 space-y-4">
        <div className="p-3 rounded-xl bg-[#191b20]/60 border border-[#242730] text-[11px] text-[#9da3b4] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#ff4f1a] shrink-0" />
          <span>
            Interactive test preview: Enter answers below to test formatting and responsiveness as students will see it.
          </span>
        </div>

        {hasValidated && Object.keys(testErrors).length === 0 && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>All required questions satisfied! Form submission would succeed.</span>
          </div>
        )}

        {hasValidated && Object.keys(testErrors).length > 0 && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {Object.keys(testErrors).length} required {Object.keys(testErrors).length === 1 ? 'question is' : 'questions are'} incomplete.
            </span>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {fields.map((field) => (
            <div key={field.id} className="p-3.5 rounded-xl bg-[#191b20] border border-[#242730]">
              <DynamicFormField
                field={field}
                value={testResponses[field.id]}
                error={testErrors[field.id]}
                onChange={(val) => handleFieldChange(field.id, val)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
