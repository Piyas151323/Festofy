import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  documentTitle?: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  documentTitle,
  description,
  badge,
  backTo,
  backLabel = 'Back',
  actions,
  className = ''
}) => {
  useEffect(() => {
    const pageTitle = documentTitle || title;
    document.title = `${pageTitle} · Festofy`;
  }, [title, documentTitle]);

  return (
    <div className={`mb-6 sm:mb-8 space-y-3 ${className}`}>
      {backTo && (
        <div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9da3b4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          {badge && <div className="mb-1">{badge}</div>}
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#9da3b4] max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
