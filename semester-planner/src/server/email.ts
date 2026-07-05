/**
 * Env-gated email delivery via Resend's REST API (no SDK dependency).
 * When RESEND_API_KEY is unset the whole layer is a silent no-op, so the app
 * works identically in dev and in deployments without email configured.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface EmailMessage {
  to: string[];
  subject: string;
  text: string;
}

/** Best-effort send: never throws — notification emails must not break the mutation that triggered them. */
export async function sendEmail({ to, subject, text }: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || to.length === 0) return;
  const from = process.env.EMAIL_FROM ?? 'Semester Planner <onboarding@resend.dev>';
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!response.ok) {
      console.error(`[email] Resend responded ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('[email] delivery failed', error);
  }
}
