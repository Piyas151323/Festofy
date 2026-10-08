import React from 'react';

/**
 * Shared public page container. Width matches the header/footer (max-w-7xl)
 * so page content lines up with the navigation instead of sitting in a
 * narrower column.
 */
export const PageContainer: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children
}) => (
  <div className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 ${className}`}>
    {children}
  </div>
);
