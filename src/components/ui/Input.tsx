import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      error,
      helperText,
      leftIcon,
      rightIcon,
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
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#656c80] z-10">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`w-full min-h-[42px] py-2.5 rounded-xl bg-[#191b20] border text-base sm:text-sm text-[#f4f5f7] placeholder-[#656c80] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4f1a]/50 focus:border-[#ff4f1a] disabled:opacity-50 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
              : 'border-[#2e3442] hover:border-[#3d4556]'
          } ${className}`}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-[#656c80] z-10">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
