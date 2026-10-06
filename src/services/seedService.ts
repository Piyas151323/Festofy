import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
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

export const INITIAL_FESTS: Fest[] = [
  {
    id: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    name: 'Tech Carnival 2026',
    description: 'The premier national collegiate technology summit in Bangladesh. Celebrating 14 consecutive editions of student innovation, hackathons, and hardware showcases with over 2,500 participants nationwide.',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    startDate: '2026-10-18T09:00:00+06:00',
    endDate: '2026-10-20T19:00:00+06:00',
    status: 'published',
    createdAt: '2026-08-01T10:00:00+06:00',
    updatedAt: '2026-08-01T10:00:00+06:00',
    organizationName: 'DRMC IT Club'
  },
  {
    id: 'fest_winter_2026',
    organizationId: 'org_bcic',
    name: 'Winter Tech Fest 2026',
    description: 'Three exhilarating days of algorithmic challenges, embedded systems expos, and interactive student masterclasses hosted at the BCIC campus in Mirpur.',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    startDate: '2026-11-12T09:30:00+06:00',
    endDate: '2026-11-14T18:00:00+06:00',
    status: 'published',
    createdAt: '2026-08-10T10:00:00+06:00',
    updatedAt: '2026-08-10T10:00:00+06:00',
    organizationName: 'BCIC College IT Club'
  },
  {
    id: 'fest_innovation_2026',
    organizationId: 'org_dts',
    name: 'Innovation Week 2026',
    description: 'Flagship gathering of university and college technologists showcasing AI prototypes, climate tech solutions, and startup pitches with venture mentors.',
    bannerUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
    startDate: '2026-10-28T10:00:00+06:00',
    endDate: '2026-10-31T20:00:00+06:00',
    status: 'published',
    createdAt: '2026-08-15T10:00:00+06:00',
    updatedAt: '2026-08-15T10:00:00+06:00',
    organizationName: 'Dhaka Tech Society'
  },
  {
    id: 'fest_freshers_2027',
    organizationId: 'org_drmc',
    name: 'Freshers Tech Fest 2027',
    description: 'Welcoming incoming student cohorts into digital engineering, computational science, and game design through beginner-friendly contests and bootcamps.',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    startDate: '2027-01-15T09:00:00+06:00',
    endDate: '2027-01-17T17:00:00+06:00',
    status: 'published',
    createdAt: '2026-09-01T10:00:00+06:00',
    updatedAt: '2026-09-01T10:00:00+06:00',
    organizationName: 'DRMC IT Club'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt_ai_web_contest',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_ai',
    name: 'AI Web Development Contest',
    description: 'Build and deploy a full-stack web application leveraging modern generative models and agentic workflows within an intense 6-hour hack battle.',
    bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    venue: 'Computer Lab 3, DRMC Main Academic Building',
    startTime: '2026-10-18T10:00:00+06:00',
    endTime: '2026-10-18T16:00:00+06:00',
    registrationDeadline: '2026-10-16T23:59:00+06:00',
    capacity: 60,
    currentRegistrations: 28,
    registrationType: 'both',
    minTeamSize: 2,
    maxTeamSize: 4,
    status: 'published',
    createdAt: '2026-08-20T10:00:00+06:00',
    updatedAt: '2026-08-20T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'AI & Data Science',
    organizationName: 'DRMC IT Club',
    customFormFields: [
      {
        id: 'github_profile',
        label: 'GitHub / Portfolio URL',
        type: 'url',
        required: false,
        placeholder: 'https://github.com/your-username',
        helpText: 'Link to your public repository or portfolio showcasing prior projects.'
      },
      {
        id: 'tech_stack',
        label: 'Preferred Full-Stack Framework',
        type: 'select',
        required: true,
        options: ['React / Vite + Node.js', 'Next.js / TypeScript', 'Python FastAPI / React', 'Go / Vue.js'],
        placeholder: 'Select your preferred stack'
      },
      {
        id: 'experience_level',
        label: 'AI API Experience Level',
        type: 'radio',
        required: true,
        options: ['Beginner (First time using AI APIs)', 'Intermediate (Built prototypes with LLMs)', 'Advanced (Production AI agents & RAG)']
      },
      {
        id: 'project_pitch',
        label: 'Brief Project Concept (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Describe in 1-2 sentences what category of problem your app intends to tackle...'
      },
      {
        id: 'consent_guidelines',
        label: 'Code of Ethics & AI Conduct',
        type: 'checkbox',
        required: true,
        placeholder: 'I agree to comply with open-source licensing and hackathon fairness guidelines'
      }
    ]
  },
  {
    id: 'evt_national_programming',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_programming',
    name: 'National Programming Contest',
    description: 'ICPC-style collegiate and high school algorithmic programming contest featuring 8 curated algorithmic problems in C++, Python, and Java.',
    bannerUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
    venue: 'Central Auditorium, DRMC Campus',
    startTime: '2026-10-19T09:30:00+06:00',
    endTime: '2026-10-19T14:30:00+06:00',
    registrationDeadline: '2026-10-15T23:59:00+06:00',
    capacity: 120,
    currentRegistrations: 74,
    registrationType: 'individual',
    status: 'published',
    createdAt: '2026-08-20T10:00:00+06:00',
    updatedAt: '2026-08-20T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'Programming',
    organizationName: 'DRMC IT Club',
    customFormFields: [
      {
        id: 'cf_handle',
        label: 'Codeforces / Online Judge Handle',
        type: 'text',
        required: true,
        placeholder: 'e.g. tourist, errichto, or your CF handle'
      },
      {
        id: 'primary_language',
        label: 'Primary Contest Language',
        type: 'select',
        required: true,
        options: ['C++ (GCC 13 / C++20)', 'Java (OpenJDK 21)', 'Python (PyPy 3.10)', 'Kotlin / Rust'],
        placeholder: 'Choose compiler'
      },
      {
        id: 'tshirt_size',
        label: 'Contestant T-Shirt Size',
        type: 'select',
        required: true,
        options: ['Small (S)', 'Medium (M)', 'Large (L)', 'Extra Large (XL)', 'XXL'],
        placeholder: 'Select size'
      },
      {
        id: 'dietary_preference',
        label: 'Lunch Preference',
        type: 'radio',
        required: true,
        options: ['Standard Non-Veg (Chicken)', 'Vegetarian']
      }
    ]
  },
  {
    id: 'evt_robotics_challenge',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_robotics',
    name: 'Line Follower Robotics Challenge',
    description: 'High-speed autonomous line follower race with inverted tracks, grid mazes, and obstacle avoidance segments.',
    bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    venue: 'Indoor Gymnasium Arena, DRMC',
    startTime: '2026-10-20T10:00:00+06:00',
    endTime: '2026-10-20T16:00:00+06:00',
    registrationDeadline: '2026-10-17T20:00:00+06:00',
    capacity: 40,
    currentRegistrations: 16,
    registrationType: 'team',
    minTeamSize: 2,
    maxTeamSize: 4,
    requiresApproval: true,
    status: 'published',
    createdAt: '2026-08-22T10:00:00+06:00',
    updatedAt: '2026-08-22T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'Robotics',
    organizationName: 'DRMC IT Club',
    customFormFields: [
      {
        id: 'bot_dimensions',
        label: 'Bot Dimensions & Measured Weight',
        type: 'text',
        required: true,
        placeholder: 'e.g. 20cm x 18cm, 850 grams'
      },
      {
        id: 'chassis_controller',
        label: 'Microcontroller Architecture',
        type: 'select',
        required: true,
        options: ['ESP32 / ESP32-S3', 'Arduino Nano / Uno (ATmega328P)', 'STM32 BluePill / BlackPill', 'Raspberry Pi Pico RP2040', 'Custom Discrete Controller'],
        placeholder: 'Select hardware platform'
      },
      {
        id: 'voltage_safety',
        label: 'Arena Electrical Safety Compliance',
        type: 'checkbox',
        required: true,
        placeholder: 'I verify our robot does not exceed 12.6V nominal LiPo battery voltage'
      }
    ]
  },
  {
    id: 'evt_cyber_ctf',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_cyber',
    name: 'Cyber Security Challenge (CTF)',
    description: 'Jeopardy-style Capture The Flag competition spanning cryptography, reverse engineering, web security, and forensics.',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    venue: 'Virtual Arena + On-site Hall 2',
    startTime: '2026-10-19T11:00:00+06:00',
    endTime: '2026-10-19T18:00:00+06:00',
    registrationDeadline: '2026-10-16T22:00:00+06:00',
    capacity: 80,
    status: 'published',
    createdAt: '2026-08-22T10:00:00+06:00',
    updatedAt: '2026-08-22T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'Cyber Security',
    organizationName: 'DRMC IT Club'
  },
  {
    id: 'evt_tech_quiz',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_quiz',
    name: 'National Tech Quiz Olympiad',
    description: 'Fast-paced buzzer rounds, tech milestones, computing pioneers, and hardware architectural insights.',
    bannerUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80',
    venue: 'DRMC Media Seminar Room',
    startTime: '2026-10-18T14:00:00+06:00',
    endTime: '2026-10-18T17:00:00+06:00',
    registrationDeadline: '2026-10-17T12:00:00+06:00',
    capacity: 90,
    status: 'published',
    createdAt: '2026-08-23T10:00:00+06:00',
    updatedAt: '2026-08-23T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'Tech Quiz',
    organizationName: 'DRMC IT Club'
  },
  {
    id: 'evt_ui_ux_sprint',
    festId: 'fest_winter_2026',
    organizationId: 'org_bcic',
    categoryId: 'cat_design',
    name: 'UI/UX Design Challenge',
    description: 'Solve real-world urban transit and education challenges through high-fidelity Figma user journeys and design systems.',
    bannerUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    venue: 'BCIC Multimedia Lab 2',
    startTime: '2026-11-12T10:30:00+06:00',
    endTime: '2026-11-12T15:30:00+06:00',
    registrationDeadline: '2026-11-09T23:59:00+06:00',
    capacity: 50,
    status: 'published',
    createdAt: '2026-08-25T10:00:00+06:00',
    updatedAt: '2026-08-25T10:00:00+06:00',
    festName: 'Winter Tech Fest 2026',
    categoryName: 'UI/UX & Design',
    organizationName: 'BCIC College IT Club'
  },
  {
    id: 'evt_ai_workshop',
    festId: 'fest_winter_2026',
    organizationId: 'org_bcic',
    categoryId: 'cat_ai',
    name: 'Interactive AI & LLM Workshop',
    description: 'Hands-on masterclass in building multi-modal assistants, Retrieval Augmented Generation (RAG), and deploying lightweight models.',
    bannerUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=80',
    venue: 'BCIC Main Conference Hall',
    startTime: '2026-11-13T11:00:00+06:00',
    endTime: '2026-11-13T16:00:00+06:00',
    registrationDeadline: '2026-11-10T20:00:00+06:00',
    capacity: 100,
    status: 'published',
    createdAt: '2026-08-25T10:00:00+06:00',
    updatedAt: '2026-08-25T10:00:00+06:00',
    festName: 'Winter Tech Fest 2026',
    categoryName: 'AI & Data Science',
    organizationName: 'BCIC College IT Club'
  },
  {
    id: 'evt_innovation_hackathon',
    festId: 'fest_innovation_2026',
    organizationId: 'org_dts',
    categoryId: 'cat_programming',
    name: 'Innovation Hackathon 2026',
    description: '36-hour non-stop hackathon building production prototypes for renewable energy, civic tech, and student health in Bangladesh.',
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    venue: 'Krishibid Institution Bangladesh (KIB) Complex, Farmgate',
    startTime: '2026-10-29T09:00:00+06:00',
    endTime: '2026-10-30T21:00:00+06:00',
    registrationDeadline: '2026-10-25T23:59:00+06:00',
    capacity: 150,
    status: 'published',
    createdAt: '2026-08-28T10:00:00+06:00',
    updatedAt: '2026-08-28T10:00:00+06:00',
    festName: 'Innovation Week 2026',
    categoryName: 'Programming',
    organizationName: 'Dhaka Tech Society'
  },
  {
    id: 'evt_robo_soccer',
    festId: 'fest_winter_2026',
    organizationId: 'org_bcic',
    categoryId: 'cat_robotics',
    name: 'Robo Soccer Championship',
    description: 'Thrilling 2v2 remote-controlled soccer showdown on artificial mini-turf fields with tactical penalties.',
    bannerUrl: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=800&auto=format&fit=crop&q=80',
    venue: 'BCIC Open Pavilion, Mirpur',
    startTime: '2026-11-14T10:00:00+06:00',
    endTime: '2026-11-14T17:00:00+06:00',
    registrationDeadline: '2026-11-11T22:00:00+06:00',
    capacity: 32,
    status: 'published',
    createdAt: '2026-08-28T10:00:00+06:00',
    updatedAt: '2026-08-28T10:00:00+06:00',
    festName: 'Winter Tech Fest 2026',
    categoryName: 'Robotics',
    organizationName: 'BCIC College IT Club'
  },
  {
    id: 'evt_startup_pitch',
    festId: 'fest_innovation_2026',
    organizationId: 'org_dts',
    categoryId: 'cat_design',
    name: 'Student Startup Pitch Battle',
    description: 'Collegiate entrepreneurs pitch MVP metrics and business models to Angel Investors and accelerators.',
    bannerUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
    venue: 'KIB Executive Boardroom',
    startTime: '2026-10-31T14:00:00+06:00',
    endTime: '2026-10-31T18:00:00+06:00',
    registrationDeadline: '2026-10-27T18:00:00+06:00',
    capacity: 25,
    status: 'published',
    createdAt: '2026-08-30T10:00:00+06:00',
    updatedAt: '2026-08-30T10:00:00+06:00',
    festName: 'Innovation Week 2026',
    categoryName: 'UI/UX & Design',
    organizationName: 'Dhaka Tech Society'
  },
  {
    id: 'evt_spring_hack_past',
    festId: 'fest_freshers_2027',
    organizationId: 'org_drmc',
    categoryId: 'cat_programming',
    name: 'Freshers Algorithmic Speedrun',
    description: 'Speed-solving foundational data structures and mathematical puzzles for first-year collegiate coders.',
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    venue: 'DRMC CSE Department Lab 1',
    startTime: '2027-01-16T10:00:00+06:00',
    endTime: '2027-01-16T13:00:00+06:00',
    registrationDeadline: '2027-01-14T23:59:00+06:00',
    capacity: 70,
    status: 'published',
    createdAt: '2026-09-02T10:00:00+06:00',
    updatedAt: '2026-09-02T10:00:00+06:00',
    festName: 'Freshers Tech Fest 2027',
    categoryName: 'Programming',
    organizationName: 'DRMC IT Club'
  },
  {
    id: 'evt_cyber_workshop_past',
    festId: 'fest_carnival_2026',
    organizationId: 'org_drmc',
    categoryId: 'cat_cyber',
    name: 'Collegiate Cyber Defense Bootcamp',
    description: 'Foundational workshop exploring Linux command line mastery, Wireshark packet analysis, and secure code audits.',
    bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    venue: 'DRMC Seminar Room 1',
    startTime: '2026-05-10T10:00:00+06:00',
    endTime: '2026-05-10T15:00:00+06:00',
    registrationDeadline: '2026-05-08T23:59:00+06:00',
    capacity: 80,
    status: 'completed',
    createdAt: '2026-04-01T10:00:00+06:00',
    updatedAt: '2026-05-11T10:00:00+06:00',
    festName: 'Tech Carnival 2026',
    categoryName: 'Cyber Security',
    organizationName: 'DRMC IT Club'
  }
];

export async function seedDemoDataIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  try {
    const festsSnap = await getDocs(collection(db, 'fests'));
    if (!festsSnap.empty) {
      return { seeded: false, message: 'Database already contains data' };
    }

    await forceSeedDemoData();
    return { seeded: true, message: 'Successfully seeded Festofy demo data' };
  } catch (error) {
    console.warn('Auto-seed check encountered error:', error);
    return { seeded: false, message: 'Seeding skipped or failed' };
  }
}

export async function forceSeedDemoData(): Promise<void> {
  const batch = writeBatch(db);

  // 1. Organizations
  for (const org of INITIAL_ORGANIZATIONS) {
    const ref = doc(db, 'organizations', org.id);
    batch.set(ref, org);
  }

  // 2. Categories
  for (const cat of INITIAL_CATEGORIES) {
    const ref = doc(db, 'eventCategories', cat.id);
    batch.set(ref, cat);
  }

  // 3. Fests
  for (const fest of INITIAL_FESTS) {
    const ref = doc(db, 'fests', fest.id);
    batch.set(ref, fest);
  }

  // 4. Events
  for (const evt of INITIAL_EVENTS) {
    const ref = doc(db, 'events', evt.id);
    batch.set(ref, evt);
  }

  await batch.commit();
}
