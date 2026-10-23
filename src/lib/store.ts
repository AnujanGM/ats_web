import fs from "fs";
import path from "path";
import { prisma, isDatabaseConfigured } from "./prisma";
import { LEDGERPRO_SEED_JOBS } from "./seed-data";
import {
  ApplicationStatus,
  ApplicationWithJob,
  JobStatus,
  JobWithCounts,
} from "./types";

const LOCAL_STORE_PATH = path.join(process.cwd(), ".local-ats-store.json");

interface LocalStoreState {
  jobs: JobWithCounts[];
  applications: ApplicationWithJob[];
}

function buildInitialLocalState(): LocalStoreState {
  const now = Date.now();
  const jobs: JobWithCounts[] = [];
  const applications: ApplicationWithJob[] = [];

  LEDGERPRO_SEED_JOBS.forEach((seedJob, jobIdx) => {
    const jobId = `job_${jobIdx + 1}`;
    const createdAt = new Date(
      now - (15 - jobIdx * 2) * 24 * 60 * 60 * 1000
    ).toISOString();

    jobs.push({
      id: jobId,
      title: seedJob.title,
      department: seedJob.department,
      location: seedJob.location,
      type: seedJob.type,
      salaryRange: seedJob.salaryRange,
      description: seedJob.description,
      status: seedJob.status,
      createdAt,
      updatedAt: createdAt,
      _count: { applications: seedJob.applications.length },
    });

    seedJob.applications.forEach((app, appIdx) => {
      const appCreatedAt = new Date(
        now - app.daysAgo * 24 * 60 * 60 * 1000
      ).toISOString();

      applications.push({
        id: `app_${jobIdx + 1}_${appIdx + 1}`,
        jobId,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        resumeUrl: app.resumeUrl,
        resumeName: app.resumeName,
        coverNote: app.coverNote,
        status: app.status,
        createdAt: appCreatedAt,
        updatedAt: appCreatedAt,
        job: {
          id: jobId,
          title: seedJob.title,
          department: seedJob.department,
          location: seedJob.location,
        },
      });
    });
  });

  return { jobs, applications };
}

function readLocalStore(): LocalStoreState {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as LocalStoreState;
      if (Array.isArray(parsed.jobs) && Array.isArray(parsed.applications)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[ATS Store] Could not read local fallback store:", err);
  }
  const initial = buildInitialLocalState();
  writeLocalStore(initial);
  return initial;
}

function writeLocalStore(state: LocalStoreState): void {
  try {
    // Recompute _count.applications on each job
    const updatedJobs = state.jobs.map((job) => ({
      ...job,
      _count: {
        applications: state.applications.filter((a) => a.jobId === job.id)
          .length,
      },
    }));
    fs.writeFileSync(
      LOCAL_STORE_PATH,
      JSON.stringify({ jobs: updatedJobs, applications: state.applications }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("[ATS Store] Could not persist local fallback store:", err);
  }
}

/**
 * Seeds the Prisma PostgreSQL database if empty or when explicitly triggered.
 */
export async function seedDatabase(resetExisting = false): Promise<{
  jobsCreated: number;
  applicationsCreated: number;
  storageMode: "supabase-prisma" | "local-fallback";
}> {
  if (isDatabaseConfigured()) {
    try {
      if (resetExisting) {
        await prisma.application.deleteMany({});
        await prisma.job.deleteMany({});
      } else {
        const existingCount = await prisma.job.count();
        if (existingCount > 0) {
          const appCount = await prisma.application.count();
          return {
            jobsCreated: existingCount,
            applicationsCreated: appCount,
            storageMode: "supabase-prisma",
          };
        }
      }

      let jobsCreated = 0;
      let applicationsCreated = 0;
      const now = Date.now();

      for (const seedJob of LEDGERPRO_SEED_JOBS) {
        const createdJob = await prisma.job.create({
          data: {
            title: seedJob.title,
            department: seedJob.department,
            location: seedJob.location,
            type: seedJob.type,
            salaryRange: seedJob.salaryRange,
            description: seedJob.description,
            status: seedJob.status,
          },
        });
        jobsCreated++;

        for (const seedApp of seedJob.applications) {
          const createdAt = new Date(
            now - seedApp.daysAgo * 24 * 60 * 60 * 1000
          );
          await prisma.application.create({
            data: {
              jobId: createdJob.id,
              candidateName: seedApp.candidateName,
              candidateEmail: seedApp.candidateEmail,
              resumeUrl: seedApp.resumeUrl,
              resumeName: seedApp.resumeName,
              coverNote: seedApp.coverNote,
              status: seedApp.status,
              createdAt,
            },
          });
          applicationsCreated++;
        }
      }

      return {
        jobsCreated,
        applicationsCreated,
        storageMode: "supabase-prisma",
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma seed error, falling back to local store:",
        err
      );
    }
  }

  const initial = buildInitialLocalState();
  writeLocalStore(initial);
  return {
    jobsCreated: initial.jobs.length,
    applicationsCreated: initial.applications.length,
    storageMode: "local-fallback",
  };
}

/**
 * Lists all jobs ordered by creation date descending, including application counts.
 */
export async function listJobs(): Promise<{
  jobs: JobWithCounts[];
  storageMode: "supabase-prisma" | "local-fallback";
}> {
  if (isDatabaseConfigured()) {
    try {
      let jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });

      // Auto-seed on very first run if database is completely empty
      if (jobs.length === 0) {
        await seedDatabase(false);
        jobs = await prisma.job.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        });
      }

      return {
        jobs: jobs.map((j) => ({
          ...j,
          createdAt: j.createdAt.toISOString(),
          updatedAt: j.updatedAt.toISOString(),
        })),
        storageMode: "supabase-prisma",
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma listJobs failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const jobsWithCounts = state.jobs.map((job) => ({
    ...job,
    _count: {
      applications: state.applications.filter((a) => a.jobId === job.id).length,
    },
  }));
  return { jobs: jobsWithCounts, storageMode: "local-fallback" };
}

/**
 * Creates a new job posting.
 */
export async function createJob(input: {
  title: string;
  department: string;
  location: string;
  type?: string;
  salaryRange?: string;
  description: string;
}): Promise<JobWithCounts> {
  if (isDatabaseConfigured()) {
    try {
      const created = await prisma.job.create({
        data: {
          title: input.title.trim(),
          department: input.department.trim(),
          location: input.location.trim(),
          type: input.type?.trim() || "Full-time",
          salaryRange: input.salaryRange?.trim() || null,
          description: input.description.trim(),
          status: "OPEN",
        },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });
      return {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma createJob failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const now = new Date().toISOString();
  const newJob: JobWithCounts = {
    id: `job_${Date.now()}`,
    title: input.title.trim(),
    department: input.department.trim(),
    location: input.location.trim(),
    type: input.type?.trim() || "Full-time",
    salaryRange: input.salaryRange?.trim() || null,
    description: input.description.trim(),
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
    _count: { applications: 0 },
  };
  state.jobs.unshift(newJob);
  writeLocalStore(state);
  return newJob;
}

/**
 * Updates a job's status (OPEN / CLOSED) or details.
 */
export async function updateJob(
  id: string,
  data: { status?: JobStatus; title?: string; description?: string }
): Promise<JobWithCounts | null> {
  if (isDatabaseConfigured()) {
    try {
      const updated = await prisma.job.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      });
      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma updateJob failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const idx = state.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  state.jobs[idx] = {
    ...state.jobs[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(state);
  return state.jobs[idx];
}

/**
 * Deletes a job and cascades to its applications.
 */
export async function deleteJob(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      await prisma.job.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma deleteJob failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const prevLen = state.jobs.length;
  state.jobs = state.jobs.filter((j) => j.id !== id);
  state.applications = state.applications.filter((a) => a.jobId !== id);
  writeLocalStore(state);
  return state.jobs.length < prevLen;
}

/**
 * Lists applications with optional filtering by jobId, status, and search query.
 */
export async function listApplications(filters?: {
  jobId?: string;
  status?: ApplicationStatus | "ALL";
  search?: string;
}): Promise<ApplicationWithJob[]> {
  const jobId =
    filters?.jobId && filters.jobId !== "ALL" ? filters.jobId : undefined;
  const status =
    filters?.status && filters.status !== "ALL" ? filters.status : undefined;
  const search = filters?.search?.trim() || undefined;

  if (isDatabaseConfigured()) {
    try {
      const apps = await prisma.application.findMany({
        where: {
          ...(jobId ? { jobId } : {}),
          ...(status ? { status } : {}),
          ...(search
            ? {
                OR: [
                  {
                    candidateName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    candidateEmail: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return apps.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma listApplications failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  return state.applications
    .filter((app) => {
      if (jobId && app.jobId !== jobId) return false;
      if (status && app.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = app.candidateName.toLowerCase().includes(q);
        const matchesEmail = app.candidateEmail.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Submits a new candidate application.
 */
export async function createApplication(input: {
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl: string;
  resumeName?: string | null;
  coverNote?: string | null;
}): Promise<ApplicationWithJob> {
  if (isDatabaseConfigured()) {
    try {
      const created = await prisma.application.create({
        data: {
          jobId: input.jobId,
          candidateName: input.candidateName.trim(),
          candidateEmail: input.candidateEmail.trim().toLowerCase(),
          resumeUrl: input.resumeUrl.trim(),
          resumeName: input.resumeName || null,
          coverNote: input.coverNote?.trim() || null,
          status: "NEW",
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
            },
          },
        },
      });

      return {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma createApplication failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const job = state.jobs.find((j) => j.id === input.jobId);
  if (!job) {
    throw new Error("Selected job posting does not exist.");
  }

  const now = new Date().toISOString();
  const newApp: ApplicationWithJob = {
    id: `app_${Date.now()}`,
    jobId: input.jobId,
    candidateName: input.candidateName.trim(),
    candidateEmail: input.candidateEmail.trim().toLowerCase(),
    resumeUrl: input.resumeUrl.trim(),
    resumeName: input.resumeName || null,
    coverNote: input.coverNote?.trim() || null,
    status: "NEW",
    createdAt: now,
    updatedAt: now,
    job: {
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
    },
  };

  state.applications.unshift(newApp);
  writeLocalStore(state);
  return newApp;
}

/**
 * Updates an application's status in the hiring pipeline.
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<ApplicationWithJob | null> {
  if (isDatabaseConfigured()) {
    try {
      const updated = await prisma.application.update({
        where: { id },
        data: { status },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
            },
          },
        },
      });
      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma updateApplicationStatus failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const idx = state.applications.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  state.applications[idx] = {
    ...state.applications[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeLocalStore(state);
  return state.applications[idx];
}

/**
 * Deletes an application by ID.
 */
export async function deleteApplication(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      await prisma.application.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn(
        "[ATS Store] Prisma deleteApplication failed, using local fallback:",
        err
      );
    }
  }

  const state = readLocalStore();
  const prevLen = state.applications.length;
  state.applications = state.applications.filter((a) => a.id !== id);
  writeLocalStore(state);
  return state.applications.length < prevLen;
}
