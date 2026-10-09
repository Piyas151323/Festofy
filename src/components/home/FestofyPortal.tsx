import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { GlyphPortal } from '../ui/glyph-portal';
import { FOCUS_RING } from '../navigation/navUtils';

const FEATURES = [
  {
    title: 'Discover Campus Events',
    body: 'Find festivals, competitions, workshops, and other campus activities in one place.',
  },
  {
    title: 'Register and Participate',
    body: 'Explore event details, complete registrations, and keep track of upcoming activities.',
  },
  {
    title: 'Organize with Confidence',
    body: 'Give student organizations a structured way to manage events and participant registrations.',
  },
];

const Eyebrow: React.FC = () => (
  <div className="mb-1.5 inline-flex max-w-full items-center gap-2 rounded-xl border border-[#2e3442] bg-[#191b20] px-3 py-1.5 text-[10px] font-semibold uppercase leading-snug tracking-[0.08em] text-[#ff4f1a] min-[420px]:text-[11px] min-[420px]:tracking-[0.1em] sm:mb-0 sm:rounded-full sm:px-3.5 sm:text-xs sm:tracking-wider">
    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4f1a]" />
    <span className="text-balance text-center">Event operations for student organizations</span>
  </div>
);

const Supporting: React.FC<{ onStepInside?: () => void }> = ({ onStepInside }) => (
  <div className="flex w-full max-w-2xl flex-col items-center">
    <div className="font-heading text-[clamp(1.125rem,5.2vw,1.375rem)] font-semibold leading-tight text-[#f4f5f7] sm:text-2xl lg:text-3xl">
      Plan. Discover. Participate.
    </div>
    <p className="mt-2 max-w-[21rem] text-pretty text-[13.5px] leading-[1.6] text-[#9da3b4] sm:mt-3 sm:max-w-md sm:text-sm md:max-w-xl md:text-base">
      One home for festivals, events, registrations and participants, built for the clubs that run them and the students who show up.
    </p>
    {onStepInside && (
      <div className="pointer-events-auto mt-5 flex items-center justify-center sm:mt-6">
        <button
          type="button"
          onClick={onStepInside}
          aria-label="Step inside interactive portal"
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff4f1a] px-6 text-[13px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#ff6838] active:scale-[0.98] active:bg-[#e8441a] sm:px-7 sm:text-sm ${FOCUS_RING}`}
        >
          <span>Step inside</span>
          <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    )}
  </div>
);

const Features: React.FC<{ showHeading?: boolean }> = ({ showHeading = true }) => (
  <div className="w-full max-w-5xl text-left">
    {showHeading && (
      <h2 className="font-heading max-w-2xl text-balance text-[clamp(1.75rem,8.4vw,2.25rem)] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl sm:leading-tight">
        One home for every campus event.
      </h2>
    )}
    <ol
      className={`grid list-none grid-cols-1 border-b border-[#ff4f1a]/25 md:grid-cols-3 md:gap-10 md:border-b-0 ${
        showHeading ? 'mt-4 sm:mt-6 md:mt-12' : ''
      }`}
    >
      {FEATURES.map(({ title, body }, i) => (
        <li
          key={title}
          className="grid grid-cols-[1.75rem_1fr] items-baseline border-t border-[#ff4f1a]/25 py-3 sm:grid-cols-[2.25rem_1fr] sm:py-4 md:grid-cols-[auto_1fr] md:gap-x-3 md:border-[#ff4f1a]/40 md:pb-0 md:pt-4"
        >
          <span className="text-[11px] font-semibold tabular-nums tracking-wider text-[#ff4f1a] md:text-xs">
            0{i + 1}
          </span>
          <h3 className="font-heading text-[15px] font-semibold leading-snug text-white md:text-lg">
            {title}
          </h3>
          <p className="col-start-2 mt-1 text-[13px] leading-[1.5] text-[#9da3b4] min-[380px]:text-sm md:col-span-2 md:col-start-1 md:mt-2 md:leading-relaxed">
            {body}
          </p>
        </li>
      ))}
    </ol>
    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:gap-4 md:mt-10">
      <Link
        to="/fests"
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff4f1a] px-3 text-[13px] font-semibold whitespace-nowrap text-white shadow-md min-[360px]:px-4 shadow-[#ff4f1a]/15 transition-[background-color,transform] duration-150 hover:bg-[#ff6838] active:scale-[0.98] active:bg-[#e8441a] sm:w-auto sm:px-7 sm:text-sm ${FOCUS_RING}`}
      >
        Explore Fests <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        to="/events"
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2e3442] bg-[#14161a] px-3 text-[13px] font-semibold whitespace-nowrap text-[#f4f5f7] min-[360px]:px-4 transition-[background-color,transform] duration-150 hover:bg-[#1e222b] active:scale-[0.98] sm:w-auto sm:px-7 sm:text-sm ${FOCUS_RING}`}
      >
        View Events
      </Link>
    </div>
  </div>
);

/** Static version: reduced motion, or if the animation can't initialise. */
const StaticHero: React.FC = () => (
  <section className="relative overflow-hidden border-b border-[#242730] bg-gradient-to-b from-[#121316] via-[#090a0b] to-[#090a0b] pb-10 pt-10 sm:pb-14 sm:pt-24">
    <div className="pointer-events-none absolute left-1/2 top-1/4 h-[350px] w-[600px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff4f1a]/10 blur-[130px]" />
    <div className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 text-center sm:space-y-8 sm:px-6 lg:px-8">
      <Eyebrow />
      <h1 className="font-heading text-[clamp(2.25rem,12vw,3rem)] font-extrabold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
        FESTOFY
      </h1>
      <div className="flex justify-center">
        <Supporting />
      </div>
      <div className="flex justify-center">
        <Features showHeading={false} />
      </div>
    </div>
  </section>
);

export const FestofyPortal: React.FC = () => (
  <GlyphPortal
    word="FESTOFY"
    topOffset="var(--app-header-h)" /* sticky PublicLayout header height, see index.css */
    above={<Eyebrow />}
    below={({ stepInside }) => <Supporting onStepInside={stepInside} />}
    fallback={<StaticHero />}
    scrollLengthVh={200}
    scene={
      <>
        {/* Letters show this gradient: light top-left, deeper bottom-right */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(120deg,#ff7a3d 0%,#ff4f1a 35%,#d63a12 68%,#8f2209 100%)' }}
        />
        {/* Soft lighting patches, like the original */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(45% 70% at 22% 25%, rgba(255,190,140,.35), transparent 70%), radial-gradient(40% 60% at 78% 70%, rgba(120,20,5,.45), transparent 70%)',
          }}
        />
      </>
    }
  >
    <Features />
  </GlyphPortal>
);
