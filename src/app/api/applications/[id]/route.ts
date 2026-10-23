import { NextRequest, NextResponse } from "next/server";
import { deleteApplication, updateApplicationStatus } from "@/lib/store";
import { sendCandidateStatusEmail } from "@/lib/email";
import { APPLICATION_STATUS_ORDER, ApplicationStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body as { status?: ApplicationStatus };

    if (!status || !APPLICATION_STATUS_ORDER.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid pipeline status. Allowed values: ${APPLICATION_STATUS_ORDER.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const updated = await updateApplicationStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    // Automatically trigger candidate status notification email (live via Resend or Mock Mode)
    const emailNotification = await sendCandidateStatusEmail({
      candidateName: updated.candidateName,
      candidateEmail: updated.candidateEmail,
      jobTitle: updated.job.title,
      department: updated.job.department,
      newStatus: updated.status,
    });

    return NextResponse.json({
      application: updated,
      emailNotification,
    });
  } catch (error) {
    console.error("[PATCH /api/applications/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update application status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteApplication(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/applications/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete application." },
      { status: 500 }
    );
  }
}
