import { ApplicationStatus, JobStatus } from "./types";

export interface SeedJobInput {
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string;
  description: string;
  status: JobStatus;
  applications: {
    candidateName: string;
    candidateEmail: string;
    resumeUrl: string;
    resumeName: string;
    coverNote: string;
    status: ApplicationStatus;
    daysAgo: number;
  }[];
}

export const LEDGERPRO_SEED_JOBS: SeedJobInput[] = [
  {
    title: "Senior Full-Stack Software Engineer",
    department: "Core Ledger & Platform",
    location: "San Francisco, CA (Hybrid)",
    type: "Full-time",
    salaryRange: "$165,000 – $195,000",
    status: "OPEN",
    description:
      "Own end-to-end product engineering for LedgerPro's real-time financial reconciliation platform. You will build high-throughput TypeScript/Next.js workflows, design resilient PostgreSQL schemas, and collaborate closely with accounting and treasury customers.",
    applications: [
      {
        candidateName: "Maya Lin",
        candidateEmail: "maya.lin@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Maya_Lin_Senior_FullStack_Resume.pdf",
        coverNote:
          "5+ years building B2B fintech dashboards at Stripe and Mercury using Next.js, TypeScript, and PostgreSQL. Excited about LedgerPro's automated multi-entity reconciliation engine.",
        status: "INTERVIEW",
        daysAgo: 6,
      },
      {
        candidateName: "Marcus Vance",
        candidateEmail: "marcus.vance@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Marcus_Vance_Resume_2026.pdf",
        coverNote:
          "Led the migration of a legacy accounting portal to Next.js App Router + Prisma serving 12,000 daily finance users. Would love to bring that experience to LedgerPro.",
        status: "OFFER",
        daysAgo: 9,
      },
      {
        candidateName: "Priya Nair",
        candidateEmail: "priya.nair@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Priya_Nair_SWE_Resume.pdf",
        coverNote:
          "Full-stack engineer specializing in TypeScript, React Server Components, and complex financial data tables with sub-50ms filtering.",
        status: "SCREENING",
        daysAgo: 3,
      },
      {
        candidateName: "Liam O'Connor",
        candidateEmail: "liam.oconnor@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Liam_OConnor_Resume.pdf",
        coverNote:
          "Software engineer with 4 years of experience in Node.js, GraphQL, and PostgreSQL. Passionate about developer tooling and clean financial UX.",
        status: "NEW",
        daysAgo: 1,
      },
      {
        candidateName: "Ethan Brooks",
        candidateEmail: "ethan.brooks@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Ethan_Brooks_CV.pdf",
        coverNote:
          "Frontend-focused engineer looking to transition into full-stack fintech engineering.",
        status: "REJECTED",
        daysAgo: 11,
      },
    ],
  },
  {
    title: "Staff Backend Engineer — Payment Rails",
    department: "Payments & Settlement",
    location: "Remote (US & Canada)",
    type: "Remote",
    salaryRange: "$185,000 – $220,000",
    status: "OPEN",
    description:
      "Architect LedgerPro's double-entry ledger engine and idempotent ACH/FedNow settlement pipelines. Requires deep experience with distributed transactions, PostgreSQL locking strategies, and high-reliability APIs.",
    applications: [
      {
        candidateName: "Elena Rostova",
        candidateEmail: "elena.rostova@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Elena_Rostova_Staff_Backend.pdf",
        coverNote:
          "7 years designing double-entry ledger systems in Go and TypeScript processing $4B+ in annual ACH volume with zero reconciliation drift.",
        status: "INTERVIEW",
        daysAgo: 5,
      },
      {
        candidateName: "Devon Morales",
        candidateEmail: "devon.morales@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Devon_Morales_Backend_Resume.pdf",
        coverNote:
          "Senior backend engineer with deep PostgreSQL performance tuning experience, partitioning high-volume transaction tables and building webhook delivery engines.",
        status: "SCREENING",
        daysAgo: 2,
      },
      {
        candidateName: "Kenji Takahashi",
        candidateEmail: "kenji.takahashi@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Kenji_Takahashi_Resume.pdf",
        coverNote:
          "Built settlement reconcilers and ISO-20022 payment parsers at a Series C treasury platform.",
        status: "NEW",
        daysAgo: 1,
      },
      {
        candidateName: "Hannah Abbott",
        candidateEmail: "hannah.abbott@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Hannah_Abbott_Resume.pdf",
        coverNote:
          "Backend developer experienced with Python and Django REST APIs across e-commerce platforms.",
        status: "REJECTED",
        daysAgo: 8,
      },
    ],
  },
  {
    title: "Senior Product Designer — Financial Workflows",
    department: "Product & Design",
    location: "New York, NY (Hybrid)",
    type: "Full-time",
    salaryRange: "$150,000 – $180,000",
    status: "OPEN",
    description:
      "Lead the design system and workflow UX for controllers, CFOs, and auditors using LedgerPro. Turn complex multi-currency journal entries and approval matrices into effortless, high-clarity interfaces.",
    applications: [
      {
        candidateName: "Sofia Alvarez",
        candidateEmail: "sofia.alvarez@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Sofia_Alvarez_Product_Design_Portfolio.pdf",
        coverNote:
          "Designed enterprise billing and tax workflows used by 5,000+ finance teams. Obsessed with keyboard-first data tables and zero-friction financial UX.",
        status: "SCREENING",
        daysAgo: 4,
      },
      {
        candidateName: "Noah Kim",
        candidateEmail: "noah.kim@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Noah_Kim_Design_Resume.pdf",
        coverNote:
          "Product designer who codes in Tailwind & React. Built the component library at a fintech startup from Seed to Series B.",
        status: "NEW",
        daysAgo: 1,
      },
    ],
  },
  {
    title: "Founding Solutions Engineer (CPA / Fintech)",
    department: "Customer Engineering",
    location: "Remote (US)",
    type: "Remote",
    salaryRange: "$140,000 – $170,000 + Equity",
    status: "CLOSED",
    description:
      "Partner directly with mid-market VP Finance and Controller buyers during technical evaluations, custom ERP integrations (NetSuite, QuickBooks, SAP), and enterprise onboarding.",
    applications: [
      {
        candidateName: "Rachel Greenwald",
        candidateEmail: "rachel.greenwald@example.com",
        resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        resumeName: "Rachel_Greenwald_Solutions_Engineer.pdf",
        coverNote:
          "Former Big-4 CPA turned Solutions Architect with 4 years building custom NetSuite and Salesforce integrations in TypeScript and Python.",
        status: "OFFER",
        daysAgo: 14,
      },
    ],
  },
];
