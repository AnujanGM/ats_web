import { NextRequest, NextResponse } from "next/server";
import { uploadResumeFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume file provided." },
        { status: 400 }
      );
    }

    const uploadResult = await uploadResumeFile(file);
    return NextResponse.json(uploadResult, { status: 201 });
  } catch (error) {
    console.error("[POST /api/upload] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
