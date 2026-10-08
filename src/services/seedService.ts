import { doc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Organization, Fest, EventItem, EventCategory } from '../types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_drmc',
    name: 'DRMC IT Club',
    description: 'Dhaka Residential Model College IT Club — pioneer of collegiate tech festivals, programming competitions, and robotics summits in Bangladesh since 2003.',
    logoUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80',
    status: 'approved',
    createdAt: '2026-01-10T10:00:00+06:00',
    updatedAt: '2026-01-10T10:00:00+06:00'
  },
  {
    id: 'org_bcic',
    name: 'BCIC College IT Club',
    description: 'A vibrant hub of student innovation hosting national programming camps, science olympiads, and hardware exhibitions in Mirpur, Dhaka.',
    logoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
    status: 'approved',
    createdAt: '2026-01-15T10:00:00+06:00',
    updatedAt: '2026-01-15T10:00:00+06:00'
  },
  {
    id: 'org_dts',
    name: 'Dhaka Tech Society',
    description: 'An inter-collegiate technology federation uniting visionary student engineers, software architects, and AI researchers across Dhaka divisions.',
    logoUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&auto=format&fit=crop&q=80',
    status: 'approved',
    createdAt: '2026-02-01T10:00:00+06:00',
    updatedAt: '2026-02-01T10:00:00+06:00'
  }
];

export const INITIAL_CATEGORIES: EventCategory[] = [
  {
    id: 'cat_programming',
    name: 'Programming',
    slug: 'programming',
    description: 'Competitive coding, algorithmic battles, and software development challenges.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_robotics',
    name: 'Robotics',
    slug: 'robotics',
    description: 'Line-following bots, robo-soccer, and autonomous navigation robotics.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_ai',
    name: 'AI & Data Science',
    slug: 'ai',
    description: 'Machine learning, generative prompt engineering, and intelligent agents.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_cyber',
    name: 'Cyber Security',
    slug: 'cyber-security',
    description: 'Capture The Flag (CTF), reverse engineering, and web defensive security.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_design',
    name: 'UI/UX & Design',
    slug: 'design',
    description: 'Interface design sprints, product wireframing, and user research.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_quiz',
    name: 'Tech Quiz',
    slug: 'quiz',
    description: 'Fast-paced tech trivia, CS history, computer architecture, and tech IQ.',
    createdAt: '2026-01-01T00:00:00+06:00'
  }
];

// Clean: Demo fests and events removed as requested
export const INITIAL_FESTS: Fest[] = [];
export const INITIAL_EVENTS: EventItem[] = [];

export async function seedDemoDataIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  // Demo data seeding disabled
  return { seeded: false, message: 'Demo data seeding disabled' };
}

export async function forceSeedDemoData(): Promise<void> {
  const batch = writeBatch(db);

  // Seed baseline organizations and taxonomy categories only
  for (const org of INITIAL_ORGANIZATIONS) {
    const ref = doc(db, 'organizations', org.id);
    batch.set(ref, org);
  }

  for (const cat of INITIAL_CATEGORIES) {
    const ref = doc(db, 'eventCategories', cat.id);
    batch.set(ref, cat);
  }

  await batch.commit();
}
