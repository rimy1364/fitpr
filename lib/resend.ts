import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@fitpr.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface InviteEmailParams {
  to: string;
  name: string;
  orgName: string;
  role: "ORG_ADMIN" | "TRAINER" | "CLIENT";
  setupUrl: string;
}

export async function sendInviteEmail({ to, name, orgName, role, setupUrl }: InviteEmailParams) {
  const roleLabel = { ORG_ADMIN: "Admin", TRAINER: "Trainer", CLIENT: "Client" }[role];

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Welcome to ${orgName} on FitPR!</h2>
      <p>Hi ${name},</p>
      <p>You've been invited as a <strong>${roleLabel}</strong> to <strong>${orgName}</strong>.</p>
      <p>Click the button below to set up your account. This link expires in 48 hours.</p>
      <a href="${setupUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Set Up My Account
      </a>
      <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${setupUrl}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">FitPR — The fitness platform for modern organizations.</p>
    </div>
  `;

  try {
    await getResend()?.emails.send({
      from: FROM,
      to,
      subject: `You're invited to ${orgName} on FitPR`,
      html,
    });
  } catch (err) {
    console.error("Failed to send invite email:", err);
    // Don't throw — log and continue; admin can resend
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Welcome to FitPR, ${name}!</h2>
      <p>Your account is ready. Let's start your fitness journey.</p>
      <a href="${APP_URL}/login" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>
  `;

  await getResend()?.emails.send({ from: FROM, to, subject: "Welcome to FitPR!", html }).catch(console.error);
}

export async function sendVideoReviewedEmail(to: string, clientName: string, exerciseName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Your form video has been reviewed!</h2>
      <p>Hi ${clientName},</p>
      <p>Your trainer has reviewed your <strong>${exerciseName}</strong> form video and left feedback.</p>
      <a href="${APP_URL}/client/videos" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        View Feedback
      </a>
    </div>
  `;

  await getResend()?.emails.send({
    from: FROM,
    to,
    subject: `Your ${exerciseName} form video was reviewed`,
    html,
  }).catch(console.error);
}

export async function sendPaymentReceiptEmail(to: string, clientName: string, amount: number, planName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Payment Confirmed</h2>
      <p>Hi ${clientName},</p>
      <p>Your payment of <strong>$${(amount / 100).toFixed(2)}</strong> for <strong>${planName}</strong> has been received.</p>
      <a href="${APP_URL}/client/payments" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        View Payment History
      </a>
    </div>
  `;

  await getResend()?.emails.send({ from: FROM, to, subject: "Payment Confirmed — FitPR", html }).catch(console.error);
}

export async function sendCheckInReminderEmail(to: string, clientName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Don't forget your daily check-in!</h2>
      <p>Hi ${clientName},</p>
      <p>You haven't logged your check-in today. Keep your streak going!</p>
      <a href="${APP_URL}/client/checkin" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Log Check-In
      </a>
    </div>
  `;

  await getResend()?.emails.send({ from: FROM, to, subject: "Daily Check-In Reminder — FitPR", html }).catch(console.error);
}
