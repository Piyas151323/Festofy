import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  backLink?: {
    to: string;
    label: string;
  };
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  syncDocumentTitle?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backLink,
  breadcrumb,
  actions,
  syncDocumentTitle = true,
  className = '',
}) => {
  useEffect(() => {
    if (syncDocumentTitle && title) {
      document.title = `${title} · Festofy`;
    }
  }, [title, syncDocumentTitle]);

  return (
    <div className={`space-y-3 pb-6 border-b border-[#242730] ${className}`}>
      {backLink && (
        <div>
          <Link
            to={backLink.to}
            className="inline-flex items-center gap-1.5 text-xs text-[#8a91a6] hover:text-[#f4f5f7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f1a] rounded px-1 -ml-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{backLink.label}</span>
          </Link>
        </div>
      )}

      {breadcrumb && <div className="text-xs text-[#8a91a6]">{breadcrumb}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#f4f5f7] tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[#8a91a6] max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
