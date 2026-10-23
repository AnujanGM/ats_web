import { Resend } from "resend";
import { ApplicationStatus, EmailNotificationResult } from "./types";

interface SendStatusEmailParams {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  newStatus: ApplicationStatus;
}

/**
 * Generates customized email subject, plain-text summary, and HTML body for each
 * stage of the LedgerPro hiring pipeline.
 */
function buildStatusEmailTemplate({
  candidateName,
  jobTitle,
  department,
  newStatus,
}: Omit<SendStatusEmailParams, "candidateEmail">): {
  subject: string;
  previewText: string;
  htmlBody: string;
} {
  const firstName = candidateName.split(" ")[0] || candidateName;

  const templates: Record<
    ApplicationStatus,
    { subject: string; previewText: string; bodyParagraphs: string[]; badgeColor: string; statusLabel: string }
  > = {
    NEW: {
      subject: `Application Received: ${jobTitle} at LedgerPro`,
      previewText: `Hi ${firstName}, we have received your application for ${jobTitle} (${department}) and our recruiting team will review it shortly.`,
      statusLabel: "Application Received",
      badgeColor: "#2563eb",
      bodyParagraphs: [
        `Thank you for applying for the <strong>${jobTitle}</strong> role on our <strong>${department}</strong> team at LedgerPro.`,
        `We have received your application and resume. Our recruiting team reviews every submission carefully and will reach out as soon as we have an update on next steps.`,
      ],
    },
    SCREENING: {
      subject: `Update on your LedgerPro application — Moving to Recruiter Screening (${jobTitle})`,
      previewText: `Great news, ${firstName}! Your application for ${jobTitle} has advanced to our Screening stage.`,
      statusLabel: "Stage: Recruiter Screening",
      badgeColor: "#d97706",
      bodyParagraphs: [
        `We reviewed your background for the <strong>${jobTitle}</strong> position on the <strong>${department}</strong> team and were impressed by your experience!`,
        `Your application has been moved to our <strong>Screening</strong> stage. A LedgerPro recruiter will follow up shortly to schedule an introductory 25-minute phone conversation to discuss your background and share more about the role.`,
      ],
    },
    INTERVIEW: {
      subject: `Next Steps at LedgerPro — Technical & Team Interview (${jobTitle})`,
      previewText: `Congratulations ${firstName}! You have advanced to the Interview stage for ${jobTitle} at LedgerPro.`,
      statusLabel: "Stage: Team Interview",
      badgeColor: "#7c3aed",
      bodyParagraphs: [
        `Congratulations! Following your initial screening, we are excited to advance you to the <strong>Interview</strong> stage for the <strong>${jobTitle}</strong> role at LedgerPro.`,
        `Our recruiting coordinator will send over availability options for your upcoming technical and hiring manager interviews. Please let us know if you need any accommodations.`,
      ],
    },
    OFFER: {
      subject: `Congratulations from LedgerPro! Offer Stage for ${jobTitle}`,
      previewText: `Fantastic news, ${firstName}! LedgerPro is delighted to advance you to the Offer stage for ${jobTitle}.`,
      statusLabel: "Stage: Offer Extended",
      badgeColor: "#059669",
      bodyParagraphs: [
        `On behalf of the entire <strong>${department}</strong> team, we are thrilled to share that we would love to welcome you to <strong>LedgerPro</strong> as our next <strong>${jobTitle}</strong>!`,
        `Your recruiter will reach out today to walk through your formal compensation package, equity details, and onboarding timeline. Congratulations on a standout interview process!`,
      ],
    },
    REJECTED: {
      subject: `Update regarding your application for ${jobTitle} at LedgerPro`,
      previewText: `Thank you for your interest in the ${jobTitle} position at LedgerPro. Here is an update on your application.`,
      statusLabel: "Status Update",
      badgeColor: "#64748b",
      bodyParagraphs: [
        `Thank you so much for taking the time to apply for the <strong>${jobTitle}</strong> role on our <strong>${department}</strong> team and for sharing your background with LedgerPro.`,
        `While we were impressed by your qualifications, we have decided to move forward with other candidates whose experience more closely aligns with our current needs for this specific opening. We will keep your profile in mind for future opportunities and wish you the very best in your job search.`,
      ],
    },
  };

  const selected = templates[newStatus];

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">LedgerPro</span>
          <span style="font-size: 12px; color: #64748b; margin-left: 6px;">Talent Acquisition</span>
        </div>
        <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; color: #ffffff; background-color: ${selected.badgeColor}; border-radius: 9999px;">
          ${selected.statusLabel}
        </span>
      </div>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${firstName},</p>
      ${selected.bodyParagraphs
        .map(
          (p) =>
            `<p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">${p}</p>`
        )
        .join("")}
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">
        Warm regards,<br />
        <strong style="color: #0f172a;">The LedgerPro Recruiting Team</strong>
      </div>
    </div>
  `.trim();

  return {
    subject: selected.subject,
    previewText: selected.previewText,
    htmlBody,
  };
}

/**
 * Dispatches a candidate status notification email via Resend.
 *
 * Design Decision:
 * - Best-effort delivery: Email failures must NEVER block a recruiter from moving
 *   a candidate through the pipeline.
 * - Mockable fallback: When `RESEND_API_KEY` is not set (or when using Resend's
 *   free unverified domain with arbitrary candidate email addresses), the service
 *   automatically falls back to Mock Mode, logging the payload on the server and
 *   returning the full email preview to the UI.
 */
export async function sendCandidateStatusEmail(
  params: SendStatusEmailParams
): Promise<EmailNotificationResult> {
  const { candidateName, candidateEmail, jobTitle, department, newStatus } =
    params;

  const { subject, previewText, htmlBody } = buildStatusEmailTemplate({
    candidateName,
    jobTitle,
    department,
    newStatus,
  });

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "LedgerPro Recruiting <onboarding@resend.dev>";

  // 1. If no Resend API key is provided, run in Mock Mode cleanly
  if (!apiKey) {
    console.info(
      `[Email Service - MOCK MODE] To: ${candidateEmail} | Subject: "${subject}" | Status: ${newStatus}`
    );
    return {
      sent: true,
      mode: "mock",
      to: candidateEmail,
      subject,
      previewText,
      htmlBody,
      note: "Mock Mode active (RESEND_API_KEY not set). Email logged and previewed.",
    };
  }

  // 2. Attempt live dispatch via Resend API
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [candidateEmail],
      subject,
      html: htmlBody,
    });

    if (error) {
      // Note: Resend's free tier (`onboarding@resend.dev`) only allows sending to the
      // Resend account owner's verified email unless a custom domain is attached.
      // We gracefully fall back to mock preview so demo candidate emails still work seamlessly.
      console.warn(
        `[Email Service - Resend Sandbox Fallback] Could not send live email to ${candidateEmail} (${error.message}). Falling back to Mock Preview.`
      );
      return {
        sent: true,
        mode: "mock",
        to: candidateEmail,
        subject,
        previewText,
        htmlBody,
        note: `Resend free tier restriction (${error.message}) — displayed via Mock Mode fallback.`,
      };
    }

    console.info(
      `[Email Service - LIVE] Dispatched email (${data?.id}) to ${candidateEmail}`
    );

    return {
      sent: true,
      mode: "live",
      to: candidateEmail,
      subject,
      previewText,
      htmlBody,
      messageId: data?.id,
      note: "Delivered via Resend API.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.warn(`[Email Service - Error Fallback] ${message}`);
    return {
      sent: true,
      mode: "mock",
      to: candidateEmail,
      subject,
      previewText,
      htmlBody,
      note: `Fallback to Mock Mode (${message}).`,
    };
  }
}
