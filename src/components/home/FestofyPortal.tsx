import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { GlyphPortal } from '../ui/glyph-portal';

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
  <div className="inline-flex items-center gap-2 rounded-full border border-[#2e3442] bg-[#191b20] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#ff4f1a]">
    <span className="h-1.5 w-1.5 rounded-full bg-[#ff4f1a]" />
    Event operations for student organizations
  </div>
);

const Supporting: React.FC<{ onStepInside?: () => void }> = ({ onStepInside }) => (
  <div className="flex max-w-2xl flex-col items-center space-y-3 sm:space-y-4">
    <div className="font-heading text-lg font-medium text-[#f4f5f7] sm:text-2xl lg:text-3xl">
      Plan. Discover. Participate.
    </div>
    <p className="text-xs leading-relaxed text-[#9da3b4] sm:text-sm md:text-base">
      One home for festivals, events, registrations and participants, built for the clubs that run them and the students who show up.
    </p>
    <div className="pointer-events-auto mt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 rounded-xl bg-[#ff4f1a] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#ff4f1a]/20 transition-colors hover:bg-[#ff6838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
      >
        Explore Events <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        to="/organizer/apply"
        className="inline-flex items-center gap-2 rounded-xl border border-[#2e3442] bg-[#14161a] px-5 py-2.5 text-xs font-semibold text-[#f4f5f7] transition-colors hover:bg-[#1e222b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm"
      >
        Run Your Fest
      </Link>
      {onStepInside && (
        <button
          type="button"
          onClick={onStepInside}
          aria-label="Step inside interactive portal"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#242730] bg-[#191b20]/90 px-4 py-2.5 text-xs font-medium text-[#9da3b4] transition-colors hover:bg-[#242730] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm cursor-pointer"
        >
          <span>Step inside</span>
          <ArrowDownRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);

const Features: React.FC<{ showHeading?: boolean }> = ({ showHeading = true }) => (
  <div className="w-full max-w-5xl text-left">
    {showHeading && (
      <h2 className="font-heading max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
        One home for every campus event.
      </h2>
    )}
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-10 ${showHeading ? 'mt-6 md:mt-12' : ''}`}>
      {FEATURES.map(({ title, body }, i) => (
        <div key={title} className="border-t border-[#ff4f1a]/40 pt-3 md:pt-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold text-[#ff4f1a]">0{i + 1}</span>
            <h3 className="font-heading text-base font-semibold text-white md:text-lg">{title}</h3>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#9da3b4] md:mt-2 md:text-sm">{body}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-10">
      <Link
        to="/fests"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff4f1a] px-7 py-3 text-xs font-semibold text-white shadow-lg shadow-[#ff4f1a]/20 transition-all duration-200 hover:bg-[#ff6838] sm:w-auto sm:text-sm"
      >
        Explore Fests <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        to="/events"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2e3442] bg-[#14161a] px-7 py-3 text-xs font-semibold text-[#f4f5f7] transition-colors hover:bg-[#1e222b] sm:w-auto sm:text-sm"
      >
        View Events
      </Link>
    </div>
  </div>
);

/** Static version: reduced motion, or if the animation can't initialise. */
const StaticHero: React.FC = () => (
  <section className="relative overflow-hidden border-b border-[#242730] bg-gradient-to-b from-[#121316] via-[#090a0b] to-[#090a0b] pb-14 pt-16 sm:pt-24">
    <div className="pointer-events-none absolute left-1/2 top-1/4 h-[350px] w-[600px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff4f1a]/10 blur-[130px]" />
    <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6 lg:px-8">
      <Eyebrow />
      <h1 className="font-heading text-4xl font-extrabold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
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
    topOffset="4rem" /* PublicLayout header is sticky, h-16 */
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
