import { createClient } from "@supabase/supabase-js";

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit per assignment spec

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export interface UploadResumeResult {
  resumeUrl: string;
  resumeName: string;
  storageProvider: "supabase" | "inline-fallback";
}

/**
 * Handles resume file validation and upload to Supabase Storage.
 *
 * Design Decisions:
 * 1. Enforces a strict ~5 MB file size limit on the server to protect storage quotas
 *    and prevent slow uploads.
 * 2. Uses Supabase Storage (`resumes` bucket) when `NEXT_PUBLIC_SUPABASE_URL` and
 *    `SUPABASE_SERVICE_ROLE_KEY` are configured, including auto-creating the public
 *    bucket if it hasn't been created yet.
 * 3. Falls back gracefully to an inline Base64 Data URI if Supabase Storage keys
 *    are not configured or if bucket permissions are restricted, ensuring candidate
 *    applications never fail during local evaluation or live demos.
 */
export async function uploadResumeFile(file: File): Promise<UploadResumeResult> {
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    throw new Error(
      `Resume file size (${(file.size / (1024 * 1024)).toFixed(
        2
      )} MB) exceeds the 5 MB limit.`
    );
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
  const isAllowedExtension = ["pdf", "doc", "docx"].includes(fileExtension);

  if (
    !ALLOWED_MIME_TYPES.includes(file.type) &&
    !isAllowedExtension
  ) {
    throw new Error(
      "Invalid file format. Please upload a PDF, DOC, or DOCX resume."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "resumes";

  // 1. Upload to Supabase Storage if configured
  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("[PROJECT-REF]") &&
    !supabaseKey.includes("your-supabase")
  ) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `applications/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}-${sanitizedName}`;

      let { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      // If the bucket does not exist yet, attempt to create it automatically and retry
      if (
        uploadError &&
        (uploadError.message.toLowerCase().includes("not found") ||
          uploadError.message.toLowerCase().includes("bucket"))
      ) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: MAX_RESUME_SIZE_BYTES,
        });

        const retry = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type || "application/pdf",
            upsert: false,
          });
        uploadError = retry.error;
      }

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return {
          resumeUrl: publicUrlData.publicUrl,
          resumeName: file.name,
          storageProvider: "supabase",
        };
      }

      console.warn(
        `[Storage Service] Supabase Storage upload returned error (${uploadError.message}). Falling back to inline resume storage.`
      );
    } catch (err) {
      console.warn(
        "[Storage Service] Error connecting to Supabase Storage, using inline fallback:",
        err
      );
    }
  }

  // 2. Fallback: Encode as Data URI so the recruiter can still view/download the exact file
  const mimeType = file.type || "application/pdf";
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    resumeUrl: dataUrl,
    resumeName: file.name,
    storageProvider: "inline-fallback",
  };
}
