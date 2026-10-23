import { NextRequest, NextResponse } from "next/server";
import { createApplication, listApplications } from "@/lib/store";
import { sendCandidateStatusEmail } from "@/lib/email";
import { ApplicationStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId") || undefined;
    const status =
      (searchParams.get("status") as ApplicationStatus | "ALL" | null) ||
      undefined;
    const search = searchParams.get("search") || undefined;

    const applications = await listApplications({ jobId, status, search });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[GET /api/applications] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      candidateName,
      candidateEmail,
      resumeUrl,
      resumeName,
      coverNote,
    } = body;

    if (
      !jobId?.trim() ||
      !candidateName?.trim() ||
      !candidateEmail?.trim() ||
      !resumeUrl?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Job selection, candidate name, email, and resume (file or link) are required.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(candidateEmail.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const application = await createApplication({
      jobId,
      candidateName,
      candidateEmail,
      resumeUrl,
      resumeName,
      coverNote,
    });

    // Send best-effort confirmation email (NEW stage)
    const emailResult = await sendCandidateStatusEmail({
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      jobTitle: application.job.title,
      department: application.job.department,
      newStatus: "NEW",
    });

    return NextResponse.json(
      { application, emailNotification: emailResult },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/applications] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
