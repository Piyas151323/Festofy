import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT, FOCUS_RING, NavAccent } from './navUtils';

interface BrandLogoProps {
  /** Existing destination for the brand link (kept per area). */
  to: string;
  /** Optional area label, e.g. "Student", "Admin Console", or an organization name. */
  label?: string;
  labelAccent?: NavAccent;
  /** inline: label sits beside the wordmark. stacked: label sits under it. */
  layout?: 'inline' | 'stacked';
  /** Hide the wordmark on very narrow phones (<= 340px), keeping the mark. */
  collapse?: boolean;
  onClick?: () => void;
}

/** The F monogram. Drawn as vector paths so it stays crisp at any density. */
const Monogram: React.FC = () => (
  <span
    aria-hidden="true"
    className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#ff4f1a] ring-1 ring-inset ring-white/15 transition-colors group-hover:bg-[#ff6838]"
  >
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="#fff">
      <path d="M10.5 8h11.8v3.7h-7.6v3.2h6.2v3.6h-6.2V24h-4.2z" />
    </svg>
  </span>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to,
  label,
  labelAccent = 'orange',
  layout = 'inline',
  collapse = false,
  onClick
}) => {
  const accent = ACCENT[labelAccent];
  const hideNarrow = collapse ? 'max-[340px]:hidden' : '';

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label={label ? `Festofy ${label} – home` : 'Festofy – home'}
      className={`group inline-flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1 sm:gap-3 ${FOCUS_RING}`}
    >
      <Monogram />
      {layout === 'stacked' ? (
        <span className={`flex min-w-0 flex-col gap-1 ${hideNarrow}`}>
          <span className="font-heading text-[15px] font-extrabold leading-none tracking-[0.02em] text-white">
            FESTOFY
          </span>
          {label && (
            <span
              className={`truncate font-mono text-[10px] font-semibold uppercase leading-none tracking-wider ${accent.text}`}
            >
              {label}
            </span>
          )}
        </span>
      ) : (
        <span className={`flex min-w-0 items-center gap-2 ${hideNarrow}`}>
          <span className="font-heading text-[18px] font-extrabold leading-none tracking-[0.015em] text-white transition-colors group-hover:text-[#f4f5f7]">
            FESTOFY
          </span>
          {label && (
            <span
              className={`hidden xl:inline-block truncate rounded border px-1.5 py-[3px] font-mono text-[10px] font-semibold uppercase leading-none tracking-wider ${accent.chip}`}
            >
              {label}
            </span>
          )}
        </span>
      )}
    </Link>
  );
};
