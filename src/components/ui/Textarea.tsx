import React, { forwardRef } from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      error,
      helperText,
      className = '',
      disabled,
      'aria-describedby': ariaDescribedBy,
      rows = 3,
      ...rest
    },
    ref
  ) => {
    const errorId = id && error ? `${id}-error` : undefined;
    const helperId = id && helperText && !error ? `${id}-helper` : undefined;
    const describedBy = ariaDescribedBy || errorId || helperId || undefined;

    return (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full py-2.5 px-3.5 rounded-xl bg-[#191b20] border text-base sm:text-sm text-[#f4f5f7] placeholder-[#656c80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] disabled:opacity-50 disabled:cursor-not-allowed resize-y ${
          error
            ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
            : 'border-[#2e3442] hover:border-[#3d4556]'
        } ${className}`}
        {...rest}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
