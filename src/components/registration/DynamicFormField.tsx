import React from 'react';
import { EventFormField } from '../../types';

interface DynamicFormFieldProps {
  field: EventFormField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  error,
  onChange
}) => {
  const inputId = `custom-field-${field.id}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={inputId}
            name={field.id}
            rows={3}
            placeholder={field.placeholder || 'Enter your response...'}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : field.helpText ? helpId : undefined}
            className={`w-full bg-[#191b20] border rounded-xl px-4 py-2.5 min-h-11 text-sm sm:min-h-0 sm:text-xs text-white placeholder-[#656c80] focus:outline-none focus:ring-1 focus:ring-[#ff4f1a]/40 transition-colors ${
              error
                ? 'border-red-500/80 focus:border-red-500'
                : 'border-[#2e3442] focus:border-[#ff4f1a]'
            }`}
          />
        );

      case 'select':
        return (
          <select
            id={inputId}
            name={field.id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : field.helpText ? helpId : undefined}
            className={`w-full bg-[#191b20] border rounded-xl px-4 py-2.5 min-h-11 text-sm sm:min-h-0 sm:text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#ff4f1a]/40 transition-colors ${
              error
                ? 'border-red-500/80 focus:border-red-500'
                : 'border-[#2e3442] focus:border-[#ff4f1a]'
            }`}
          >
            <option value="" className="bg-[#191b20] text-[#656c80]">
              {field.placeholder || '-- Please select an option --'}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt} className="bg-[#191b20] text-white">
                {opt}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        if (field.options && field.options.length > 0) {
          // Multiple choices checkbox group
          const currentArray: string[] = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2 pt-1">
              {field.options.map((opt) => {
                const isChecked = currentArray.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex min-h-9 items-start gap-2.5 py-1 text-[13px] sm:text-xs text-[#d1d5db] cursor-pointer group select-none"
                  >
                    <input
                      type="checkbox"
                      value={opt}
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange([...currentArray, opt]);
                        } else {
                          onChange(currentArray.filter((x) => x !== opt));
                        }
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded bg-[#191b20] border-[#2e3442] text-[#ff4f1a] focus:ring-0 focus:ring-offset-0 accent-[#ff4f1a]"
                    />
                    <span className="min-w-0 break-words group-hover:text-white transition-colors">{opt}</span>
                  </label>
                );
              })}
            </div>
          );
        }
        // Single boolean checkbox
        return (
          <label className="flex min-h-9 items-start gap-2.5 py-1 text-[13px] sm:text-xs text-[#d1d5db] cursor-pointer group select-none">
            <input
              id={inputId}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              aria-invalid={!!error}
              className="mt-0.5 h-4 w-4 shrink-0 rounded bg-[#191b20] border-[#2e3442] text-[#ff4f1a] focus:ring-0 focus:ring-offset-0 accent-[#ff4f1a]"
            />
            <span className="min-w-0 break-words group-hover:text-white transition-colors">
              {field.placeholder || 'I acknowledge and agree to this requirement'}
            </span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2 pt-1" role="radiogroup" aria-labelledby={`${inputId}-label`}>
            {field.options?.map((opt) => {
              const isChecked = value === opt;
              return (
                <label
                  key={opt}
                  className="flex min-h-9 items-start gap-2.5 py-1 text-[13px] sm:text-xs text-[#d1d5db] cursor-pointer group select-none"
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={isChecked}
                    onChange={() => onChange(opt)}
                    className="mt-0.5 h-4 w-4 shrink-0 bg-[#191b20] border-[#2e3442] text-[#ff4f1a] focus:ring-0 focus:ring-offset-0 accent-[#ff4f1a]"
                  />
                  <span className="min-w-0 break-words group-hover:text-white transition-colors">{opt}</span>
                </label>
              );
            })}
          </div>
        );

      case 'email':
      case 'phone':
      case 'url':
      case 'text':
      default: {
        const inputType =
          field.type === 'email'
            ? 'email'
            : field.type === 'phone'
            ? 'tel'
            : field.type === 'url'
            ? 'url'
            : 'text';

        return (
          <input
            id={inputId}
            type={inputType}
            name={field.id}
            placeholder={
              field.placeholder ||
              (field.type === 'url'
                ? 'https://github.com/username'
                : field.type === 'phone'
                ? '+880 1700-000000'
                : field.type === 'email'
                ? 'participant@university.edu'
                : 'Enter your response...')
            }
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : field.helpText ? helpId : undefined}
            className={`w-full bg-[#191b20] border rounded-xl px-4 py-2.5 min-h-11 text-sm sm:min-h-0 sm:text-xs text-white placeholder-[#656c80] focus:outline-none focus:ring-1 focus:ring-[#ff4f1a]/40 transition-colors ${
              error
                ? 'border-red-500/80 focus:border-red-500'
                : 'border-[#2e3442] focus:border-[#ff4f1a]'
            }`}
          />
        );
      }
    }
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          id={`${inputId}-label`}
          htmlFor={field.type === 'radio' ? undefined : inputId}
          className="block text-[13px] sm:text-xs font-medium text-[#d1d5db] break-words"
        >
          <span>{field.label}</span>
          {field.required ? (
            <span className="ml-1 text-[#ff4f1a] font-bold" title="Required field">*</span>
          ) : (
            <span className="ml-1 text-[10px] text-[#656c80]">(Optional)</span>
          )}
        </label>
      </div>

      {renderInput()}

      {field.helpText && !error && (
        <p id={helpId} className="text-[11px] text-[#656c80] leading-tight">
          {field.helpText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-400 font-medium flex items-center gap-1 break-words">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
