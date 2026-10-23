import { NextRequest, NextResponse } from "next/server";
import { deleteJob, updateJob } from "@/lib/store";
import { JobStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, title, description } = body as {
      status?: JobStatus;
      title?: string;
      description?: string;
    };

    if (status && status !== "OPEN" && status !== "CLOSED") {
      return NextResponse.json(
        { error: "Invalid job status. Must be OPEN or CLOSED." },
        { status: 400 }
      );
    }

    const updated = await updateJob(id, { status, title, description });
    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job: updated });
  } catch (error) {
    console.error("[PATCH /api/jobs/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update job posting." },
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
    const deleted = await deleteJob(id);
    if (!deleted) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/jobs/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete job posting." },
      { status: 500 }
    );
  }
}
