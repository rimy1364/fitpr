import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHours } from "date-fns";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: user.email, usedAt: null },
      data: { usedAt: new Date() },
    });

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        expiresAt: addHours(new Date(), 1),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password/${resetToken.token}`;

    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    await resend?.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@fitpr.com",
      to: user.email,
      subject: "Reset your FitPR password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #10b981;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your FitPR password. Click the button below to set a new password.</p>
          <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #10b981; color: white; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #9ca3af; font-size: 12px;">FitPR — The fitness platform for modern organisations.</p>
        </div>
      `,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
