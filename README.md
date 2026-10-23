# LedgerPro Talent — Applicant Tracking System (ATS)

A focused, high-velocity **Applicant Tracking System (ATS)** built for **LedgerPro** recruiters who triage hundreds of candidate applications across multiple roles.

---

## Table of Contents

1. [Problem Statement & Product Vision](#1-problem-statement--product-vision)
2. [Core Features](#2-core-features)
3. [Tech Stack & Why Each Tool Was Chosen](#3-tech-stack--why-each-tool-was-chosen)
4. [System Architecture & Codebase Walkthrough](#4-system-architecture--codebase-walkthrough)
5. [Key Design Decisions, Trade-offs & Assumptions](#5-key-design-decisions-trade-offs--assumptions)
6. [Database Schema Design (`prisma/schema.prisma`)](#6-database-schema-design-prismaschemaprisma)
7. [API Reference](#7-api-reference)
8. [Local Development Setup](#8-local-development-setup)
9. [Supabase & Resend Configuration Guide](#9-supabase--resend-configuration-guide)
10. [Deploying to Railway (Public URL)](#10-deploying-to-railway-public-url)
11. [Future Roadmap (What We Would Build Next)](#11-future-roadmap-what-we-would-build-next)

---

## 1. Problem Statement & Product Vision

**The Core Pain Point:** Recruiters sorting through hundreds of applications waste hours switching between email threads, spreadsheets, and scattered resume files. Existing enterprise ATS platforms are often bloated with multi-layer configurations when what a high-velocity recruiter truly needs is:
1. A single place to **publish and manage open roles**.
2. A frictionless **public application portal** for candidates to upload resumes (or links) and cover notes.
3. A **high-density triage dashboard** to filter by job, filter by stage, search by candidate name/email, and move candidates through a clear hiring pipeline while **automatically keeping candidates informed via email**.

---

## 2. Core Features

### For Recruiters (`/` — Recruiter View)
- **Interactive Pipeline Funnel Bar**: Real-time metrics and percentage breakdown across all 5 hiring stages (`New`, `Screening`, `Interview`, `Offer`, `Rejected`). Click any stage card to filter immediately.
- **High-Density Table View & Kanban Pipeline Board**:
  - **Table View**: Built for rapid triage of hundreds of candidates—change a candidate's stage directly inline with 1 click, open their resume, or inspect their cover note.
  - **Kanban Board View**: Visual column layout (`New → Screening → Interview → Offer → Rejected`) with one-click *"Move to Next Stage"* buttons.
- **Multi-Dimensional Filtering & Instant Search**:
  - Filter by **Job Posting** (`All Jobs` or any specific LedgerPro role).
  - Filter by **Pipeline Status** (`NEW`, `SCREENING`, `INTERVIEW`, `OFFER`, `REJECTED`).
  - Real-time **Search** by candidate name or email address.
- **Automated Status Change Emails (Resend + Mock Preview)**:
  - Whenever a recruiter changes an application's status, the backend automatically dispatches a stage-specific HTML email to the candidate via **Resend**.
  - Includes a built-in **Mock Mode & Live UI Preview Toast**: if `RESEND_API_KEY` is not set (or restricted by Resend's free sandbox domain), the app logs the email on the server and pops up an interactive toast in the UI where you can preview the exact HTML email generated for the candidate.
- **Candidate Profile Drawer**: Slide-over drawer displaying the candidate's contact info, applied role, interactive 5-step pipeline switcher, cover note, and downloadable resume.
- **Job Postings Management**: Create new job postings, toggle roles between `OPEN` and `CLOSED`, delete postings, and jump directly to a role's applicant list.
- **One-Click Demo Data Seeding**: Pre-populated with realistic **LedgerPro** engineering, product, and solutions roles and 12+ candidates across pipeline stages, with a *"Reset Demo Data"* button in the top navigation bar.

### For Candidates (`/careers` — Public Job Board)
- Browse open LedgerPro roles with department, location, employment type, and compensation range.
- Submit an application with:
  - **Name & Email** (validated on client and server)
  - **Resume Upload (PDF, DOC, DOCX up to 5 MB)** stored in **Supabase Storage** (with automatic inline Data URI fallback) **OR** an external **Resume/Portfolio Link**
  - **Cover Note**

---

## 3. Tech Stack & Why Each Tool Was Chosen

| Layer | Technology | Why We Chose It (Interview Talking Points) |
| :--- | :--- | :--- |
| **Frontend + Backend** | **Next.js 15 (App Router) + TypeScript** | Combines React UI and backend REST API Route Handlers (`/api/*`) in a single type-safe repository. Eliminates CORS issues, shares TypeScript interfaces (`src/lib/types.ts`) across client and server, and simplifies deployment to a single Railway service. |
| **Database & ORM** | **Supabase (PostgreSQL) + Prisma ORM** | Relational data integrity (`Job` 1-to-Many `Application`) and database-level enums (`ApplicationStatus`, `JobStatus`) prevent invalid pipeline states. Prisma provides compile-time type safety and effortless schema migrations (`prisma db push`). |
| **File Storage** | **Supabase Storage** | Stores uploaded PDF/DOC/DOCX resumes (capped at 5 MB) in a public `resumes` bucket and returns a fast CDN URL stored on the `Application` record. |
| **Transactional Email** | **Resend** | Developer-friendly email API with a generous free tier and no custom domain required to get started (`onboarding@resend.dev`). Wrapped with a resilient Mock Mode fallback. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons (shadcn/ui patterns)** | High-contrast, accessible slate/indigo financial aesthetic tailored for long recruiter triage sessions without visual fatigue. |
| **Deployment** | **Railway** | Supports long-running Next.js Node servers, automatic GitHub deployments, and zero-config environment variable injection. |

---

## 4. System Architecture & Codebase Walkthrough

```text
ats_web/
├── prisma/
│   └── schema.prisma                  # PostgreSQL schema: Job & Application models + Enums + Indexes
├── src/
│   ├── lib/
│   │   ├── types.ts                   # Shared TypeScript interfaces & pipeline stage metadata/colors
│   │   ├── prisma.ts                  # Global PrismaClient singleton (prevents connection exhaustion)
│   │   ├── store.ts                   # Data access layer (Prisma PostgreSQL + automatic local fallback)
│   │   ├── storage.ts                 # 5MB resume validation + Supabase Storage uploader
│   │   ├── email.ts                   # Resend email dispatcher + stage-specific HTML templates + Mock fallback
│   │   └── seed-data.ts               # Realistic LedgerPro jobs & candidate applications dataset
│   ├── components/
│   │   ├── Navbar.tsx                 # Mode switcher (Recruiter View vs Public Careers) & system badges
│   │   ├── StatusBadge.tsx            # Color-coded pipeline stage pill component
│   │   ├── CreateJobModal.tsx         # Modal form to publish new job postings
│   │   ├── ApplyModal.tsx             # Candidate application modal (5MB file upload OR resume URL)
│   │   ├── CandidateDrawer.tsx        # Slide-over candidate detail view & 5-stage pipeline stepper
│   │   └── EmailToastModal.tsx        # Floating toast & full HTML email preview modal on status change
│   └── app/
│       ├── page.tsx                   # Recruiter Dashboard (Funnel bar, Table/Kanban views, Filters, Jobs tab)
│       ├── careers/
│       │   └── page.tsx               # Public Candidate Job Board (/careers)
│       └── api/
│           ├── jobs/route.ts          # GET (list jobs) & POST (create job)
│           ├── jobs/[id]/route.ts     # PATCH (toggle OPEN/CLOSED) & DELETE (cascade delete job)
│           ├── applications/route.ts  # GET (filter/search applications) & POST (submit application)
│           ├── applications/[id]/route.ts # PATCH (update status + trigger Resend email) & DELETE
│           ├── upload/route.ts        # POST multipart resume upload (5MB limit -> Supabase Storage)
│           └── seed/route.ts          # POST reset/populate LedgerPro demo data
```

---

## 5. Key Design Decisions, Trade-offs & Assumptions

> **Interview Tip:** These are the core architectural decisions made to optimize for recruiter productivity, reliability, and shippability within the take-home scope.

### 1. Single Recruiter Workspace (No Authentication Wall)
- **Decision:** The application opens directly into the Recruiter Dashboard (`/`) with a top navigation toggle to switch to the Public Candidate Job Board (`/careers`), without requiring a login screen.
- **Why / Trade-off:** Authentication, RBAC, and multi-tenant organization invites are table-stakes in production SaaS, but in a take-home evaluation they add friction for reviewers testing the URL and dilute focus from the core ATS triage workflow. Removing the login wall lets recruiters and interviewers test job creation, resume uploads, pipeline transitions, and email notifications within 5 seconds of opening the link.

### 2. Fixed 5-Stage Hiring Pipeline (`NEW → SCREENING → INTERVIEW → OFFER / REJECTED`)
- **Decision:** Modeled the pipeline as a strict PostgreSQL enum (`ApplicationStatus`) rather than user-defined custom columns.
- **Why / Trade-off:** A fixed pipeline guarantees consistent funnel metrics across all LedgerPro departments, simplifies the UI into an immediately intuitive 5-column layout, and allows us to craft tailored, high-quality email templates for each specific stage transition (`Screening` invitation vs. `Interview` scheduling vs. `Offer` congratulations vs. polite `Rejected` closure).

### 3. Best-Effort, Mockable Email Notifications
- **Decision:** Status updates (`PATCH /api/applications/[id]`) update the database record **first**, and then trigger `sendCandidateStatusEmail()` in a non-blocking `try/catch` wrapper with automatic **Mock Mode** fallback.
- **Why / Trade-off:**
  1. **Reliability:** A third-party email outage or API rate limit must *never* prevent a recruiter from updating a candidate's stage in the database.
  2. **Zero-Friction Demoability:** Resend's free tier (`onboarding@resend.dev`) only delivers live emails to the Resend account owner's verified email address unless a custom DNS domain is verified. By returning the full generated email payload (`subject`, `to`, `htmlBody`, and `mode: "live" | "mock"`) in the API response and displaying an interactive **"Preview Email HTML"** toast in the UI, anyone testing the application can verify the exact email sent for every status change—even with fictitious candidate emails!

### 4. Dual Resume Submission (5 MB File Upload + External Link Option)
- **Decision:** Candidates can either upload a PDF/DOC/DOCX file (strictly capped at **5 MB** on both client and server) **or** paste a link to their resume/portfolio (Google Drive, Dropbox, personal site).
- **Why / Trade-off:** Enforcing a 5 MB ceiling prevents memory spikes in serverless route handlers and keeps Supabase Storage within free-tier quotas. Furthermore, if Supabase Storage credentials aren't configured yet, the storage service (`src/lib/storage.ts`) automatically falls back to encoding the uploaded document as a downloadable Data URI so resume viewing never breaks.

### 5. Dual-Layout Triage (High-Density Table + Visual Kanban Board)
- **Decision:** Provided both a **Table View** (default) and a **Kanban Pipeline Board** on the same filtered dataset.
- **Why / Trade-off:** When a recruiter has 200+ applications in `NEW`, Kanban cards require excessive vertical scrolling. A high-density table with inline status dropdowns, instant search, and 1-click resume links is significantly faster for bulk triage, while the Kanban board is ideal for visualizing final-stage candidates in `SCREENING`, `INTERVIEW`, and `OFFER`.

### 6. Resilient Storage Layer (`Supabase PostgreSQL` + Automatic Local Fallback)
- **Decision:** `src/lib/store.ts` automatically uses Prisma + Supabase PostgreSQL whenever `DATABASE_URL` is configured, and gracefully falls back to a local file-persisted store if `DATABASE_URL` is omitted or unreachable.
- **Why / Trade-off:** Guarantees the app works out-of-the-box on first clone (`npm run dev`) before external credentials are added, and switches seamlessly to production Supabase PostgreSQL as soon as `DATABASE_URL` is provided.

---

## 6. Database Schema Design (`prisma/schema.prisma`)

We use two primary relational tables in PostgreSQL:

1. **`Job`**:
   - Primary fields: `id` (CUID), `title`, `department`, `location`, `type`, `salaryRange`, `description`, `status` (`OPEN` | `CLOSED`), `createdAt`, `updatedAt`.
   - Relation: `applications Application[]`
   - Indexes: `@@index([status])`, `@@index([createdAt])`
2. **`Application`**:
   - Primary fields: `id` (CUID), `jobId` (Foreign Key), `candidateName`, `candidateEmail`, `resumeUrl`, `resumeName`, `coverNote`, `status` (`NEW` | `SCREENING` | `INTERVIEW` | `OFFER` | `REJECTED`), `createdAt`, `updatedAt`.
   - Relation: `job Job @relation(fields: [jobId], references: [id], onDelete: Cascade)` — deleting a job cleanly cascades to its applications.
   - Indexes: `@@index([jobId])`, `@@index([status])`, `@@index([candidateEmail])`, `@@index([createdAt])` — optimizes our most frequent recruiter queries (filtering by job/status and searching by email).

---

## 7. API Reference

| Method & Endpoint | Description | Request Body / Query Params |
| :--- | :--- | :--- |
| `GET /api/jobs` | List all jobs with application counts & system mode | — |
| `POST /api/jobs` | Create a new job posting | `{ title, department, location, type?, salaryRange?, description }` |
| `PATCH /api/jobs/[id]` | Open/close or update a job posting | `{ status?: "OPEN" \| "CLOSED", title?, description? }` |
| `DELETE /api/jobs/[id]` | Delete a job and its applications | — |
| `GET /api/applications` | List applications with optional filters | `?jobId=...&status=NEW&search=maya` |
| `POST /api/applications` | Submit a new candidate application | `{ jobId, candidateName, candidateEmail, resumeUrl, resumeName?, coverNote? }` |
| `PATCH /api/applications/[id]` | Update candidate pipeline status & trigger email | `{ status: "NEW" \| "SCREENING" \| "INTERVIEW" \| "OFFER" \| "REJECTED" }` |
| `DELETE /api/applications/[id]` | Remove a candidate application | — |
| `POST /api/upload` | Upload a resume file (≤ 5 MB, PDF/DOC/DOCX) | `multipart/form-data` (`file`) |
| `POST /api/seed` | Reset and seed LedgerPro demo jobs & candidates | — |

---

## 8. Local Development Setup

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. (Optional) Copy environment variables template
cp .env.example .env

# 3. If DATABASE_URL is configured in .env, push the Prisma schema to Supabase:
npm run db:push

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Recruiter Dashboard, or [http://localhost:3000/careers](http://localhost:3000/careers) for the Public Candidate Job Board.

---

## 9. Supabase & Resend Configuration Guide

1. **Supabase PostgreSQL (`DATABASE_URL`)**:
   - Create a free project at [supabase.com](https://supabase.com).
   - Click **Connect** (top bar) → **ORMs** → **Prisma** (or copy the **Session Pooler** connection string on port `5432`).
   - Paste it into `.env` as `DATABASE_URL="postgresql://..."` and run `npx prisma db push`.
2. **Supabase Storage (`NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`)**:
   - In Supabase Dashboard → **Project Settings** → **API**:
     - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
     - Copy **`service_role` secret key** into `SUPABASE_SERVICE_ROLE_KEY`.
   - Our uploader (`src/lib/storage.ts`) will automatically create the public `resumes` bucket on the first file upload if it doesn't exist yet!
3. **Resend Email (`RESEND_API_KEY`)**:
   - Create a free API key at [resend.com](https://resend.com) and set `RESEND_API_KEY="re_..."` in `.env`.
   - Leave empty to run in **Mock Mode** (all emails are logged and previewable in the UI).

---

## 10. Deploying to Railway (Public URL)

1. Push this repository to **GitHub**.
2. Log in to [Railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. In your Railway service → **Variables**, add:
   - `DATABASE_URL` (your Supabase PostgreSQL connection string)
   - `NEXT_PUBLIC_SUPABASE_URL` (your Supabase project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (your Supabase service role key)
   - `RESEND_API_KEY` (optional — works in Mock Mode if omitted)
4. In Railway **Settings** → **Networking**, click **Generate Domain** to get your public `*.up.railway.app` URL!

---

## 11. Future Roadmap (What We Would Build Next)

If given additional time beyond the take-home scope, we would prioritize:
1. **Authentication & Role-Based Access (NextAuth / Supabase Auth)**: Separate recruiter login from the public `/careers` portal and support Hiring Manager vs. Recruiter permissions.
2. **Bulk Actions & Keyboard Shortcuts**: Select multiple candidates in the Table View to batch-reject or batch-advance with `J`/`K` keyboard navigation.
3. **Structured Interview Scorecards & Internal Notes**: Allow interviewers to leave 1–5 star rubric ratings and timestamped notes on each candidate's timeline.
4. **Cursor-Based Pagination**: Scale the table view from hundreds to tens of thousands of applications using server-side cursor pagination.
