import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      error,
      helperText,
      children,
      className = '',
      disabled,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref
  ) => {
    const errorId = id && error ? `${id}-error` : undefined;
    const helperId = id && helperText && !error ? `${id}-helper` : undefined;
    const describedBy = ariaDescribedBy || errorId || helperId || undefined;

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full min-h-[42px] py-2.5 pl-3.5 pr-10 rounded-xl bg-[#191b20] border text-base sm:text-sm text-[#f4f5f7] transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
              : 'border-[#2e3442] hover:border-[#3d4556]'
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#656c80]">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
