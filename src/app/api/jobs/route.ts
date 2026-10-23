import { NextRequest, NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/store";

export async function GET() {
  try {
    const { jobs, storageMode } = await listJobs();
    return NextResponse.json({
      jobs,
      storageMode,
      emailMode: process.env.RESEND_API_KEY?.trim() ? "live" : "mock",
    });
  } catch (error) {
    console.error("[GET /api/jobs] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job postings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, department, location, type, salaryRange, description } =
      body;

    if (!title?.trim() || !department?.trim() || !location?.trim() || !description?.trim()) {
      return NextResponse.json(
        {
          error:
            "Title, department, location, and job description are required.",
        },
        { status: 400 }
      );
    }

    const job = await createJob({
      title,
      department,
      location,
      type,
      salaryRange,
      description,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/jobs] Error:", error);
    return NextResponse.json(
      { error: "Failed to create job posting." },
      { status: 500 }
    );
  }
}
