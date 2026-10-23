export type JobStatus = "OPEN" | "CLOSED";

export type ApplicationStatus =
  | "NEW"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED";

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "NEW",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export interface StatusMetadata {
  value: ApplicationStatus;
  label: string;
  shortDescription: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  stepNumber: number;
}

export const STATUS_CONFIG: Record<ApplicationStatus, StatusMetadata> = {
  NEW: {
    value: "NEW",
    label: "New",
    shortDescription: "Recently submitted, awaiting initial recruiter review",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    dotColor: "bg-blue-500",
    stepNumber: 1,
  },
  SCREENING: {
    value: "SCREENING",
    label: "Screening",
    shortDescription: "Resume shortlisted for recruiter phone screen",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    dotColor: "bg-amber-500",
    stepNumber: 2,
  },
  INTERVIEW: {
    value: "INTERVIEW",
    label: "Interview",
    shortDescription: "Active technical or hiring manager interview loop",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200",
    dotColor: "bg-purple-500",
    stepNumber: 3,
  },
  OFFER: {
    value: "OFFER",
    label: "Offer",
    shortDescription: "Finalist selected — formal offer extended",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    dotColor: "bg-emerald-500",
    stepNumber: 4,
  },
  REJECTED: {
    value: "REJECTED",
    label: "Rejected",
    shortDescription: "Archived — not moving forward for this role",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200",
    dotColor: "bg-rose-500",
    stepNumber: 5,
  },
};

export interface JobWithCounts {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string | null;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
  };
}

export interface ApplicationWithJob {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl: string;
  resumeName: string | null;
  coverNote: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  };
}

export interface EmailNotificationResult {
  sent: boolean;
  mode: "live" | "mock";
  to: string;
  subject: string;
  previewText: string;
  htmlBody: string;
  messageId?: string;
  note?: string;
}
