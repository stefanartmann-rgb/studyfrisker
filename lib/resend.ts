import { Resend, type CreateEmailResponse } from "resend";

/**
 * Generic Resend email helper.
 *
 * Reads RESEND_API_KEY from the environment. Server-side only.
 */

let client: Resend | null = null;

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing environment variable: RESEND_API_KEY");
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export interface SendReportOptions {
  /** Verified sender address, e.g. "Reports <reports@example.com>". */
  from: string;
  /** One or more recipient addresses. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** HTML body of the report. */
  html: string;
  /** Optional plain-text fallback body. */
  text?: string;
}

/**
 * Send a report email via Resend.
 */
export async function sendReport(
  options: SendReportOptions,
): Promise<CreateEmailResponse> {
  return getClient().emails.send({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
  });
}
