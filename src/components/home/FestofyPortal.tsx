import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, UserCheck, BarChart2 } from 'lucide-react';
import { GlyphPortal } from '../ui/glyph-portal';

const FEATURES = [
  {
    icon: Compass,
    title: 'Discover Campus Events',
    body: 'Find festivals, competitions, workshops, and other campus activities in one place.',
  },
  {
    icon: UserCheck,
    title: 'Register and Participate',
    body: 'Explore event details, complete registrations, and keep track of upcoming activities.',
  },
  {
    icon: BarChart2,
    title: 'Organize with Confidence',
    body: 'Give student organizations a structured way to manage events and participant registrations.',
  },
];

const Eyebrow: React.FC = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-[#2e3442] bg-[#191b20] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#ff4f1a] sm:text-[11px]">
    <span className="h-1.5 w-1.5 rounded-full bg-[#ff4f1a]" />
    Event operations for student organizations
  </div>
);

const Supporting: React.FC = () => (
  <div className="max-w-2xl space-y-3 sm:space-y-4">
    <div className="font-heading text-lg font-medium text-[#f4f5f7] sm:text-2xl lg:text-3xl">
      Plan. Discover. Participate.
    </div>
    <p className="text-xs leading-relaxed text-[#9da3b4] sm:text-sm md:text-base">
      One home for festivals, events, registrations and participants, built for the clubs that run them and the students who show up.
    </p>
  </div>
);

const Features: React.FC = () => (
  <div className="w-full max-w-5xl">
    <div className="grid grid-cols-1 divide-y divide-[#242730] md:grid-cols-3 md:divide-x md:divide-y-0">
      {FEATURES.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex gap-4 py-3.5 md:flex-col md:px-8 md:py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff4f1a]/10 text-[#ff4f1a] md:h-12 md:w-12">
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="font-heading text-base font-bold text-white md:text-xl">{title}</h3>
            <p className="text-xs leading-relaxed text-[#9da3b4] md:text-sm">{body}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mt-10">
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
      <Features />
    </div>
  </section>
);

export const FestofyPortal: React.FC = () => (
  <GlyphPortal
    word="FESTOFY"
    topOffset="4rem" /* PublicLayout header is sticky, h-16 */
    above={<Eyebrow />}
    below={<Supporting />}
    fallback={<StaticHero />}
    scene={
      <>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(115deg,#ff4f1a 0%,#e8431a 40%,#a3260a 75%,#ff4f1a 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(60% 80% at 50% 40%, rgba(255,170,120,.35), transparent 70%)' }}
        />
      </>
    }
  >
    <Features />
  </GlyphPortal>
);