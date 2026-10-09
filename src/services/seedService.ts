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
  // --- Existing Categories (IDs and slugs preserved) ---
  {
    id: 'cat_programming',
    name: 'Programming',
    slug: 'programming',
    normalizedName: 'programming',
    group: 'Technology & Computing',
    description: 'Competitive coding, algorithmic battles, and software development challenges.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_robotics',
    name: 'Robotics',
    slug: 'robotics',
    normalizedName: 'robotics',
    group: 'Technology & Computing',
    description: 'Line-following bots, robo-soccer, and autonomous navigation robotics.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_ai',
    name: 'AI & Data Science',
    slug: 'ai',
    normalizedName: 'ai & data science',
    group: 'Technology & Computing',
    description: 'Machine learning, generative prompt engineering, and intelligent agents.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_cyber',
    name: 'Cyber Security',
    slug: 'cyber-security',
    normalizedName: 'cyber security',
    group: 'Technology & Computing',
    description: 'Capture The Flag (CTF), reverse engineering, and web defensive security.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_design',
    name: 'UI/UX & Design',
    slug: 'design',
    normalizedName: 'ui/ux & design',
    group: 'Creative & Media',
    description: 'Interface design sprints, product wireframing, and user research.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_quiz',
    name: 'Tech Quiz',
    slug: 'quiz',
    normalizedName: 'tech quiz',
    group: 'Technology & Computing',
    description: 'Fast-paced tech trivia, CS history, computer architecture, and tech IQ.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },

  // --- Technology & Computing (Added) ---
  {
    id: 'cat_web_dev',
    name: 'Web Development',
    slug: 'web-development',
    normalizedName: 'web development',
    group: 'Technology & Computing',
    description: 'Frontend, backend, and full-stack web applications and challenges.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_app_dev',
    name: 'App Development',
    slug: 'app-development',
    normalizedName: 'app development',
    group: 'Technology & Computing',
    description: 'Mobile app development for Android, iOS, and cross-platform ecosystems.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_software_eng',
    name: 'Software Engineering',
    slug: 'software-engineering',
    normalizedName: 'software engineering',
    group: 'Technology & Computing',
    description: 'System design, architecture, DevOps, and enterprise software engineering.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_machine_learning',
    name: 'Machine Learning',
    slug: 'machine-learning',
    normalizedName: 'machine learning',
    group: 'Technology & Computing',
    description: 'Deep learning models, neural networks, predictive algorithms, and computer vision.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_competitive_prog',
    name: 'Competitive Programming',
    slug: 'competitive-programming',
    normalizedName: 'competitive programming',
    group: 'Technology & Computing',
    description: 'Time-pressured algorithmic problem solving, data structures, and math challenges.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_game_dev',
    name: 'Game Development',
    slug: 'game-development',
    normalizedName: 'game development',
    group: 'Technology & Computing',
    description: '2D/3D game mechanics, game jam prototypes, physics engines, and graphics.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_cloud_computing',
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    normalizedName: 'cloud computing',
    group: 'Technology & Computing',
    description: 'Serverless architectures, cloud infrastructure, container orchestration, and microservices.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_iot',
    name: 'Internet of Things (IoT)',
    slug: 'internet-of-things',
    normalizedName: 'internet of things (iot)',
    group: 'Technology & Computing',
    description: 'Smart connected devices, sensor networks, Arduino, Raspberry Pi, and hardware automation.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_blockchain_web3',
    name: 'Blockchain & Web3',
    slug: 'blockchain-web3',
    normalizedName: 'blockchain & web3',
    group: 'Technology & Computing',
    description: 'Decentralized applications (dApps), smart contracts, cryptography, and distributed ledgers.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_open_source',
    name: 'Open Source',
    slug: 'open-source',
    normalizedName: 'open source',
    group: 'Technology & Computing',
    description: 'Community contributions, open-source sprints, pull request marathons, and documentation.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_networking',
    name: 'Networking',
    slug: 'networking',
    normalizedName: 'networking',
    group: 'Technology & Computing',
    description: 'Computer networking, packet analysis, protocol design, routing, and switching.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_electronics_embedded',
    name: 'Electronics & Embedded Systems',
    slug: 'electronics-embedded-systems',
    normalizedName: 'electronics & embedded systems',
    group: 'Technology & Computing',
    description: 'Circuit design, microcontrollers, embedded firmware, PCB layout, and signal processing.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },

  // --- Academic & Innovation (Added) ---
  {
    id: 'cat_mathematics',
    name: 'Mathematics',
    slug: 'mathematics',
    normalizedName: 'mathematics',
    group: 'Academic & Innovation',
    description: 'Applied mathematics, combinatorics, calculus, statistics, and number theory.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_physics',
    name: 'Physics',
    slug: 'physics',
    normalizedName: 'physics',
    group: 'Academic & Innovation',
    description: 'Theoretical physics, mechanics, optics, astronomy, and physical experiments.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    normalizedName: 'chemistry',
    group: 'Academic & Innovation',
    description: 'Organic, inorganic, physical chemistry, chemical reactions, and laboratory contests.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_biology',
    name: 'Biology',
    slug: 'biology',
    normalizedName: 'biology',
    group: 'Academic & Innovation',
    description: 'Life sciences, genetics, biotechnology, ecology, and biological research.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_science_fair',
    name: 'Science Fair',
    slug: 'science-fair',
    normalizedName: 'science fair',
    group: 'Academic & Innovation',
    description: 'Interactive STEM exhibits, scientific demonstrations, and research experiments.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_research_innovation',
    name: 'Research & Innovation',
    slug: 'research-innovation',
    normalizedName: 'research & innovation',
    group: 'Academic & Innovation',
    description: 'Academic paper presentations, emerging research, patents, and technical innovations.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_engineering',
    name: 'Engineering',
    slug: 'engineering',
    normalizedName: 'engineering',
    group: 'Academic & Innovation',
    description: 'Mechanical, civil, electrical, aerospace, and multidisciplinary engineering design.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_case_study',
    name: 'Case Study & Problem Solving',
    slug: 'case-study-problem-solving',
    normalizedName: 'case study & problem solving',
    group: 'Academic & Innovation',
    description: 'Analytical real-world case analysis, strategy formulation, and critical problem solving.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_project_showcase',
    name: 'Project Showcase',
    slug: 'project-showcase',
    normalizedName: 'project showcase',
    group: 'Academic & Innovation',
    description: 'Student capstone exhibitions, hardware demonstrations, and software presentations.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },

  // --- Creative & Media (Added) ---
  {
    id: 'cat_photography',
    name: 'Photography',
    slug: 'photography',
    normalizedName: 'photography',
    group: 'Creative & Media',
    description: 'Visual storytelling, photojournalism, digital captures, and landscape photography.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_graphic_design',
    name: 'Graphic Design',
    slug: 'graphic-design',
    normalizedName: 'graphic design',
    group: 'Creative & Media',
    description: 'Poster design, typography, brand identities, digital illustration, and visual arts.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_video_filmmaking',
    name: 'Video Editing & Filmmaking',
    slug: 'video-editing-filmmaking',
    normalizedName: 'video editing & filmmaking',
    group: 'Creative & Media',
    description: 'Short film competitions, cinematography, motion graphics, and video post-production.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_content_creation',
    name: 'Content Creation',
    slug: 'content-creation',
    normalizedName: 'content creation',
    group: 'Creative & Media',
    description: 'Social media storytelling, podcasting, vlog creation, and digital brand content.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_digital_marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    normalizedName: 'digital marketing',
    group: 'Creative & Media',
    description: 'Growth hacking, brand campaigns, SEO strategies, and ad copy competitions.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_animation',
    name: 'Animation',
    slug: 'animation',
    normalizedName: 'animation',
    group: 'Creative & Media',
    description: '2D & 3D computer animation, motion design, CGI, character rigging, and storyboarding.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_creative_writing',
    name: 'Creative Writing',
    slug: 'creative-writing',
    normalizedName: 'creative writing',
    group: 'Creative & Media',
    description: 'Poetry, short fiction, essays, scriptwriting, and creative literary expression.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },

  // --- Competitions & General Events (Added) ---
  {
    id: 'cat_business_entrepreneurship',
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    normalizedName: 'business & entrepreneurship',
    group: 'Competitions & General Events',
    description: 'Startup pitch decks, business plan competitions, venture incubation, and trade models.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_debate',
    name: 'Debate',
    slug: 'debate',
    normalizedName: 'debate',
    group: 'Competitions & General Events',
    description: 'Parliamentary debates, public speaking, model UN tournaments, and argumentation.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_gk_quiz',
    name: 'General Knowledge Quiz',
    slug: 'general-knowledge-quiz',
    normalizedName: 'general knowledge quiz',
    group: 'Competitions & General Events',
    description: 'Trivia, world events, history, pop culture, geography, and general knowledge rounds.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_olympiad',
    name: 'Olympiad',
    slug: 'olympiad',
    normalizedName: 'olympiad',
    group: 'Competitions & General Events',
    description: 'Subject-specific Olympiads testing speed, precision, and mastery across academic fields.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_hackathon',
    name: 'Hackathon',
    slug: 'hackathon',
    normalizedName: 'hackathon',
    group: 'Competitions & General Events',
    description: '24-48 hour intensive product building, prototyping, and team innovation sprints.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_ideathon',
    name: 'Ideathon',
    slug: 'ideathon',
    normalizedName: 'ideathon',
    group: 'Competitions & General Events',
    description: 'Concept generation, design thinking workshops, and novel solution ideation.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_gaming_esports',
    name: 'Gaming & Esports',
    slug: 'gaming-esports',
    normalizedName: 'gaming & esports',
    group: 'Competitions & General Events',
    description: 'Competitive PC, console, and mobile esports tournaments and LAN matches.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_cultural_comp',
    name: 'Cultural Competition',
    slug: 'cultural-competition',
    normalizedName: 'cultural competition',
    group: 'Competitions & General Events',
    description: 'Music, drama, dance, fine arts, and cultural celebration contests.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_workshop_seminar',
    name: 'Workshop & Seminar',
    slug: 'workshop-seminar',
    normalizedName: 'workshop & seminar',
    group: 'Competitions & General Events',
    description: 'Hands-on masterclasses, industry speaker sessions, panels, and tech tutorials.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_career_networking',
    name: 'Career & Networking',
    slug: 'career-networking',
    normalizedName: 'career & networking',
    group: 'Competitions & General Events',
    description: 'Job fairs, resume reviews, founder meetups, and professional networking mixers.',
    createdAt: '2026-01-01T00:00:00+06:00'
  },
  {
    id: 'cat_other',
    name: 'Other',
    slug: 'other',
    normalizedName: 'other',
    group: 'Competitions & General Events',
    description: 'Special events, social mixers, informal gatherings, and miscellaneous activities.',
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
