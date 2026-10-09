# Festofy — Event Operations for Student Organizations

**Plan. Discover. Participate.**

Festofy is a modern, high-reliability event operations platform designed specifically for collegiate festivals, hackathons, and student organizations. It bridges the gap between campus organizers running complex multi-track summits and students discovering, registering for, and attending campus events.

---

## 🌟 Key Features

### 1. Public Discovery & Showcase
* **Curated Festival & Event Directory**: Explore flagship inter-collegiate festivals, summits, and individual competitions.
* **Granular Multi-Dimensional Filters**: Filter events by category (e.g. Programming, Robotics, Debate, Quiz, Science), festival host, and status.
* **Campus Visitor Policy Enforcement**: Explicit visibility and visitor access policies (*Allowed* vs. *Not Allowed*) with fest-level precedence over events.
* **Deterministic Privacy Boundary**: Unpublished, draft, and archived fests/events are strictly secluded from public queries and discovery.

### 2. Student Portal & Digital Credentials
* **Atomic Registration**: Register for individual or team events with guaranteed concurrency safety, strict capacity enforcement, and duplicate prevention.
* **Standards-Compliant Digital Gate Pass**: Generates high-contrast, ISO/IEC 18004 scannable vector SVG QR codes with error correction (Level M) mapping directly to unique ticket codes.
* **Print & PDF Support**: 1-click printable passes using print-media stylesheets (`@media print`) that isolate the official badge and hide surrounding UI.
* **Registration Lifecycle & History**: Track pending reviews, confirmed entries, gate check-in stamps, payment records, and self-service seat cancellations.
* **Personalized Event Recommendations**: Intelligent matching between student interests (Physics, Programming, Robotics, etc.) and published competitions, integrated with notification alerts.

### 3. Organizer Operations Console
* **Organization Isolation**: Multi-workspace organization selector strictly bounded by authorized Firestore club memberships.
* **Event & Festival Lifecycle**: Create, edit, and publish festivals and competitions with automated deadline validation (`registrationDeadline <= startTime <= endTime`).
* **Participant Manifest & Rapid Gate Check-In**:
  * Real-time ticket code lookup and 1-tap gate check-in.
  * Anti-double-check-in verification preventing duplicate admittance.
  * Rejection of cancelled or invalid entry passes.
* **Formula-Sanitized CSV Export**: Exports complete participant rosters while sanitizing spreadsheet formula triggers (`=`, `+`, `-`, `@`) to eliminate CSV injection risks.
* **Capacity & Attendance Analytics**: Real-time breakdown of registration states, headcount versus team entries, gate attendance percentage, and quota utilization alerts.

### 4. Platform Governance & Admin Panel
* **Centralized Administration Console**: Platform oversight of student organization requests, approved societies, and system health.
* **Atomic Club Approval Workflow**: Approving an organization promotes the requester to the `organizer` role and creates an `owner` membership document in a single atomic transaction.
* **Strict Role Segregation**: Students cannot self-elevate permissions; administrators are verified directly via Firestore `userRoles/{uid}` security rules.

---

## 🛡️ Security & Architecture

Festofy enforces zero-trust security where client-side route guards are treated solely as UX navigation aids, with all authorization enforced directly at the database and transaction level:

* **Firestore Security Rules (v2)**: All document collections (`users`, `userRoles`, `organizations`, `organizationMembers`, `fests`, `events`, `registrations`, `notifications`) are locked behind declarative role checks.
* **Deterministic Document Keys**: Registrations use `{eventId}_{userId}` to physically block concurrent double-submissions at the Firestore engine level.
* **Atomic Capacity Coupling**: Registrations and cancellations execute inside Firestore transactions that atomically modify `event.currentRegistrations` in lockstep with the registration state.
* **Gate Admittance Verification**: Check-ins must be executed by authenticated organizers of the host club; QR codes serve as verifiable ticket references verified against real-time Firestore state.
* **Timezone Consistency**: All displayed event dates and times are standardized to Bangladesh Time (`Asia/Dhaka`).

---

## 💻 Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion
* **Database & Auth**: Firebase Authentication, Google Cloud Firestore (Security Rules v2)
* **Standards QR Engine**: ISO/IEC 18004 standard QR generator (`qrcode`) and scanner verification (`jsqr`)
* **Testing & QA**: Node.js / `tsx` multi-phase assertion suites

---

## 🚀 Local Setup & Installation

### Prerequisites
* Node.js 20+ installed
* npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/example/festofy.git
cd festofy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
Provide your Firebase project credentials in `.env` if connecting to a custom instance.

### 4. Run development server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 5. Run tests & production build
```bash
# Run comprehensive test suites
npx tsx src/test_phase1_comprehensive.ts
npx tsx src/test_phase2_comprehensive.ts
npx tsx src/test_phase4_3.ts
npx tsx src/test_phase5_0.ts
npx tsx src/test_phase6_1_6_2.ts
npx tsx src/test_phase7_analytics.ts
npx tsx src/test_phase8_phase9.ts

# Typecheck and lint
npm run lint

# Build for production
npm run build
```

---

## 👤 Demo Accounts & Evaluation Workflow

To evaluate the full user journey:

1. **Public Visitor**:
   * Visit `/` (Homepage), `/fests` (Festivals), and `/events` (Competitions).
   * Search for hackathons or filter by category.
2. **Student**:
   * Navigate to `/auth` to register or sign in as a student.
   * Access `/dashboard` to view registrations and `/dashboard/passes` to inspect official printable digital entry passes.
3. **Organizer**:
   * Once an organization request is approved, navigate to `/organizer` to manage festivals, review participants, perform gate check-in, and review analytics.
4. **Platform Admin**:
   * Navigate to `/admin/login` to sign in with administrator credentials.
   * Review pending organization requests and manage student club authorisations at `/admin`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
